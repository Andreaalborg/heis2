import React, { useState, useRef, useCallback } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Paper, 
    Alert,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const Camera = () => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = useCallback(async () => {
        try {
            setError('');
            
            // Sjekk om getUserMedia er tilgjengelig
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia ikke tilgjengelig');
            }

            // Stopp eksisterende streams først
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            // Enklere constraints for bedre kompatibilitet
            const constraints = [
                { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
                { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
                { video: true, audio: false }
            ];

            let mediaStream = null;
            let lastError = null;

            for (const constraint of constraints) {
                try {
                    console.log('Prøver kamera med:', constraint);
                    mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
                    console.log('Kamera-tilgang vellykket med:', constraint);
                    break;
                } catch (err) {
                    lastError = err;
                    console.warn('Kamera-forsøk feilet:', constraint, err.name, err.message);
                }
            }

            if (!mediaStream) {
                throw lastError || new Error('Kunne ikke få tilgang til kamera');
            }
            
            setStream(mediaStream);
            setIsActive(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                
                // Bedre håndtering av video-loading
                return new Promise((resolve, reject) => {
                    const video = videoRef.current;
                    
                    const onLoadedData = () => {
                        console.log('Video data lastet:', video.videoWidth, 'x', video.videoHeight);
                        video.removeEventListener('loadeddata', onLoadedData);
                        video.removeEventListener('error', onError);
                        resolve();
                    };
                    
                    const onError = (err) => {
                        console.error('Video loading error:', err);
                        video.removeEventListener('loadeddata', onLoadedData);
                        video.removeEventListener('error', onError);
                        reject(new Error('Video kunne ikke lastes'));
                    };
                    
                    video.addEventListener('loadeddata', onLoadedData);
                    video.addEventListener('error', onError);
                    
                    // Timeout etter 10 sekunder
                    setTimeout(() => {
                        video.removeEventListener('loadeddata', onLoadedData);
                        video.removeEventListener('error', onError);
                        reject(new Error('Video loading timeout'));
                    }, 10000);
                });
            }
        } catch (err) {
            console.error('Feil ved tilgang til kamera:', err);
            let errorMessage = 'Kunne ikke få tilgang til kamera. ';
            
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Tillatelse til kamera ble nektet. Sjekk nettleserinnstillinger og gi tillatelse.';
            } else if (err.name === 'NotFoundError') {
                errorMessage += 'Ingen kamera ble funnet på enheten.';
            } else if (err.name === 'NotReadableError') {
                errorMessage += 'Kameraet er i bruk av en annen applikasjon. Lukk andre apper som bruker kameraet.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Kamerainnstillingene er ikke støttet.';
            } else {
                errorMessage += `Feil: ${err.message}`;
            }
            
            setError(errorMessage);
            
            // Rydd opp ved feil
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            setIsActive(false);
        }
    }, [stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsActive(false);
        }
    }, [stream]);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            console.log('Forsøker å ta bilde. Video dimensjoner:', video.videoWidth, 'x', video.videoHeight);
            console.log('Video readyState:', video.readyState);
            console.log('Video currentTime:', video.currentTime);
            
            // Sjekk at video er klar og har dimensjoner
            if (video.readyState < 2) { // HAVE_CURRENT_DATA
                setError('Video laster fortsatt. Vent litt og prøv igjen.');
                return;
            }
            
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setError('Video har ingen dimensjoner. Prøv å starte kameraet på nytt.');
                return;
            }
            
            // Sett canvas-dimensjoner
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            
            // Tøm canvas først
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Tegn video-bildet på canvas
            try {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Sjekk om canvas har innhold (ikke bare hvitt/gjennomsiktig)
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const hasContent = imageData.data.some((value, index) => {
                    // Sjekk alpha-kanal (hver 4. piksel)
                    if (index % 4 === 3) return value > 0;
                    // Sjekk RGB-verdier
                    return value !== 255 && value !== 0;
                });
                
                if (!hasContent) {
                    setError('Bildet er tomt. Sjekk at kameraet fungerer og prøv igjen.');
                    return;
                }
                
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                console.log('Bilde tatt. Data URL lengde:', imageDataUrl.length);
                setCapturedImage(imageDataUrl);
                
                // Stopp kameraet etter at bildet er tatt
                stopCamera();
            } catch (err) {
                console.error('Feil ved tegning av video til canvas:', err);
                setError('Kunne ikke ta bilde. Prøv igjen.');
            }
        } else {
            setError('Kamera er ikke initialisert. Start kameraet først.');
        }
    }, [stopCamera]);

    const downloadImage = useCallback(() => {
        if (capturedImage) {
            const link = document.createElement('a');
            link.download = `foto_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
            link.href = capturedImage;
            link.click();
        }
    }, [capturedImage]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
    }, []);

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAltIcon />
                Kamera
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                {!isActive && !capturedImage && (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <CameraAltIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Aktivér kamera
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Trykk på knappen nedenfor for å få tilgang til kameraet og ta bilder
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PhotoCameraIcon />}
                                onClick={startCamera}
                                sx={{ minWidth: 200 }}
                            >
                                Start kamera
                            </Button>
                        </CardActions>
                    </Card>
                )}

                {isActive && !capturedImage && (
                    <Box sx={{ textAlign: 'center' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                height: 'auto',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                backgroundColor: '#000'
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PhotoCameraIcon />}
                                onClick={capturePhoto}
                            >
                                Ta bilde
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={stopCamera}
                            >
                                Stopp kamera
                            </Button>
                        </Box>
                    </Box>
                )}

                {capturedImage && (
                    <Box sx={{ textAlign: 'center' }}>
                        <img
                            src={capturedImage}
                            alt="Tatt bilde"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                height: 'auto',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={downloadImage}
                            >
                                Last ned bilde
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={retakePhoto}
                            >
                                Ta nytt bilde
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={startCamera}
                            >
                                Tilbake til kamera
                            </Button>
                        </Box>
                    </Box>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Denne funksjonen krever tilgang til enhetens kamera. 
                Sørg for at du har gitt nettleseren tillatelse til å bruke kameraet.
            </Typography>
        </Box>
    );
};

export default Camera;