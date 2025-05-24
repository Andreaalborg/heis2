import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // For å lenke til detaljsiden

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const QuoteList = () => {
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // TODO: Legg til state for filtrering/sortering hvis ønskelig

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/quotes/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const quoteData = response.data.results || response.data;
            setQuotes(Array.isArray(quoteData) ? quoteData : []);
        } catch (err) {
            console.error('Feil ved henting av tilbud:', err.response || err.message);
            setError('Kunne ikke hente tilbudslisten.');
            setQuotes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuote = async (quoteId) => {
        // Enkel bekreftelse
        if (window.confirm('Er du sikker på at du vil slette dette tilbudet? Dette kan ikke angres.')) {
             // Bruker setIsLoading for å indikere prosessering
            setIsLoading(true); 
            setError('');
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/quotes/${quoteId}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                // Hent listen på nytt for å reflektere slettingen
                fetchQuotes(); 
            } catch (err) {
                 console.error('Feil ved sletting av tilbud:', err.response || err.message);
                 // Vis spesifikk feil hvis mulig 
                 const errorMsg = err.response?.status === 403 
                    ? 'Du har ikke tillatelse til å slette dette tilbudet.'
                    : `Kunne ikke slette tilbudet (${err.response?.data?.detail || err.message}).`;
                setError(errorMsg);
                setIsLoading(false); // Må skru av loading ved feil
            }
            // setIsLoading(false) settes i fetchQuotes' finally block ved suksess
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div className="container mt-4">
            <h1>Tilbudsoversikt</h1>
            {/* TODO: Legg til filtrerings-UI her */} 

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster tilbud...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Tilbudsnummer</th>
                        <th>Kunde</th>
                        <th>Salgsmulighet</th>
                        <th>Status</th>
                        <th>Utstedt Dato</th>
                        <th>Totalsum (kr)</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {quotes.map(quote => (
                        <tr key={quote.id}>
                            <td>{quote.quote_number || `ID ${quote.id}`}</td>
                            <td>{quote.opportunity_details?.customer_name || '-'}</td>
                            <td>{quote.opportunity_details?.name || '-'}</td>
                            <td>{quote.status_display}</td>
                            <td>{formatDate(quote.issue_date)}</td>
                            <td>{quote.total_amount ? `${quote.total_amount} kr` : '-'}</td>
                            <td>
                                <Link 
                                    to={`/quotes/${quote.id}`} 
                                    className="btn btn-sm btn-info me-1"
                                >
                                    Vis Detaljer
                                </Link>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDeleteQuote(quote.id)}
                                    disabled={isLoading}
                                >
                                    Slett
                                </button>
                            </td>
                        </tr>
                    ))}
                    {quotes.length === 0 && !isLoading && (
                        <tr><td colSpan="7">Ingen tilbud funnet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default QuoteList; 