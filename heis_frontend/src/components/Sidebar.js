import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
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
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import WorkflowIcon from '@mui/icons-material/PlayArrow';

const drawerWidth = 220;

const Sidebar = ({ userRole, open, onClose }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    // Menyvalg med ikoner og tekst - gruppert struktur
    const getMenuGroups = () => {
        const groups = [];
        const dashboardPath =
            userRole === 'admin' ? '/dashboard'
            : userRole === 'tekniker' ? '/tekniker-dashboard'
            : userRole === 'selger' ? '/selger-dashboard'
            : '/login';
        
        // Dashboard - alltid synlig
        groups.push({
            title: null,
            items: [{ key: 'dashboard', to: dashboardPath, text: 'Dashboard', icon: <DashboardIcon /> }]
        });

        // Salg & Kunder
        if (userRole === 'admin' || userRole === 'selger') {
            groups.push({
                title: 'Salg & Kunder',
                items: [
                    { key: 'sales-workflow', to: '/sales-workflow', text: 'Kunde til Oppdrag', icon: <WorkflowIcon /> },
                    { key: 'customers', to: '/customers', text: 'Kunder', icon: <BusinessIcon /> },
                    { key: 'sales-opportunities', to: '/sales-opportunities', text: 'Salgsmuligheter', icon: <HandshakeIcon /> },
                    { key: 'sales-pipeline', to: '/sales-pipeline', text: 'Salgspipeline', icon: <PipelineIcon /> },
                    { key: 'quotes', to: '/quotes', text: 'Tilbud', icon: <ReceiptIcon /> },
                    { key: 'orders', to: '/orders', text: 'Ordrer', icon: <InventoryIcon /> },
                ]
            });
        }

        // Service & Vedlikehold
        if (userRole === 'admin' || userRole === 'tekniker') {
            groups.push({
                title: 'Service & Vedlikehold',
                items: [
                    { key: 'assignments', to: '/assignments', text: 'Oppdrag', icon: <AssignmentIcon /> },
                    { key: 'calendar', to: '/calendar', text: 'Kalender', icon: <CalendarMonthIcon /> },
                ]
            });
        }

        // Planlegging - for admin og selger
        if (userRole === 'admin' || userRole === 'selger') {
            groups.push({
                title: 'Planlegging',
                items: [
                    { key: 'availability', to: '/availability', text: 'Tekniker Tilgjengelighet', icon: <AvailabilityIcon /> },
                    { key: 'sales-follow-up', to: '/sales-follow-up', text: 'Oppfølgingsplan', icon: <FollowUpIcon /> },
                    { key: 'sales-automation', to: '/sales-automation', text: 'Salgsautomatisering', icon: <AutoModeIcon /> },
                ]
            });
        }

        // Data & Administrasjon
        if (userRole === 'admin') {
            groups.push({
                title: 'Administrasjon',
                items: [
                    { key: 'users', to: '/users', text: 'Brukere', icon: <PeopleIcon /> },
                    { key: 'elevators', to: '/elevators', text: 'Heiser', icon: <ElevatorIcon /> },
                    { key: 'elevator-types', to: '/elevator-types', text: 'Heistyper', icon: <CategoryIcon /> },
                    { key: 'absences', to: '/absences', text: 'Fravær', icon: <EventBusyIcon /> },
                ]
            });
        } else if (userRole === 'selger') {
            // Selgere ser kun elevators
            groups.push({
                title: 'Data',
                items: [
                    { key: 'elevators', to: '/elevators', text: 'Heiser', icon: <ElevatorIcon /> },
                ]
            });
        }

        // Verktøy - alltid synlig
        groups.push({
            title: 'Verktøy',
            items: [{ key: 'camera', to: '/camera', text: 'Kamera', icon: <CameraAltIcon /> }]
        });

        return groups;
    };

    const menuGroups = getMenuGroups();

    const drawerContent = (
        <Box sx={{ width: drawerWidth, height: '100%', bgcolor: 'background.paper', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ minHeight: 48 }} />
            <Divider />
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {menuGroups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                    {group.title && (
                        <ListSubheader 
                            component="div" 
                            sx={{ 
                                bgcolor: 'transparent',
                                color: 'text.secondary',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                mt: groupIndex > 0 ? 1 : 0,
                                mb: 0.2,
                                py: 0.3
                            }}
                        >
                            {group.title}
                        </ListSubheader>
                    )}
                    <List sx={{ pt: 0, pb: 0 }}>
                        {group.items.map(item => (
                            <ListItem
                                button
                                key={item.key}
                                component={Link}
                                to={item.to}
                                selected={location.pathname === item.to}
                                sx={{
                                    py: 0.6,
                                    my: 0.1,
                                    mx: 0.5,
                                    borderRadius: 1,
                                    bgcolor: location.pathname === item.to ? 'action.selected' : 'inherit',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                    minHeight: 36
                                }}
                                onClick={isMobile ? onClose : undefined}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                    {groupIndex < menuGroups.length - 1 && group.title && <Divider sx={{ my: 0.5 }} />}
                </React.Fragment>
            ))}
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? open : true}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    borderRight: '1px solid #e0e0e0',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar; 