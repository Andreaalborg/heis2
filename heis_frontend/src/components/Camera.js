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
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            setStream(mediaStream);
            setIsActive(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Feil ved tilgang til kamera:', err);
            setError('Kunne ikke få tilgang til kamera. Sjekk at du har gitt tillatelse til kamerabruk.');
        }
    }, []);

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
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageDataUrl);
        }
    }, []);

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