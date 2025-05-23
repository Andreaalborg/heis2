import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal'; // Gjenbruker den generiske Modal-komponenten
import { useNavigate } from 'react-router-dom';

const AddEditOpportunityModal = ({ isOpen, onClose, onSave, opportunityToEdit }) => {
    const [name, setName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('new'); // Default status
    const [estimatedValue, setEstimatedValue] = useState('');
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);
    const navigate = useNavigate();

    // Statiske statusvalg basert på modellen
    const statusOptions = [
        { value: 'new', label: 'Ny' },
        { value: 'contacted', label: 'Kontaktet' },
        { value: 'proposal', label: 'Tilbud Sendt' },
        { value: 'negotiation', label: 'Forhandling' },
        { value: 'won', label: 'Vunnet' },
        { value: 'lost', label: 'Tapt' },
    ];

    // Hent kundeliste når modalen åpnes (eller komponenten lastes)
    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
        }
    }, [isOpen]);

    // Fyll ut skjema hvis vi redigerer en eksisterende mulighet
    useEffect(() => {
        if (opportunityToEdit) {
            setName(opportunityToEdit.name || '');
            setCustomerId(opportunityToEdit.customer || ''); // customer er ID-en
            setDescription(opportunityToEdit.description || '');
            setStatus(opportunityToEdit.status || 'new');
            setEstimatedValue(opportunityToEdit.estimated_value || '');
        } else {
            // Reset skjema når vi legger til ny
            setName('');
            setCustomerId('');
            setDescription('');
            setStatus('new');
            setEstimatedValue('');
        }
    }, [opportunityToEdit, isOpen]); // Kjør når opportunityToEdit eller isOpen endres

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/customers/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const customerData = response.data.results || response.data;
            setCustomers(Array.isArray(customerData) ? customerData : []);
        } catch (err) {
            console.error("Feil ved henting av kunder:", err);
            setError('Kunne ikke laste kundeliste.');
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const opportunityData = {
            name,
            customer: customerId,
            description,
            status,
            estimated_value: estimatedValue || null, // Send null hvis tom
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            let response;

            if (opportunityToEdit && opportunityToEdit.id) {
                // Oppdater eksisterende
                response = await axios.put(`http://localhost:8000/api/sales-opportunities/${opportunityToEdit.id}/`, opportunityData, config);
            } else {
                // Legg til ny
                response = await axios.post('http://localhost:8000/api/sales-opportunities/', opportunityData, config);
            }

            if (response.status === 200 || response.status === 201) {
                onSave(); // Kall onSave callback (som lukker modal og henter listen på nytt)
            } else {
                 setError('Noe gikk galt ved lagring.');
            }

        } catch (err) {
            console.error('Feil ved lagring av salgsmulighet:', err.response || err.message);
            setError(`Kunne ikke lagre: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Funksjon for å opprette et nytt tilbud
    const handleCreateQuote = async () => {
        if (!opportunityToEdit || !opportunityToEdit.id) return; // Sikkerhetssjekk

        setIsCreatingQuote(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/api/quotes/', 
                { opportunity: opportunityToEdit.id }, // Send kun opportunity ID
                { headers: { 'Authorization': `Token ${token}` } }
            );

            if (response.status === 201 && response.data.id) {
                const newQuoteId = response.data.id;
                console.log(`Opprettet nytt tilbud med ID: ${newQuoteId}`);
                onClose(); // Lukk modalen
                navigate(`/quotes/${newQuoteId}`); // Naviger til den nye tilbudssiden
            } else {
                setError('Kunne ikke opprette tilbud.');
            }
        } catch (err) {
            console.error('Feil ved oppretting av tilbud:', err.response || err.message);
            setError(`Kunne ikke opprette tilbud: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsCreatingQuote(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={opportunityToEdit ? 'Rediger Salgsmulighet' : 'Legg til Salgsmulighet'}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <div className="mb-3">
                    <label htmlFor="opp-name" className="form-label">Navn/Beskrivelse *</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="opp-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="opp-customer" className="form-label">Kunde *</label>
                    <select 
                        className="form-select" 
                        id="opp-customer" 
                        value={customerId} 
                        onChange={(e) => setCustomerId(e.target.value)} 
                        required
                    >
                        <option value="">Velg kunde...</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="opp-description" className="form-label">Detaljert Beskrivelse</label>
                    <textarea 
                        className="form-control" 
                        id="opp-description" 
                        rows="3" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="opp-status" className="form-label">Status *</label>
                    <select 
                        className="form-select" 
                        id="opp-status" 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)} 
                        required
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="opp-value" className="form-label">Estimert Verdi (kr)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        id="opp-value" 
                        value={estimatedValue} 
                        onChange={(e) => setEstimatedValue(e.target.value)} 
                    />
                </div>
                
                <div className="d-flex justify-content-between mt-4">
                    <div>
                        {opportunityToEdit && (
                            <button 
                                type="button" 
                                className="btn btn-info" 
                                onClick={handleCreateQuote} 
                                disabled={isCreatingQuote || isLoading}
                            >
                                {isCreatingQuote ? 'Oppretter...' : 'Lag Tilbud'}
                            </button>
                        )}
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isLoading || isCreatingQuote}>Avbryt</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading || isCreatingQuote}>
                            {isLoading ? 'Lagrer...' : (opportunityToEdit ? 'Oppdater' : 'Legg til')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditOpportunityModal; 