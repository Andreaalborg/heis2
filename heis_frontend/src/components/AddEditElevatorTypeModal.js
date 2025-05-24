import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AddEditElevatorTypeModal = ({ isOpen, onClose, onSave, typeToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeToEdit) {
            setName(typeToEdit.name || '');
            setDescription(typeToEdit.description || '');
            setPrice(typeToEdit.price !== null ? typeToEdit.price : ''); // Håndter null for pris
        } else {
            setName('');
            setDescription('');
            setPrice('');
        }
    }, [typeToEdit, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!name) {
            setError('Navn på heistype er påkrevd.');
            setIsLoading(false);
            return;
        }

        const typeData = {
            name,
            description,
            price: price === '' ? null : parseFloat(price), // Send null hvis tomt, ellers tall
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            let response;

            if (typeToEdit && typeToEdit.id) {
                response = await axios.put(`${API_BASE_URL}/api/elevator-types/${typeToEdit.id}/`, typeData, config);
            } else {
                response = await axios.post(`${API_BASE_URL}/api/elevator-types/`, typeData, config);
            }

            if (response.status === 200 || response.status === 201) {
                onSave(response.data);
            } else {
                setError('Noe gikk galt ved lagring.');
            }

        } catch (err) {
            console.error('Feil ved lagring av heistype:', err.response || err.message);
             const errorMsg = err.response?.status === 403 
                    ? 'Du har ikke tillatelse til å endre/legge til heistyper.'
                    : `Kunne ikke lagre heistype (${err.response?.data?.detail || err.message}).`;
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={typeToEdit ? 'Rediger Heistype' : 'Legg til Heistype'}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <div className="mb-3">
                    <label htmlFor="type-name" className="form-label">Navn *</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="type-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                    />
                </div>

                 <div className="mb-3">
                    <label htmlFor="type-description" className="form-label">Beskrivelse</label>
                    <textarea 
                        className="form-control" 
                        id="type-description" 
                        rows="3" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                 <div className="mb-3">
                    <label htmlFor="type-price" className="form-label">Standard Pris (kr)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        id="type-price" 
                        value={price} 
                        placeholder="La stå tomt hvis pris ikke er satt" 
                        onChange={(e) => setPrice(e.target.value)} 
                        min="0"
                    />
                </div>
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isLoading}>Avbryt</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Lagrer...' : (typeToEdit ? 'Oppdater Type' : 'Legg til Type')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditElevatorTypeModal; 