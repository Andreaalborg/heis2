import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { useAuth } from './Auth';

const Navbar = ({ userRole, onMenuClick, isMobile }) => {
    const navigate = useNavigate();
    const { logout, userData, isAuthenticated, isLoading } = useAuth();
    const username = userData?.username || 'Bruker';
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading || !isAuthenticated) {
        return null;
    }

    return (
        <AppBar position="fixed" color="primary" elevation={2} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                {/* Hamburger-meny på mobil */}
                {isMobile && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="meny"
                        onClick={onMenuClick}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}
                <Typography
                    variant="h6"
                    component={Link}
                    to={userRole === 'admin' ? '/dashboard' : userRole === 'tekniker' ? '/tekniker-dashboard' : userRole === 'selger' ? '/selger-dashboard' : '/'}
                    sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                >
                    HeisAdmin
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Tooltip title={username}>
                        <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>
                            {username} ({userRole})
                        </Typography>
                    </Tooltip>
                    <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                        Logg ut
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 