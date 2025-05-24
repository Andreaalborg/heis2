import React, { useState, createContext, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import 'bulma/css/bulma.min.css';

const AuthContext = createContext(null);

// export const API_BASE_URL = 'http://localhost:8000'; // Din backend-URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    // const navigate = useNavigate(); // FJERNES

    // Denne handleSubmit vil nå bli kalt fra Auth-komponenten
    const login = async (username, password) => {
        setIsLoading(true);
        setError('');
        console.log("AuthProvider: Forsøker å logge inn med:", { username, password });

        try {
            const response = await axios.post(`${API_BASE_URL}/api-token-auth/`, {
                username,
                password
            });

            if (response.data.token) {
                const token = response.data.token;
                localStorage.setItem('token', token);
                localStorage.setItem('username', username); // Behold hvis du bruker dette et sted

                const userResponse = await axios.get(`${API_BASE_URL}/api/users/current_user/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const currentUserData = userResponse.data;
                setUserData(currentUserData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(currentUserData)); // Lagre brukerobjekt
                console.log("AuthProvider: Innlogging vellykket, brukerdata:", currentUserData);
                return currentUserData; // Returner brukerdata for navigasjon i Auth-komponent
            }
        } catch (err) {
            setError('Feil brukernavn eller passord. Prøv igjen.');
            console.error('AuthProvider: Innloggingsfeil:', err.response || err.message);
            setIsAuthenticated(false);
            setUserData(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('username');
            throw err; // Kast feilen videre slik at Auth-komponenten kan håndtere den
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUserData(null);
        setUsername(''); // Nullstill inputfelter om ønskelig
        setPassword('');
        // Navigasjon til login skjer i Navbar eller der logout kalles fra
    };
    
    // Sjekk token ved oppstart (kan beholdes her eller flyttes til App.js hvis det gir mer mening)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        if (token && userString) {
            try {
                const storedUserData = JSON.parse(userString);
                setUserData(storedUserData);
                setIsAuthenticated(true);
                console.log("AuthProvider: Gjennopprettet session for:", storedUserData);
            } catch (e) {
                console.error("AuthProvider: Feil ved parsing av lagret brukerdata", e);
                logout(); // Rydd opp hvis brukerdata er korrupt
            }
        } else {
            setIsLoading(false); // Viktig for å unngå evig lastetilstand hvis ingen token
        }
    }, []);


    return (
        <AuthContext.Provider value={{ 
            username, password, error, isLoading, isAuthenticated, userData, 
            setUsername, setPassword, setError, setIsLoading, setIsAuthenticated, setUserData, 
            login, logout // Gjør login og logout tilgjengelig via context
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Denne Auth-komponenten er selve innloggingsskjemaet
const Auth = () => {
    // Hent state og funksjoner fra AuthContext
    const { 
        username, password, error, isLoading, isAuthenticated, 
        setUsername, setPassword, setError, setIsLoading, /* Fjern setIsAuthenticated, setUserData herfra */
        login // Bruk login-funksjonen fra context
    } = useAuth(); 
    
    const navigate = useNavigate(); // useNavigate er OK her, da Auth rendres innenfor Router

    // Håndterer innsending av skjemaet
    const handleLocalSubmit = async (e) => {
        e.preventDefault();
        // Ikke sett setIsLoading og setError her, det håndteres av login-funksjonen i context
        try {
            const loggedInUserData = await login(username, password); // Kall login fra context
            // Navigasjon skjer nå basert på useEffect nedenfor som lytter på isAuthenticated
        } catch (err) {
            // Feilmelding settes allerede av login-funksjonen i context
            console.log("Auth Component: Innloggingsfeil mottatt");
        }
    };

    // Effekt for å navigere når brukeren blir autentisert
    useEffect(() => {
        if (isAuthenticated) {
            const user = JSON.parse(localStorage.getItem('user')); // Hent oppdatert brukerdata
            if (user && user.role) {
                console.log("Auth Component: Autentisert, navigerer basert på rolle:", user.role);
                switch(user.role) {
                    case 'admin':
                        navigate('/dashboard');
                        break;
                    case 'tekniker':
                        navigate('/tekniker-dashboard');
                        break;
                    case 'selger':
                        navigate('/selger-dashboard');
                        break;
                    default:
                        console.warn(`Auth Component: Ukjent brukerrolle etter innlogging: ${user.role}`);
                        navigate('/login'); // Fallback, bør ikke skje
                }
            } else {
                console.warn("Auth Component: Autentisert, men mangler brukerrolle for navigasjon.");
                navigate('/login'); // Fallback
            }
        }
    }, [isAuthenticated, navigate]);


    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Innlogging</h2>
                    <p>Logg inn for å fortsette til heisadministrasjonssystemet</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleLocalSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Brukernavn</label>
                        <input
                            type="text"
                            id="username"
                            value={username} // Fra context
                            onChange={(e) => setUsername(e.target.value)} // Fra context
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Passord</label>
                        <input
                            type="password"
                            id="password"
                            value={password} // Fra context
                            onChange={(e) => setPassword(e.target.value)} // Fra context
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`button is-primary is-fullwidth ${isLoading ? 'is-loading' : ''}`} 
                        disabled={isLoading}
                    >
                        Logg inn
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Auth; 