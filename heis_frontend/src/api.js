import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // Du kan også sette andre standardinnstillinger her om nødvendig
});

// Legg til en request interceptor for å automatisk inkludere token i headers
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default apiClient; 