import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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

const drawerWidth = 220;

const Sidebar = ({ userRole, open, onClose }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    // Menyvalg med ikoner og tekst
    const getMenuItems = () => {
        const menuItems = [];
        const dashboardPath =
            userRole === 'admin' ? '/dashboard'
            : userRole === 'tekniker' ? '/tekniker-dashboard'
            : userRole === 'selger' ? '/selger-dashboard'
            : '/login';
        menuItems.push({ key: 'dashboard', to: dashboardPath, text: 'Dashboard', icon: <DashboardIcon /> });
        if (userRole === 'admin') {
            menuItems.push({ key: 'users', to: '/users', text: 'Brukere', icon: <PeopleIcon /> });
            menuItems.push({ key: 'elevator-types', to: '/elevator-types', text: 'Heistyper', icon: <CategoryIcon /> });
            menuItems.push({ key: 'absences', to: '/absences', text: 'Fravær', icon: <EventBusyIcon /> });
        }
        if (userRole === 'admin' || userRole === 'tekniker') {
            menuItems.push({ key: 'assignments', to: '/assignments', text: 'Oppdrag', icon: <AssignmentIcon /> });
            menuItems.push({ key: 'calendar', to: '/calendar', text: 'Kalender', icon: <CalendarMonthIcon /> });
        }
        if (userRole === 'admin' || userRole === 'selger') {
            menuItems.push({ key: 'customers', to: '/customers', text: 'Kunder', icon: <BusinessIcon /> });
            menuItems.push({ key: 'elevators', to: '/elevators', text: 'Heiser', icon: <ElevatorIcon /> });
            menuItems.push({ key: 'sales-opportunities', to: '/sales-opportunities', text: 'Salgsmuligheter', icon: <HandshakeIcon /> });
            menuItems.push({ key: 'sales-pipeline', to: '/sales-pipeline', text: 'Salgspipeline', icon: <PipelineIcon /> });
            menuItems.push({ key: 'sales-follow-up', to: '/sales-follow-up', text: 'Oppfølgingsplan', icon: <FollowUpIcon /> });
            menuItems.push({ key: 'quotes', to: '/quotes', text: 'Tilbud', icon: <ReceiptIcon /> });
            menuItems.push({ key: 'orders', to: '/orders', text: 'Ordrer', icon: <InventoryIcon /> });
            menuItems.push({ key: 'availability', to: '/availability', text: 'Tilgjengelighet', icon: <AvailabilityIcon /> });
        }
        // Fjern duplikater basert på key
        return Array.from(new Map(menuItems.map(item => [item.key, item])).values());
    };

    const menuItems = getMenuItems();

    const drawerContent = (
        <Box sx={{ width: drawerWidth, height: '100%', bgcolor: 'background.paper' }}>
            <Toolbar />
            <Divider />
            <List>
                {menuItems.map(item => (
                    <ListItem
                        button
                        key={item.key}
                        component={Link}
                        to={item.to}
                        selected={location.pathname === item.to}
                        sx={{
                            my: 0.5,
                            borderRadius: 1,
                            bgcolor: location.pathname === item.to ? 'action.selected' : 'inherit',
                        }}
                        onClick={isMobile ? onClose : undefined}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
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