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

            console.log('Starter kamera...');
            
            // Helt enkel constraint først
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
            
            console.log('Kamera-tilgang vellykket');
            
            setStream(mediaStream);
            setIsActive(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                
                // Enklere event-håndtering
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata lastet:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                };
                
                videoRef.current.oncanplay = () => {
                    console.log('Video kan spilles av');
                };
                
                videoRef.current.onerror = (err) => {
                    console.error('Video error:', err);
                    setError('Video-feil oppstod');
                };
            }
        } catch (err) {
            console.error('Feil ved tilgang til kamera:', err);
            let errorMessage = 'Kunne ikke få tilgang til kamera. ';
            
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Tillatelse til kamera ble nektet. Klikk på kamera-ikonet i adresselinjen og tillat tilgang.';
            } else if (err.name === 'NotFoundError') {
                errorMessage += 'Ingen kamera ble funnet på enheten.';
            } else if (err.name === 'NotReadableError') {
                errorMessage += 'Kameraet kan ikke åpnes. Sørg for at ingen andre apper bruker kameraet og prøv igjen.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Kamerainnstillingene er ikke støttet.';
            } else {
                errorMessage += `Teknisk feil: ${err.message}`;
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
            
            // Enklere sjekk - bare at video har dimensjoner
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setError('Kamera er ikke klar. Vent litt og prøv igjen.');
                return;
            }
            
            // Sett canvas-dimensjoner
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            
            // Tegn video-bildet på canvas
            try {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
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