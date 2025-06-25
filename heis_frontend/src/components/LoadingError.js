import React from 'react';
import { Alert, CircularProgress, Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

// Moderne loading komponent med animasjon
export const LoadingSpinner = ({ message = "Laster...", size = 40 }) => {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '200px',
                p: 3
            }}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress 
                    size={size} 
                    sx={{
                        color: 'primary.main',
                        animationDuration: '550ms',
                    }}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CircularProgress
                        variant="determinate"
                        size={size}
                        value={25}
                        sx={{
                            color: 'grey.300',
                            position: 'absolute',
                        }}
                    />
                </Box>
            </Box>
            <Typography 
                variant="body1" 
                sx={{ 
                    mt: 2, 
                    color: 'text.secondary',
                    fontWeight: 500,
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}
            >
                {message}
            </Typography>
        </Box>
    );
};

// Skeleton loader for lister
export const SkeletonLoader = ({ rows = 5, columns = 4 }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {[...Array(rows)].map((_, rowIndex) => (
                <Box 
                    key={rowIndex}
                    sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        mb: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                >
                    {[...Array(columns)].map((_, colIndex) => (
                        <Box
                            key={colIndex}
                            sx={{
                                flex: 1,
                                height: 20,
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                animation: 'skeleton-loading 1.5s infinite ease-in-out',
                                animationDelay: `${colIndex * 0.1}s`
                            }}
                        />
                    ))}
                </Box>
            ))}
            <style>
                {`
                    @keyframes skeleton-loading {
                        0% { opacity: 0.7; }
                        50% { opacity: 0.4; }
                        100% { opacity: 0.7; }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.6; }
                    }
                `}
            </style>
        </Box>
    );
};

// Moderne error komponent
export const ErrorMessage = ({ 
    error, 
    title = "Noe gikk galt", 
    onRetry = null,
    fullScreen = false 
}) => {
    const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || 'En uventet feil oppstod. Vennligst prøv igjen senere.';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: fullScreen ? '400px' : '200px',
                p: 3,
                textAlign: 'center'
            }}
        >
            <ErrorOutlineIcon 
                sx={{ 
                    fontSize: 60, 
                    color: 'error.main',
                    mb: 2,
                    animation: 'shake 0.5s'
                }} 
            />
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                {title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 500 }}>
                {errorMessage}
            </Typography>
            {onRetry && (
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    Prøv igjen
                </Button>
            )}
            <style>
                {`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                `}
            </style>
        </Box>
    );
};

// Inline error alert
export const InlineError = ({ message, onClose }) => {
    return (
        <Alert 
            severity="error" 
            onClose={onClose}
            sx={{
                mb: 2,
                animation: 'slideIn 0.3s ease-out',
                '& .MuiAlert-icon': {
                    fontSize: 28
                }
            }}
        >
            {message}
        </Alert>
    );
};

// Success melding
export const SuccessMessage = ({ message, onClose, autoHideDuration = 5000 }) => {
    React.useEffect(() => {
        if (autoHideDuration && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoHideDuration);
            return () => clearTimeout(timer);
        }
    }, [autoHideDuration, onClose]);

    return (
        <Alert 
            severity="success" 
            onClose={onClose}
            sx={{
                mb: 2,
                animation: 'slideIn 0.3s ease-out',
                bgcolor: 'success.light',
                '& .MuiAlert-icon': {
                    fontSize: 28
                }
            }}
        >
            {message}
        </Alert>
    );
};

// Ingen data melding
export const NoDataMessage = ({ 
    message = "Ingen data funnet", 
    description = "Det er ingen elementer å vise for øyeblikket.",
    actionText = null,
    onAction = null 
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                p: 4,
                textAlign: 'center'
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                }}
            >
                <Typography variant="h3" sx={{ color: 'grey.400' }}>
                    📭
                </Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                {message}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400 }}>
                {description}
            </Typography>
            {actionText && onAction && (
                <Button
                    variant="contained"
                    onClick={onAction}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    {actionText}
                </Button>
            )}
        </Box>
    );
};

export default {
    LoadingSpinner,
    SkeletonLoader,
    ErrorMessage,
    InlineError,
    SuccessMessage,
    NoDataMessage
};