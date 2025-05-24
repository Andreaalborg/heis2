import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddEditAbsenceModal from './AddEditAbsenceModal'; // Lager denne snart

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AbsenceManagement = () => {
    const [absences, setAbsences] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState(null);

    useEffect(() => {
        fetchAbsences();
    }, []);

    const fetchAbsences = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/absences/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const absenceData = response.data.results || response.data;
            setAbsences(Array.isArray(absenceData) ? absenceData : []);
        } catch (err) {
            console.error('Feil ved henting av fravær:', err.response || err.message);
            setError('Kunne ikke hente fraværslisten.');
            setAbsences([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingAbsence(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (absence) => {
        setEditingAbsence(absence);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAbsence(null);
    };

    const handleSave = () => {
        fetchAbsences(); 
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Er du sikker på at du vil slette dette fraværet?')) {
            setIsLoading(true); 
            setError('');
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/absences/${id}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                fetchAbsences();
            } catch (err) {
                console.error('Feil ved sletting av fravær:', err.response || err.message);
                const errorMsg = err.response?.status === 403 
                    ? 'Du har ikke tillatelse til å slette fravær.'
                    : `Kunne ikke slette fraværet (${err.response?.data?.detail || err.message}).`;
                setError(errorMsg);
                setIsLoading(false); 
            }
        }
    };

     const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('no-NO');
    }

    return (
        <div className="container mt-4">
            <h1>Administrer Fravær</h1>
            <button className="btn btn-primary mb-3" onClick={handleOpenAddModal}>Registrer Nytt Fravær</button>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster fravær...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Ansatt</th>
                        <th>Type</th>
                        <th>Startdato</th>
                        <th>Sluttdato</th>
                        <th>Beskrivelse</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {absences.map(absence => (
                        <tr key={absence.id}>
                            <td>{absence.user_details?.username || '-'}</td>
                            <td>{absence.absence_type_display}</td>
                            <td>{formatDate(absence.start_date)}</td>
                            <td>{formatDate(absence.end_date)}</td>
                            <td>{absence.description || '-'}</td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-warning me-2" 
                                    onClick={() => handleOpenEditModal(absence)}
                                >
                                    Rediger
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDelete(absence.id)}
                                >
                                    Slett
                                </button>
                            </td>
                        </tr>
                    ))}
                    {absences.length === 0 && !isLoading && (
                        <tr><td colSpan="6">Ingen fravær registrert.</td></tr>
                    )}
                </tbody>
            </table>

            <AddEditAbsenceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                absenceToEdit={editingAbsence}
            />
        </div>
    );
};

export default AbsenceManagement; 