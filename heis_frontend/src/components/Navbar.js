import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import ElevatorIcon from '@mui/icons-material/KeyboardArrowUp';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PipelineIcon from '@mui/icons-material/Timeline';
import FollowUpIcon from '@mui/icons-material/Checklist';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory2';
import AvailabilityIcon from '@mui/icons-material/EventAvailable';
import LogoutIcon from '@mui/icons-material/Logout';

// Mottar userRole og den sentraliserte handleAuthentication-funksjonen som setIsAuthenticated
const Navbar = ({ isAuthenticated, setIsAuthenticated, userRole }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogout = () => {
        // Kall handleAuthentication i App.js for å logge ut (setter state og fjerner localStorage)
        setIsAuthenticated(false); // App.js' handleAuthentication håndterer localStorage
        navigate('/login');
        setDrawerOpen(false); // Lukk menyen ved utlogging
    };
    
    const isActive = (path) => {
        // Markerer dashboard som aktivt kun hvis stien er eksakt den.
        if (path === '/dashboard' || path === '/tekniker-dashboard' || path === '/selger-dashboard') {
            return location.pathname === path;
        }
        // For andre sider, sjekk om stien starter med den gitte stien.
        return location.pathname.startsWith(path);
    };

    // Henter riktig dashboard-sti basert på rolle
    const getDashboardPath = () => {
        switch(userRole) {
            case 'admin': return '/dashboard';
            case 'tekniker': return '/tekniker-dashboard';
            case 'selger': return '/selger-dashboard';
            default: return '/login'; // Fallback
        }
    };

    // Menyvalg med ikoner og tekst
    const menuItems = [];
    const dashboardPath = getDashboardPath();
    menuItems.push({
        key: 'dashboard',
        to: dashboardPath,
        text: 'Dashboard',
        icon: <DashboardIcon />
    });
    if (userRole === 'admin') {
        menuItems.push({
            key: 'users',
            to: '/users',
            text: 'Brukere',
            icon: <PeopleIcon />
        });
        menuItems.push({
            key: 'elevator-types',
            to: '/elevator-types',
            text: 'Heistyper',
            icon: <CategoryIcon />
        });
        menuItems.push({
            key: 'absences',
            to: '/absences',
            text: 'Fravær',
            icon: <EventBusyIcon />
        });
    }
    if (userRole === 'admin' || userRole === 'tekniker') {
        menuItems.push({
            key: 'assignments',
            to: '/assignments',
            text: 'Oppdrag',
            icon: <AssignmentIcon />
        });
        menuItems.push({
            key: 'calendar',
            to: '/calendar',
            text: 'Kalender',
            icon: <CalendarMonthIcon />
        });
    }
    if (userRole === 'admin' || userRole === 'selger') {
        menuItems.push({
            key: 'customers',
            to: '/customers',
            text: 'Kunder',
            icon: <BusinessIcon />
        });
        menuItems.push({
            key: 'elevators',
            to: '/elevators',
            text: 'Heiser',
            icon: <ElevatorIcon />
        });
        menuItems.push({
            key: 'sales-opportunities',
            to: '/sales-opportunities',
            text: 'Salgsmuligheter',
            icon: <HandshakeIcon />
        });
        menuItems.push({
            key: 'sales-pipeline',
            to: '/sales-pipeline',
            text: 'Salgspipeline',
            icon: <PipelineIcon />
        });
        menuItems.push({
            key: 'sales-follow-up',
            to: '/sales-follow-up',
            text: 'Oppfølgingsplan',
            icon: <FollowUpIcon />
        });
        menuItems.push({
            key: 'quotes',
            to: '/quotes',
            text: 'Tilbud',
            icon: <ReceiptIcon />
        });
        menuItems.push({
            key: 'orders',
            to: '/orders',
            text: 'Ordrer',
            icon: <InventoryIcon />
        });
        menuItems.push({
            key: 'availability',
            to: '/availability',
            text: 'Tilgjengelighet',
            icon: <AvailabilityIcon />
        });
    }
    // Fjern duplikater basert på key
    const uniqueMenuItems = Array.from(new Map(menuItems.map(item => [item.key, item])).values());

    // Hent brukernavn for visning
    const username = localStorage.getItem('username') || 'Bruker'; 
    
    // Drawer-innhold
    const drawerList = (
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
            <List>
                {uniqueMenuItems.map(item => (
                    <ListItem button key={item.key} component={Link} to={item.to} selected={isActive(item.to)}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem>
                    <ListItemText primary={`${username} (${userRole})`} />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logg ut" />
                </ListItem>
            </List>
        </Box>
    );

    // Korrigert JSX struktur
    if (!isAuthenticated) {
        return null;
    }

    return (
        <AppBar position="fixed" color="primary" elevation={2}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="meny"
                    onClick={() => setDrawerOpen(true)}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    component={Link}
                    to={dashboardPath}
                    sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                >
                    HeisAdmin
                </Typography>
                {/* Desktop-meny */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1 }}>
                    {uniqueMenuItems.map(item => (
                        <Button
                            key={item.key}
                            component={Link}
                            to={item.to}
                            color={isActive(item.to) ? 'secondary' : 'inherit'}
                            startIcon={item.icon}
                            sx={{ mx: 0.5, fontWeight: isActive(item.to) ? 700 : 400 }}
                        >
                            {item.text}
                        </Button>
                    ))}
                </Box>
                {/* Brukerinfo og logg ut */}
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
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{ display: { xs: 'block', sm: 'none' } }}
            >
                {drawerList}
            </Drawer>
        </AppBar>
    );
};

export default Navbar; 