import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

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
import { AuthProvider } from './components/Auth'; // Importer AuthProvider

// Stilark
import './App.css';

// Font Awesome ikoner
import '@fortawesome/fontawesome-free/css/all.min.css';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

// Tilgangskontroll-komponent
const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Feil ved parsing av brukerdata fra localStorage:", error);
                // Logg ut bruker ved feil
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('username');
                setIsAuthenticated(false);
            }
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div>Laster...</div>; // Enkel lasteindikator
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />; // Omdiriger til login hvis ikke autentisert
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.warn(`Tilgang nektet: Brukerrolle '${userRole}' er ikke i tillatte roller '${allowedRoles.join(", ")}' for ruten.`);
        return <Navigate to="/unauthorized" replace />; // Omdiriger ved manglende rolle
    }

    return children; // Vis beskyttet innhold
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null); // Rolle lagres nå her

    // Funksjon for å håndtere innlogging/utlogging og sette brukerrolle
    const handleAuthentication = (authStatus, userData = null) => {
        setIsAuthenticated(authStatus);
        if (authStatus && userData) {
            setUserRole(userData.role);
            // Lagre brukerdata i localStorage ved innlogging
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            setUserRole(null);
            // Fjern brukerdata fra localStorage ved utlogging eller feil
            localStorage.removeItem('user');
            localStorage.removeItem('username'); // Også fjerne username hvis det brukes separat
            localStorage.removeItem('token');
        }
    };

    // Sjekk token og hent brukerinfo ved app-start
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token) {
            axios.get(`${API_BASE_URL}/api/users/current_user/`, {
                headers: { 'Authorization': `Token ${token}` }
            })
            .then(response => {
                if (response.status === 200) {
                    handleAuthentication(true, response.data); // Setter auth og rolle
                } else {
                    // Token var ugyldig ifølge backend
                    handleAuthentication(false);
                }
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Feil ved token-validering:', error.response || error.message);
                // Token var ugyldig (f.eks. 401 Unauthorized) eller nettverksfeil
                handleAuthentication(false);
                setIsLoading(false);
            });
        } else {
            // Ingen token funnet
            handleAuthentication(false);
            setIsLoading(false);
        }
    }, []); // Kjører kun én gang ved mount

    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Laster applikasjonen...</div>;
    }

    // Bestem startsiden basert på rolle
    const getHomeRoute = () => {
        if (!isAuthenticated) return "/login";
        switch(userRole) {
            case 'admin': return "/dashboard"; // Admin til originalt dashboard
            case 'tekniker': return "/tekniker-dashboard";
            case 'selger': return "/selger-dashboard";
            default:
                console.warn(`Ukjent brukerrolle for navigering: ${userRole}`);
                return "/login"; // Fallback til login ved ukjent rolle
        }
    };

    return (
        <Router>
            <AuthProvider> {/* AuthProvider wrapper app-innholdet */}
                <div className="app">
                    {/* Navbar vises kun hvis brukeren er autentisert */}
                    {isAuthenticated && (
                        <Navbar 
                            isAuthenticated={isAuthenticated} 
                            setIsAuthenticated={handleAuthentication} // Bruker nå den sentraliserte funksjonen
                            userRole={userRole} // Send med rollen
                        />
                    )}
                    <div className="content">
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
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
