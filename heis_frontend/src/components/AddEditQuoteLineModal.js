import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

// Mottar quoteId for å vite hvilket tilbud linjen tilhører
// lineToEdit vil bli brukt senere for redigering
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AddEditQuoteLineModal = ({ isOpen, onClose, onSave, quoteId, lineToEdit }) => {
    // Fjerner description og unitPrice state, legger til elevatorTypeId
    const [elevatorTypeId, setElevatorTypeId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [elevatorTypes, setElevatorTypes] = useState([]); // State for å holde heistypene
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Hent heistyper når modalen åpnes
    useEffect(() => {
        if (isOpen) {
            fetchElevatorTypes();
        }
    }, [isOpen]);

    useEffect(() => {
        if (lineToEdit) {
            setElevatorTypeId(lineToEdit.elevator_type || ''); // elevator_type er ID-en
            setQuantity(lineToEdit.quantity || 1);
        } else {
            setElevatorTypeId('');
            setQuantity(1);
        }
    }, [lineToEdit, isOpen]);

    const fetchElevatorTypes = async () => {
        // Midlertidig setter loading for å unngå race condition med submit
        setIsLoading(true); 
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/elevator-types/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            setElevatorTypes(response.data.results || response.data); // Håndterer paginering hvis det finnes
        } catch (err) {
            console.error("Feil ved henting av heistyper:", err);
            setError('Kunne ikke laste heistyper.');
            setElevatorTypes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validering
        if (!elevatorTypeId || quantity <= 0) {
            setError('Vennligst velg en Heistype og angi Antall (>0).');
            setIsLoading(false);
            return;
        }

        const lineData = {
            quote: quoteId,
            elevator_type: elevatorTypeId, // Sender ID for heistype
            quantity: parseInt(quantity, 10),
            // unit_price og description fjernet
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            let response;

            if (lineToEdit && lineToEdit.id) {
                 // Oppdater eksisterende linje
                response = await axios.put(`${API_BASE_URL}/api/quote-line-items/${lineToEdit.id}/`, lineData, config);
            } else {
                // Legg til ny linje
                response = await axios.post(`${API_BASE_URL}/api/quote-line-items/`, lineData, config);
            }

            if (response.status === 201 || response.status === 200) { 
                onSave(response.data);
            } else {
                setError('Noe gikk galt ved lagring av linje.');
            }

        } catch (err) {
            console.error('Feil ved lagring av tilbudslinje:', err.response || err.message);
            setError(`Kunne ikke lagre linje: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Finn pris for valgt heistype for visning (valgfritt)
    const selectedTypePrice = elevatorTypes.find(et => et.id === parseInt(elevatorTypeId, 10))?.price;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lineToEdit ? 'Rediger Tilbudslinje' : 'Legg til Tilbudslinje'}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                
                {/* Dropdown for Heistype */}
                <div className="mb-3">
                    <label htmlFor="line-elevator-type" className="form-label">Heistype *</label>
                    <select 
                        className="form-select" 
                        id="line-elevator-type" 
                        value={elevatorTypeId} 
                        onChange={(e) => setElevatorTypeId(e.target.value)} 
                        required
                    >
                        <option value="">Velg heistype...</option>
                        {elevatorTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name} {type.price ? `(${type.price} kr)` : '(Pris mangler)'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Input for Antall */} 
                <div className="mb-3">
                    <label htmlFor="line-quantity" className="form-label">Antall *</label>
                    <input 
                        type="number" 
                        className="form-control" 
                        id="line-quantity" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        min="1" 
                        required 
                    />
                </div>

                {/* Valgfritt: Vis beregnet pris basert på valg */}
                {selectedTypePrice && quantity > 0 && (
                     <div className="mb-3 text-muted">
                         Beregnet linjetotal: {(selectedTypePrice * quantity).toFixed(2)} kr
                     </div>
                 )}
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isLoading}>Avbryt</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Lagrer...' : (lineToEdit ? 'Oppdater linje' : 'Legg til linje')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditQuoteLineModal; 