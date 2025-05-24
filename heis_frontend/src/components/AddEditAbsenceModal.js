import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AddEditAbsenceModal = ({ isOpen, onClose, onSave, absenceToEdit }) => {
    const [userId, setUserId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [absenceType, setAbsenceType] = useState('sick_leave'); // Default type
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState([]); // For dropdown
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Fraværstyper fra modellen
    const absenceTypeOptions = [
        { value: 'sick_leave', label: 'Sykemelding' },
        { value: 'vacation', label: 'Ferie' },
        { value: 'leave_of_absence', label: 'Permisjon' },
        { value: 'public_holiday', label: 'Helligdag' },
        { value: 'other', label: 'Annet' },
    ];

    // Hent brukerliste når modalen åpnes
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // Fyll ut skjema ved redigering
    useEffect(() => {
        if (absenceToEdit) {
            setUserId(absenceToEdit.user || '');
            setStartDate(absenceToEdit.start_date || '');
            setEndDate(absenceToEdit.end_date || '');
            setAbsenceType(absenceToEdit.absence_type || 'sick_leave');
            setDescription(absenceToEdit.description || '');
        } else {
            // Reset skjema
            setUserId('');
            setStartDate('');
            setEndDate('');
            setAbsenceType('sick_leave');
            setDescription('');
        }
    }, [absenceToEdit, isOpen]);

    const fetchUsers = async () => {
        setIsLoading(true); // Bruker samme loading-state
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/users/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            setUsers(response.data.results || response.data);
        } catch (err) {
            console.error("Feil ved henting av brukere:", err);
            setError('Kunne ikke laste brukerliste.');
            setUsers([]);
        } finally {
             // Setter ikke loading false her hvis users lastes i bakgrunnen
        }
        setIsLoading(false); // Sett false etter fetch uansett
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!userId || !startDate || !endDate || !absenceType) {
            setError('Alle felter unntatt Beskrivelse må fylles ut.');
            setIsLoading(false);
            return;
        }
        // Enkel datovalidering
        if (new Date(endDate) < new Date(startDate)) {
            setError('Sluttdato kan ikke være før startdato.');
            setIsLoading(false);
            return;
        }

        const absenceData = {
            user: userId,
            start_date: startDate,
            end_date: endDate,
            absence_type: absenceType,
            description,
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            let response;

            if (absenceToEdit && absenceToEdit.id) {
                response = await axios.put(`${API_BASE_URL}/api/absences/${absenceToEdit.id}/`, absenceData, config);
            } else {
                response = await axios.post(`${API_BASE_URL}/api/absences/`, absenceData, config);
            }

            if (response.status === 200 || response.status === 201) {
                onSave();
            } else {
                setError('Noe gikk galt ved lagring av fravær.');
            }

        } catch (err) {
            console.error('Feil ved lagring av fravær:', err.response || err.message);
            const errorMsg = err.response?.status === 403 
                ? 'Du har ikke tillatelse til å endre/legge til fravær.'
                : `Kunne ikke lagre fravær (${err.response?.data?.detail || err.message}).`;
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={absenceToEdit ? 'Rediger Fravær' : 'Registrer Fravær'}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <div className="mb-3">
                    <label htmlFor="absence-user" className="form-label">Ansatt *</label>
                    <select 
                        className="form-select" 
                        id="absence-user" 
                        value={userId} 
                        onChange={(e) => setUserId(e.target.value)} 
                        required
                    >
                        <option value="">Velg ansatt...</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username} ({user.first_name} {user.last_name})</option>
                        ))}
                    </select>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="absence-startdate" className="form-label">Startdato *</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            id="absence-startdate" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="absence-enddate" className="form-label">Sluttdato (inkl.) *</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            id="absence-enddate" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            required 
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label htmlFor="absence-type" className="form-label">Type fravær *</label>
                    <select 
                        className="form-select" 
                        id="absence-type" 
                        value={absenceType} 
                        onChange={(e) => setAbsenceType(e.target.value)} 
                        required
                    >
                        {absenceTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="absence-description" className="form-label">Beskrivelse/Kommentar</label>
                    <textarea 
                        className="form-control" 
                        id="absence-description" 
                        rows="3" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isLoading}>Avbryt</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Lagrer...' : (absenceToEdit ? 'Oppdater Fravær' : 'Registrer Fravær')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditAbsenceModal; 