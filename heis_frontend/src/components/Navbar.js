import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import '../styles/Navbar.css'; // Fjerner denne for å unngå konflikter

// Mottar userRole og den sentraliserte handleAuthentication-funksjonen som setIsAuthenticated
const Navbar = ({ isAuthenticated, setIsAuthenticated, userRole }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogout = () => {
        // Kall handleAuthentication i App.js for å logge ut (setter state og fjerner localStorage)
        setIsAuthenticated(false); // App.js' handleAuthentication håndterer localStorage
        navigate('/login');
        setMobileMenuOpen(false); // Lukk menyen ved utlogging
    };
    
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };
    
    // Navbar rendres kun hvis bruker er autentisert (styres fra App.js)
    if (!isAuthenticated) {
        return null;
    }
    
    // Funksjon for å sjekke om en sti er aktiv
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

    // Bygger menyvalgene basert på rolle
    const renderMenuItems = () => {
        const menuItems = [];
        const dashboardPath = getDashboardPath();

        // Legg alltid til Dashboard-lenke
        menuItems.push(
            <Link 
                key="dashboard" 
                to={dashboardPath} 
                className={`navbar-item ${isActive(dashboardPath) ? 'is-active' : ''}`}
                onClick={closeMobileMenu}
            >
                <span className="icon-text">
                    <span className="icon"><i className="fas fa-tachometer-alt"></i></span>
                    <span>Dashboard</span>
                </span>
            </Link>
        );

        // Admin-spesifikke menyvalg
        if (userRole === 'admin') {
            menuItems.push(
                <Link 
                    key="users" 
                    to="/users" 
                    className={`navbar-item ${isActive('/users') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-users"></i></span>
                        <span>Brukere</span>
                    </span>
                </Link>
            );
        }

        // Legg til Heistyper for Admin
        if (userRole === 'admin') {
             menuItems.push(
                <Link 
                    key="elevator-types" 
                    to="/elevator-types" 
                    className={`navbar-item ${isActive('/elevator-types') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-tags"></i></span> {/* Ikon for typer/kategorier */}
                        <span>Heistyper</span>
                    </span>
                </Link>
            );
        }

        // Legg til Fravær for Admin
        if (userRole === 'admin') {
             menuItems.push(
                <Link 
                    key="absences" 
                    to="/absences" 
                    className={`navbar-item ${isActive('/absences') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-user-clock"></i></span> {/* Ikon for fravær/tid */}
                        <span>Fravær</span>
                    </span>
                </Link>
            );
        }

        // Felles menyvalg (juster logikk om nødvendig hvis roller/tilganger endres)
        const commonLinks = [];
        if (userRole === 'admin' || userRole === 'tekniker') {
            commonLinks.push(
                <Link 
                    key="assignments" 
                    to="/assignments" 
                    className={`navbar-item ${isActive('/assignments') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-clipboard-list"></i></span>
                        <span>Oppdrag</span>
                    </span>
                </Link>,
                <Link 
                    key="calendar" 
                    to="/calendar" 
                    className={`navbar-item ${isActive('/calendar') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                     <span className="icon-text">
                        <span className="icon"><i className="fas fa-calendar-alt"></i></span>
                        <span>Kalender</span>
                    </span>
                </Link>
            );
        }
         if (userRole === 'admin' || userRole === 'selger') {
             commonLinks.push(
                <Link 
                    key="customers" 
                    to="/customers" 
                    className={`navbar-item ${isActive('/customers') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-address-book"></i></span>
                        <span>Kunder</span>
                    </span>
                </Link>,
                <Link 
                    key="elevators" 
                    to="/elevators" 
                    className={`navbar-item ${isActive('/elevators') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-elevator"></i></span>
                        <span>Heiser</span>
                    </span>
                </Link>,
                <Link 
                    key="sales-opportunities" 
                    to="/sales-opportunities" 
                    className={`navbar-item ${isActive('/sales-opportunities') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-handshake"></i></span>
                        <span>Salgsmuligheter</span>
                    </span>
                </Link>,
                <Link 
                    key="sales-pipeline" 
                    to="/sales-pipeline" 
                    className={`navbar-item ${isActive('/sales-pipeline') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-project-diagram"></i></span>
                        <span>Salgspipeline</span>
                    </span>
                </Link>,
                <Link 
                    key="sales-follow-up" 
                    to="/sales-follow-up" 
                    className={`navbar-item ${isActive('/sales-follow-up') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-tasks"></i></span>
                        <span>Oppfølgingsplan</span>
                    </span>
                </Link>,
                <Link 
                    key="quotes" 
                    to="/quotes" 
                    className={`navbar-item ${isActive('/quotes') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-file-invoice-dollar"></i></span> {/* Ikon for tilbud/faktura */}
                        <span>Tilbud</span>
                    </span>
                </Link>,
                 // Legger til Ordrer her for alle roller
                 <Link 
                    key="orders" 
                    to="/orders" 
                    className={`navbar-item ${isActive('/orders') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-box-open"></i></span> {/* Ikon for ordre */} 
                        <span>Ordrer</span>
                    </span>
                </Link>
             );
         }
         // Legg til Tilgjengelighet for Admin/Selger
         if (userRole === 'admin' || userRole === 'selger') {
             menuItems.push(
                <Link 
                    key="availability" 
                    to="/availability" 
                    className={`navbar-item ${isActive('/availability') ? 'is-active' : ''}`}
                    onClick={closeMobileMenu}
                >
                    <span className="icon-text">
                        <span className="icon"><i className="fas fa-calendar-check"></i></span> {/* Ikon for tilgjengelighet */}
                        <span>Tilgjengelighet</span>
                    </span>
                </Link>
            );
         }
         // Fjerner duplikater hvis bruker er admin
         menuItems.push(...new Map(commonLinks.map(item => [item.key, item])).values());

        return menuItems;
    };

    // Hent brukernavn for visning
    const username = localStorage.getItem('username') || 'Bruker'; 
    
    // Korrigert JSX struktur
    return (
        <nav className="navbar is-fixed-top has-shadow" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <Link to={getDashboardPath()} className="navbar-item" onClick={closeMobileMenu}>
                    <strong style={{ fontSize: '1.2em' }}>HeisAdmin</strong> 
                </Link>

                <button 
                    type="button"
                    className={`navbar-burger burger ${mobileMenuOpen ? 'is-active' : ''}`}
                    aria-label="menu"
                    aria-expanded={mobileMenuOpen}
                    onClick={toggleMobileMenu}
                >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </button>
            </div>
            
            <div id="navbarMenu" className={`navbar-menu ${mobileMenuOpen ? 'is-active' : ''}`}> 
                <div className="navbar-start">
                    {renderMenuItems()}
                </div>
                <div className="navbar-end">
                    <div className="navbar-item">
                        <div className="buttons">
                            <span className="navbar-item">
                                {username} ({userRole})
                            </span>
                            <button onClick={handleLogout} className="button is-danger is-light">
                                <span className="icon is-small">
                                    <i className="fas fa-sign-out-alt"></i>
                                </span>
                                <span>Logg ut</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 