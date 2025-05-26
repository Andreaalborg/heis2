import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Paper, 
    Alert,
    Card,
    CardContent,
    CardActions,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Chip
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const Camera = () => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [scanMode, setScanMode] = useState('photo'); // 'photo', 'qr', 'barcode'
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const codeReaderRef = useRef(null);

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

    const handleFileUpload = useCallback((event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target.result);
                setError('');
            };
            reader.readAsDataURL(file);
        } else {
            setError('Vennligst velg en bildefil');
        }
    }, []);

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const startScanning = useCallback(async () => {
        try {
            setError('');
            setScanResult(null);
            setIsScanning(true);

            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader();
            }

            // Få tilgang til kamera
            const videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });

            setStream(videoStream);
            setIsActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = videoStream;

                // Start skanning når video er klar
                videoRef.current.onloadedmetadata = () => {
                    codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                        if (result) {
                            console.log('Skanning resultat:', result.getText());
                            setScanResult({
                                text: result.getText(),
                                format: result.getBarcodeFormat(),
                                timestamp: new Date().toLocaleString()
                            });
                            
                            // Stopp skanning etter vellykket resultat
                            stopScanning();
                        }
                        if (err && !(err instanceof NotFoundException)) {
                            console.warn('Skanning feil:', err);
                        }
                    });
                };
            }
        } catch (err) {
            console.error('Feil ved start av skanning:', err);
            setError('Kunne ikke starte skanning. Sjekk kamera-tillatelser.');
            setIsScanning(false);
        }
    }, []);

    const stopScanning = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsActive(false);
        setIsScanning(false);
    }, [stream]);

    const handleScanFromFile = useCallback((event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!codeReaderRef.current) {
                        codeReaderRef.current = new BrowserMultiFormatReader();
                    }

                    const result = await codeReaderRef.current.decodeFromImageUrl(e.target.result);
                    setScanResult({
                        text: result.getText(),
                        format: result.getBarcodeFormat(),
                        timestamp: new Date().toLocaleString()
                    });
                    setError('');
                } catch (err) {
                    console.error('Kunne ikke skanne bilde:', err);
                    setError('Ingen QR-kode eller strekkode funnet i bildet.');
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // Cleanup ved unmount
    useEffect(() => {
        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAltIcon />
                Kamera & Skanner
            </Typography>

            {/* Mode Toggle */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={scanMode}
                    exclusive
                    onChange={(event, newMode) => {
                        if (newMode !== null) {
                            setScanMode(newMode);
                            setScanResult(null);
                            setCapturedImage(null);
                            setError('');
                            
                            // Stopp pågående aktiviteter
                            if (isActive || isScanning) {
                                stopCamera();
                                stopScanning();
                            }
                        }
                    }}
                    aria-label="kamera modus"
                >
                    <ToggleButton value="photo" aria-label="ta bilde">
                        <PhotoCameraIcon sx={{ mr: 1 }} />
                        Ta bilde
                    </ToggleButton>
                    <ToggleButton value="qr" aria-label="qr skanning">
                        <QrCodeScannerIcon sx={{ mr: 1 }} />
                        QR-kode
                    </ToggleButton>
                    <ToggleButton value="barcode" aria-label="strekkode skanning">
                        <QrCodeScannerIcon sx={{ mr: 1 }} />
                        Strekkode
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {scanResult && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {scanMode === 'qr' ? 'QR-kode' : 'Strekkode'} skannet!
                    </Typography>
                    <Typography variant="body2">
                        <strong>Innhold:</strong> {scanResult.text}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Format:</strong> {scanResult.format}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {scanResult.timestamp}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <Chip 
                            label="Kopier til utklippstavle" 
                            clickable 
                            onClick={() => navigator.clipboard.writeText(scanResult.text)}
                            size="small"
                        />
                    </Box>
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                {!isActive && !capturedImage && !scanResult && (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            {scanMode === 'photo' ? (
                                <>
                                    <CameraAltIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Ta bilde
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Trykk på "Start kamera" for å ta bilder. På mobil åpnes kamera-appen automatisk.
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <QrCodeScannerIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Skann {scanMode === 'qr' ? 'QR-kode' : 'strekkode'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Start skanning for å lese {scanMode === 'qr' ? 'QR-koder' : 'strekkoder'} med kameraet.
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 2 }}>
                            {scanMode === 'photo' ? (
                                <>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<PhotoCameraIcon />}
                                        onClick={openFileDialog}
                                        sx={{ minWidth: 200 }}
                                    >
                                        Start kamera
                                    </Button>
                                    
                                    <Divider sx={{ width: '100%' }}>eller</Divider>
                                    
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        startIcon={<CloudUploadIcon />}
                                        onClick={startCamera}
                                        sx={{ minWidth: 200 }}
                                    >
                                        Live kamera (avansert)
                                    </Button>
                                    
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        capture="environment"
                                        style={{ display: 'none' }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<QrCodeScannerIcon />}
                                        onClick={startScanning}
                                        sx={{ minWidth: 200 }}
                                    >
                                        Start skanning
                                    </Button>
                                    
                                    <Divider sx={{ width: '100%' }}>eller</Divider>
                                    
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        startIcon={<CloudUploadIcon />}
                                        onClick={() => document.getElementById('scan-file-input').click()}
                                        sx={{ minWidth: 200 }}
                                    >
                                        Skann fra bilde
                                    </Button>
                                    
                                    <input
                                        id="scan-file-input"
                                        type="file"
                                        onChange={handleScanFromFile}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </>
                            )}
                        </CardActions>
                    </Card>
                )}

                {(isActive || isScanning) && !capturedImage && !scanResult && (
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
                        {scanMode === 'photo' ? (
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
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                                    Skanner... Hold {scanMode === 'qr' ? 'QR-koden' : 'strekkoden'} foran kameraet
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={stopScanning}
                                >
                                    Stopp skanning
                                </Button>
                            </Box>
                        )}
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
                "Start kamera" åpner kamera-appen på mobil eller filvelger på PC. 
                "Live kamera" prøver å bruke nettleser-kameraet direkte (kan ha kompatibilitetsproblemer).
            </Typography>
        </Box>
    );
};

export default Camera;