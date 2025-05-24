import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddEditOpportunityModal from './AddEditOpportunityModal'; // Vi lager denne snart

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesOpportunityList = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/sales-opportunities/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const oppData = response.data.results || response.data; // Håndterer paginering hvis det finnes
            setOpportunities(Array.isArray(oppData) ? oppData : []);
        } catch (err) {
            console.error('Feil ved henting av salgsmuligheter:', err.response || err.message);
            setError('Kunne ikke hente salgsmuligheter.');
            setOpportunities([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingOpportunity(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (opportunity) => {
        setEditingOpportunity(opportunity);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOpportunity(null);
    };

    const handleSave = () => {
        fetchOpportunities(); // Hent listen på nytt etter lagring
        handleCloseModal();
    };

    // Foreløpig enkel slettefunksjon
    const handleDelete = async (id) => {
        if (window.confirm('Er du sikker på at du vil slette denne salgsmuligheten?')) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/sales-opportunities/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                fetchOpportunities(); // Hent oppdatert liste
            } catch (err) {
                console.error('Feil ved sletting:', err.response || err.message);
                setError('Kunne ikke slette salgsmuligheten.');
                setIsLoading(false); // Slå av ved feil
            }
            // setIsLoading(false) er i fetchOpportunities' finally block
        }
    };

    return (
        <div className="container mt-4">
            <h1>Salgsmuligheter</h1>
            <button className="btn btn-primary mb-3" onClick={handleOpenAddModal}>Ny Salgsmulighet</button>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Navn/Beskrivelse</th>
                        <th>Kunde</th>
                        <th>Status</th>
                        <th>Estimert Verdi</th>
                        <th>Opprettet</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {opportunities.map(opp => (
                        <tr key={opp.id}><td>{opp.name}</td><td>{opp.customer_name}</td><td>{opp.status_display}</td><td>{opp.estimated_value ? `${opp.estimated_value} kr` : '-'}</td><td>{new Date(opp.created_at).toLocaleDateString()}</td><td><button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenEditModal(opp)}>Rediger</button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(opp.id)}>Slett</button></td></tr>
                    ))}
                    {opportunities.length === 0 && !isLoading && (<tr><td colSpan="6">Ingen salgsmuligheter funnet.</td></tr>)}
                </tbody>
            </table>

            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                opportunityToEdit={editingOpportunity}
            />
        </div>
    );
};

export default SalesOpportunityList; 