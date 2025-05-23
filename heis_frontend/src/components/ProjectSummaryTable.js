import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProjectSummaryTable = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSummaryData();
    }, []);

    const fetchSummaryData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/project-summary/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const data = response.data.results || response.data;
            // Manuell mapping av display-navn her siden annotering i backend var ufullstendig
            const quoteStatusMap = { 'draft': 'Utkast', 'sent': 'Sendt', 'accepted': 'Akseptert', 'rejected': 'Avslått', '-':'-' };
            const orderStatusMap = { 'pending': 'Avventer', 'processing': 'Behandles', 'shipped': 'Sendt', 'invoiced': 'Fakturert', 'completed': 'Fullført', 'cancelled': 'Kansellert', '-':'-' };
            
            const mappedData = data.map(item => ({
                ...item,
                last_quote_status_display: quoteStatusMap[item.last_quote_status] || item.last_quote_status,
                order_status_display: orderStatusMap[item.order_status] || item.order_status
            }));
            
            setSummaryData(Array.isArray(mappedData) ? mappedData : []);
        } catch (err) {
            console.error('Feil ved henting av prosjektsammendrag:', err.response || err.message);
            setError('Kunne ikke hente prosjektsammendrag.');
            setSummaryData([]);
        } finally {
            setIsLoading(false);
        }
    };

     const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('no-NO');
    }

    return (
        <div className="project-summary-container mt-4">
            <h2>Prosjektoversikt</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster oversikt...</p>}

            <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                            <th>Kunde</th>
                            <th>Prosjekt/Mulighet</th>
                            <th>Opprettet</th>
                            <th>Mulighet Status</th>
                            <th>Siste Tilbud</th>
                            <th>Ordre Status</th>
                            <th>Verdi (Est.)</th>
                            <th>Handlinger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map(item => (
                            <tr key={item.id}>
                                <td>{item.customer_name}</td>
                                <td>{item.name}</td>
                                <td>{formatDate(item.created_at)}</td>
                                <td>{item.status_display}</td>
                                <td>{item.last_quote_status_display}</td>
                                <td>{item.order_status_display}</td>
                                <td>{item.estimated_value ? `${item.estimated_value} kr` : '-'}</td>
                                <td>
                                    {/* Lenke til salgsmulighet (Kanban-kort modal) */}
                                    {/* Trenger en måte å åpne modalen direkte på */}
                                    {/* <button className="btn btn-sm btn-secondary me-1">Vis Mulighet</button> */}
                                    
                                    {/* Lenke til ordre hvis den finnes */}
                                    {item.order_id && (
                                        <Link to={`/orders/${item.order_id}`} className="btn btn-sm btn-info">Vis Ordre</Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {summaryData.length === 0 && !isLoading && (
                            <tr><td colSpan="8">Ingen prosjekter/salgsmuligheter funnet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectSummaryTable; 