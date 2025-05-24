import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddEditElevatorTypeModal from './AddEditElevatorTypeModal'; // Lager denne snart

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ElevatorTypeList = () => {
    const [elevatorTypes, setElevatorTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);

    useEffect(() => {
        fetchElevatorTypes();
    }, []);

    const fetchElevatorTypes = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            // Antar at alle autentiserte kan se typer, men kun admin kan endre (pga IsAdminOrReadOnly i view)
            const response = await axios.get(`${API_BASE_URL}/api/elevator-types/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const typeData = response.data.results || response.data;
            setElevatorTypes(Array.isArray(typeData) ? typeData : []);
        } catch (err) {
            console.error('Feil ved henting av heistyper:', err.response || err.message);
            setError('Kunne ikke hente heistyper.');
            setElevatorTypes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingType(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (type) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
    };

    const handleSave = () => {
        fetchElevatorTypes(); // Hent listen på nytt etter lagring
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Er du sikker på at du vil slette denne heistypen? Dette kan ikke angres.')) {
            setIsLoading(true); 
            setError('');
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/elevator-types/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                fetchElevatorTypes(); // Hent oppdatert liste
            } catch (err) {
                console.error('Feil ved sletting:', err.response || err.message);
                // Vis spesifikk feil hvis mulig (f.eks. 403 Forbidden hvis ikke admin)
                const errorMsg = err.response?.status === 403 
                    ? 'Du har ikke tillatelse til å slette heistyper.'
                    : `Kunne ikke slette heistypen (${err.response?.data?.detail || err.message}).`;
                setError(errorMsg);
                setIsLoading(false); // Slå av ved feil
            }
        }
    };

    return (
        <div className="container mt-4">
            <h1>Administrer Heistyper</h1>
            <button className="btn btn-primary mb-3" onClick={handleOpenAddModal}>Ny Heistype</button>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster heistyper...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Navn</th>
                        <th>Beskrivelse</th>
                        <th>Standard Pris (kr)</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {elevatorTypes.map(type => (
                        <tr key={type.id}>
                            <td>{type.name}</td>
                            <td>{type.description || '-'}</td>
                            <td>{type.price !== null ? type.price : 'Ikke satt'}</td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-warning me-2" 
                                    onClick={() => handleOpenEditModal(type)}
                                >
                                    Rediger
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDelete(type.id)}
                                >
                                    Slett
                                </button>
                            </td>
                        </tr>
                    ))}
                    {elevatorTypes.length === 0 && !isLoading && (
                        <tr><td colSpan="4">Ingen heistyper funnet.</td></tr>
                    )}
                </tbody>
            </table>

            <AddEditElevatorTypeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                typeToEdit={editingType}
            />
        </div>
    );
};

export default ElevatorTypeList; 