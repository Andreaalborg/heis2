import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import 'bulma/css/bulma.min.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Auth = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        console.log("Forsøker å logge inn med:", { username, password });

        try {
            const response = await axios.post(`${API_BASE_URL}/api-token-auth/`, {
                username,
                password
            });

            if (response.data.token) {
                const token = response.data.token;
                localStorage.setItem('token', token);
                localStorage.setItem('username', username);
                
                // Hent brukerinformasjon for å få rollen
                const userResponse = await axios.get(`${API_BASE_URL}/api/users/current_user/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                const userData = userResponse.data;
                
                // Kall handleAuthentication fra App.js for å oppdatere state og lagre brukerdata
                setIsAuthenticated(true, userData);

                // Naviger basert på rolle
                switch(userData.role) {
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
                        console.warn(`Ukjent brukerrolle ved innlogging: ${userData.role}`);
                        navigate('/login');
                        setIsAuthenticated(false);
                }
            }
        } catch (err) {
            setError('Feil brukernavn eller passord. Prøv igjen.');
            console.error('Innloggingsfeil:', err.response || err.message);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Innlogging</h2>
                    <p>Logg inn for å fortsette til heisadministrasjonssystemet</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Brukernavn</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Passord</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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