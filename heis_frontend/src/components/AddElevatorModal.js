import React, { useState } from 'react';
// import axios from 'axios'; // Fjernes
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import Modal from './Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AddElevatorModal = ({ isOpen, onClose, customers, elevatorTypes, onElevatorAdded }) => {
    const [formData, setFormData] = useState({
        customer: '',
        elevator_type: '',
        serial_number: '',
        installation_date: '',
        last_inspection_date: '',
        next_inspection_date: '',
        location_description: ''
    });
    
    const [uploadedFiles, setUploadedFiles] = useState({
        service_manual: null,
        certification: null
    });
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Håndter feltendringer
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Håndter filendring
    const handleFileChange = (e, fieldName) => {
        setUploadedFiles(prev => ({
            ...prev,
            [fieldName]: e.target.files[0]
        }));
    };

    // Nullstill skjemaet
    const resetForm = () => {
        setFormData({
            customer: '',
            elevator_type: '',
            serial_number: '',
            installation_date: '',
            last_inspection_date: '',
            next_inspection_date: '',
            location_description: ''
        });
        setUploadedFiles({
            service_manual: null,
            certification: null
        });
        setError('');
    };

    // Håndter skjemainnlevering
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        // Valider nødvendige felt
        if (!formData.customer || !formData.elevator_type || !formData.serial_number) {
            setError('Kunde, type og serienummer er påkrevd.');
            setIsSubmitting(false);
            return;
        }
        
        try {
            // Opprett FormData-objekt for å håndtere fil-opplasting
            const elevatorFormData = new FormData();
            
            // Legg til alle skjemafelter
            Object.keys(formData).forEach(key => {
                if (formData[key]) { // Kun legg til felter med verdier
                    elevatorFormData.append(key, formData[key]);
                }
            });
            
            // Legg til eventuelle filer
            if (uploadedFiles.service_manual) {
                elevatorFormData.append('service_manual', uploadedFiles.service_manual);
            }
            if (uploadedFiles.certification) {
                elevatorFormData.append('certification', uploadedFiles.certification);
            }
            
            // Send forespørsel - token og Content-Type håndteres av apiClient
            // const response = await axios.post(
            //     'http://localhost:8000/api/elevators/',
            //     elevatorFormData,
            //     {
            //         headers: {
            //             'Authorization': `Token ${token}`,
            //             'Content-Type': 'multipart/form-data' // Viktig for filopplasting
            //         }
            //     }
            // );
            const response = await apiClient.post('/api/elevators/', elevatorFormData, {
                headers: {
                    // apiClient setter Authorization, men vi må spesifisere multipart for filopplasting
                    'Content-Type': 'multipart/form-data' 
                }
            });
            
            // Håndter vellykket respons
            if (onElevatorAdded) {
                onElevatorAdded(response.data);
            }
            
            resetForm();
            onClose();
        } catch (err) {
            console.error('Feil ved opprettelse av heis:', err);
            setError(`Kunne ikke opprette heisen: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Legg til ny heis">
            <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}
                
                <div className="mb-3">
                    <label htmlFor="customer" className="form-label">Kunde *</label>
                    <select
                        id="customer"
                        name="customer"
                        className="form-select"
                        value={formData.customer}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Velg kunde</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mb-3">
                    <label htmlFor="elevator_type" className="form-label">Type *</label>
                    <select
                        id="elevator_type"
                        name="elevator_type"
                        className="form-select"
                        value={formData.elevator_type}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Velg type</option>
                        {elevatorTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mb-3">
                    <label htmlFor="serial_number" className="form-label">Serienummer *</label>
                    <input
                        type="text"
                        id="serial_number"
                        name="serial_number"
                        className="form-control"
                        value={formData.serial_number}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="installation_date" className="form-label">Installasjonsdato</label>
                    <input
                        type="date"
                        id="installation_date"
                        name="installation_date"
                        className="form-control"
                        value={formData.installation_date}
                        onChange={handleInputChange}
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="last_inspection_date" className="form-label">Siste inspeksjon</label>
                    <input
                        type="date"
                        id="last_inspection_date"
                        name="last_inspection_date"
                        className="form-control"
                        value={formData.last_inspection_date}
                        onChange={handleInputChange}
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="next_inspection_date" className="form-label">Neste inspeksjon</label>
                    <input
                        type="date"
                        id="next_inspection_date"
                        name="next_inspection_date"
                        className="form-control"
                        value={formData.next_inspection_date}
                        onChange={handleInputChange}
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="location_description" className="form-label">Plasseringsbeskrivelse</label>
                    <textarea
                        id="location_description"
                        name="location_description"
                        className="form-control"
                        value={formData.location_description}
                        onChange={handleInputChange}
                        rows="2"
                    ></textarea>
                </div>
                
                <hr />
                <h5>Dokumenter</h5>
                
                <div className="mb-3">
                    <label htmlFor="service_manual" className="form-label">Servicemanual</label>
                    <input
                        type="file"
                        id="service_manual"
                        className="form-control"
                        onChange={(e) => handleFileChange(e, 'service_manual')}
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="certification" className="form-label">Sertifisering</label>
                    <input
                        type="file"
                        id="certification"
                        className="form-control"
                        onChange={(e) => handleFileChange(e, 'certification')}
                    />
                </div>
                
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Avbryt
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Lagrer...' : 'Legg til heis'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddElevatorModal; 