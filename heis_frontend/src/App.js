import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

// Komponenter
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TeknikerDashboard from './components/dashboards/TeknikerDashboard';
import SelgerDashboard from './components/dashboards/SelgerDashboard';
import Users from './components/Users';
import Customers from './components/Customers';
import Assignments from './components/Assignments';
import Elevators from './components/Elevators';
import AssignmentCalendar from './components/AssignmentCalendar';
import SalesOpportunityList from './components/SalesOpportunityList';
import QuoteDetailView from './components/QuoteDetailView';
import ElevatorTypeList from './components/ElevatorTypeList';
import QuoteList from './components/QuoteList';
import OrderList from './components/OrderList';
import OrderDetailView from './components/OrderDetailView';
import AbsenceManagement from './components/AbsenceManagement';
import TechnicianAvailabilityView from './components/TechnicianAvailabilityView';
import SalesPipelineBoard from './components/SalesPipelineBoard';
import SalesFollowUpPlanner from './components/SalesFollowUpPlanner';
import { AuthProvider, useAuth } from './components/Auth'; // Importer AuthProvider og useAuth
import Sidebar from './components/Sidebar';

// Stilark
import './App.css';

// Font Awesome ikoner
import '@fortawesome/fontawesome-free/css/all.min.css';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

// Tilgangskontroll-komponent
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, userData, isLoading } = useAuth();

    if (isLoading) {
        return <div>Laster...</div>; // Enkel lasteindikator
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />; // Omdiriger til login hvis ikke autentisert
    }

    if (allowedRoles && !allowedRoles.includes(userData?.role)) {
        console.warn(`Tilgang nektet: Brukerrolle '${userData?.role}' er ikke i tillatte roller '${allowedRoles.join(", ")}' for ruten.`);
        return <Navigate to="/unauthorized" replace />; // Omdiriger ved manglende rolle
    }

    return children; // Vis beskyttet innhold
};

// Hovedapp-komponent som bruker AuthContext
const AppContent = () => {
    const { isAuthenticated, userData, isLoading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const theme = createTheme({
        palette: {
            primary: {
                main: '#fff',
                contrastText: '#23272f',
            },
            secondary: {
                main: '#2c3e50',
            },
            background: {
                default: '#f5f5f5',
            },
            text: {
                primary: '#23272f',
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)',
                        backgroundColor: '#fff',
                        color: '#23272f',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        boxShadow: '2px 0 8px 0 rgba(60,60,60,0.08)',
                        backgroundColor: '#fff',
                        color: '#23272f',
                    },
                },
            },
        },
    });
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Laster applikasjonen...</div>;
    }

    // Bestem startsiden basert på rolle
    const getHomeRoute = () => {
        if (!isAuthenticated) return "/login";
        switch(userData?.role) {
            case 'admin': return "/dashboard";
            case 'tekniker': return "/tekniker-dashboard";
            case 'selger': return "/selger-dashboard";
            default:
                console.warn(`Ukjent brukerrolle for navigering: ${userData?.role}`);
                return "/login";
        }
    };

    // Ikke vis sidebar/navbar på login
    const hideNav = window.location.pathname === '/login';

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                {/* Sidebar */}
                {isAuthenticated && !hideNav && (
                    <Sidebar
                        userRole={userData?.role}
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                )}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
                    {/* Toppbar */}
                    {!hideNav && isAuthenticated && (
                        <Navbar 
                            isAuthenticated={isAuthenticated} 
                            userRole={userData?.role}
                            onMenuClick={() => setSidebarOpen(true)}
                            isMobile={isMobile}
                        />
                    )}
                    {/* Spacing for toppbar */}
                    {!hideNav && isAuthenticated && <Toolbar />}
                    {/* Innhold */}
                    <div className="content" style={{
                        flex: 1,
                        paddingLeft: (!hideNav && isAuthenticated && !isMobile) ? 220 : 0,
                        paddingTop: 0,
                        transition: 'padding-left 0.2s',
                        minHeight: 'calc(100vh - 64px)'
                    }}>
                        <Routes>
                            {/* Innloggingsside */}
                            <Route 
                                path="/login" 
                                element={!isAuthenticated ? <Auth /> : <Navigate to={getHomeRoute()} replace />}
                            />
                            
                            {/* Admin Ruter */}
                            <Route path="/dashboard" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Dashboard /> 
                                </ProtectedRoute>
                            } />
                            <Route path="/users" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Users />
                                </ProtectedRoute>
                            } />
                            <Route path="/elevator-types" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <ElevatorTypeList />
                                </ProtectedRoute>
                            } />
                            {/* Admin Rute for Fravær */}
                            <Route path="/absences" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AbsenceManagement />
                                </ProtectedRoute>
                            } />
                            
                            {/* Tekniker Ruter */}
                            <Route path="/tekniker-dashboard" element={
                                <ProtectedRoute allowedRoles={['admin', 'tekniker']}>
                                    <TeknikerDashboard /> 
                                </ProtectedRoute>
                            } />
                            {/* Felles ruter (juster roller etter behov) */}
                            <Route path="/assignments" element={
                                <ProtectedRoute allowedRoles={['admin', 'tekniker', 'selger']}> 
                                    <Assignments />
                                </ProtectedRoute>
                            } />
                            <Route path="/calendar" element={
                                <ProtectedRoute allowedRoles={['admin', 'tekniker', 'selger']}>
                                    <AssignmentCalendar />
                                </ProtectedRoute>
                            } />
                            
                            {/* Selger Ruter */}
                            <Route path="/selger-dashboard" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <SelgerDashboard /> 
                                </ProtectedRoute>
                            } />
                            <Route path="/customers" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <Customers />
                                </ProtectedRoute>
                            } />
                            <Route path="/elevators" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <Elevators />
                                </ProtectedRoute>
                            } />
                            
                            {/* Salgsmuligheter (Admin, Selger) */}
                            <Route path="/sales-opportunities" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <SalesOpportunityList />
                                </ProtectedRoute>
                            } />
                            
                            {/* Salgs-pipeline (Admin, Selger) */}
                            <Route path="/sales-pipeline" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <SalesPipelineBoard />
                                </ProtectedRoute>
                            } />
                            
                            {/* Oppfølgingsplan for salg (Admin, Selger) */}
                            <Route path="/sales-follow-up" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <SalesFollowUpPlanner />
                                </ProtectedRoute>
                            } />
                            
                            {/* Tilbudsdetaljer (Admin, Selger) */}
                            <Route path="/quotes/:quoteId" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <QuoteDetailView />
                                </ProtectedRoute>
                            } />
                            
                            {/* Tilbudsliste (Admin, Selger) */}
                            <Route path="/quotes" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <QuoteList />
                                </ProtectedRoute>
                            } />
                            
                            {/* Ordre Ruter (Admin, Selger, kanskje Tekniker for visning?) */}
                            <Route path="/orders" element={
                                 <ProtectedRoute allowedRoles={['admin', 'selger', 'tekniker']}>
                                    <OrderList />
                                </ProtectedRoute>
                            } />
                            <Route path="/orders/:orderId" element={
                                 <ProtectedRoute allowedRoles={['admin', 'selger', 'tekniker']}>
                                    <OrderDetailView />
                                </ProtectedRoute>
                            } />
                            
                            {/* Admin Rute for Tilgjengelighet */}
                            <Route path="/availability" element={
                                <ProtectedRoute allowedRoles={['admin', 'selger']}>
                                    <TechnicianAvailabilityView />
                                </ProtectedRoute>
                            } />
                            
                            {/* Omdirigering og feilsider */}
                            <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
                            <Route path="/unauthorized" element={
                                <div style={{ padding: '20px' }}>
                                    <h2>Ingen tilgang</h2>
                                    <p>Du har dessverre ikke tilgang til å se denne siden.</p>
                                </div>
                            } />
                            <Route path="*" element={
                                <div style={{ padding: '20px' }}>
                                    <h2>404 - Siden ble ikke funnet</h2>
                                    <p>Beklager, vi fant ikke siden du lette etter.</p>
                                </div>
                            } />
                        </Routes>
                    </div>
                </Box>
                </div>
        </ThemeProvider>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
