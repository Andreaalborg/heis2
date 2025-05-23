import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';

const ElevatorDetailsModal = ({ isOpen, onClose, elevator, customers, elevatorTypes, onElevatorUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [formData, setFormData] = useState({});
    
    // Håndter filopplasting
    const [uploadedFiles, setUploadedFiles] = useState({
        service_manual: null,
        certification: null
    });
    const [showFileInput, setShowFileInput] = useState({
        service_manual: false,
        certification: false
    });

    // Initialiser formdata når heisen endres
    React.useEffect(() => {
        if (elevator) {
            setFormData({
                customer: elevator.customer,
                elevator_type: elevator.elevator_type,
                serial_number: elevator.serial_number,
                installation_date: elevator.installation_date ? elevator.installation_date.split('T')[0] : '',
                last_inspection_date: elevator.last_inspection_date ? elevator.last_inspection_date.split('T')[0] : '',
                next_inspection_date: elevator.next_inspection_date ? elevator.next_inspection_date.split('T')[0] : '',
                location_description: elevator.location_description || ''
            });
        }
    }, [elevator]);

    if (!elevator) {
        return null;
    }

    const API_BASE_URL = 'http://localhost:8000';

    // Bygg URL-er til dokumenter
    let serviceManualUrl = null;
    let certificationUrl = null;
    try {
        if (elevator.service_manual) {
            serviceManualUrl = new URL(elevator.service_manual, API_BASE_URL).href;
        }
        if (elevator.certification) {
            certificationUrl = new URL(elevator.certification, API_BASE_URL).href;
        }
    } catch (e) {
        console.error("Feil ved bygging av dokumentURL:", e);
    }

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

    // Vis filopplastingsfelt
    const handleShowFileInput = (fieldName) => {
        setShowFileInput(prev => ({
            ...prev,
            [fieldName]: true
        }));
    };

    // Lagre endringer
    const handleSaveChanges = async () => {
        setIsUpdating(true);
        setUpdateError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_BASE_URL}/api/elevators/${elevator.id}/`,
                formData,
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Oppdater i parent komponent
            if (onElevatorUpdated) {
                onElevatorUpdated(response.data);
            }
            
            setIsEditing(false);
        } catch (err) {
            console.error('Feil ved oppdatering av heis:', err);
            setUpdateError(`Kunne ikke oppdatere heisen: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // Oppdater dokument
    const handleUpdateFile = async (fieldName, isDelete = false) => {
        if (isDelete && !window.confirm('Er du sikker på at du vil slette dette dokumentet?')) {
            return;
        }

        setIsUpdating(true);
        setUpdateError('');
        
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            if (isDelete) {
                // For å slette, send tom streng
                formData.append(fieldName, '');
            } else if (uploadedFiles[fieldName]) {
                formData.append(fieldName, uploadedFiles[fieldName]);
            } else {
                setUpdateError(`Ingen fil valgt for opplasting.`);
                setIsUpdating(false);
                return;
            }

            const response = await axios.patch(
                `${API_BASE_URL}/api/elevators/${elevator.id}/`, 
                formData,
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Nullstill fil-inputs
            setShowFileInput(prev => ({
                ...prev,
                [fieldName]: false
            }));
            setUploadedFiles(prev => ({
                ...prev,
                [fieldName]: null
            }));

            // Oppdater i parent-komponenten
            if (onElevatorUpdated) {
                onElevatorUpdated(response.data);
            }

        } catch (err) {
            console.error('Feil ved oppdatering av dokument:', err);
            setUpdateError(`Kunne ikke oppdatere dokumentet: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detaljer for heis: ${elevator.serial_number}`}>
            {updateError && <div className="form-error">{updateError}</div>}
            
            <div className="elevator-details-content">
                {isEditing ? (
                    // Redigeringsmodus
                    <form>
                        {/* Redigeringsform for grunnleggende felt */}
                        <div className="mb-3">
                            <label htmlFor="customer" className="form-label">Kunde</label>
                            <select
                                id="customer"
                                name="customer"
                                className="form-select"
                                value={formData.customer || ''}
                                onChange={handleInputChange}
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
                            <label htmlFor="elevator_type" className="form-label">Type</label>
                            <select
                                id="elevator_type"
                                name="elevator_type"
                                className="form-select"
                                value={formData.elevator_type || ''}
                                onChange={handleInputChange}
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
                            <label htmlFor="serial_number" className="form-label">Serienummer</label>
                            <input
                                type="text"
                                id="serial_number"
                                name="serial_number"
                                className="form-control"
                                value={formData.serial_number || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label htmlFor="installation_date" className="form-label">Installasjonsdato</label>
                            <input
                                type="date"
                                id="installation_date"
                                name="installation_date"
                                className="form-control"
                                value={formData.installation_date || ''}
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
                                value={formData.last_inspection_date || ''}
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
                                value={formData.next_inspection_date || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label htmlFor="location_description" className="form-label">Plasseringsbeskrivelse</label>
                            <textarea
                                id="location_description"
                                name="location_description"
                                className="form-control"
                                value={formData.location_description || ''}
                                onChange={handleInputChange}
                                rows="3"
                            ></textarea>
                        </div>
                        
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setIsEditing(false)}
                                disabled={isUpdating}
                            >
                                Avbryt
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleSaveChanges}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Lagrer...' : 'Lagre endringer'}
                            </button>
                        </div>
                    </form>
                ) : (
                    // Visningsmodus for grunnleggende informasjon
                    <>
                        <div className="mb-4">
                            <div className="d-flex justify-content-end">
                                <button 
                                    className="btn btn-sm btn-primary" 
                                    onClick={() => setIsEditing(true)}
                                >
                                    Rediger
                                </button>
                            </div>
                            
                            <p><strong>Kunde:</strong> {elevator.customer_name}</p>
                            <p><strong>Type:</strong> {elevator.elevator_type_name}</p>
                            <p><strong>Serienummer:</strong> {elevator.serial_number}</p>
                            <p>
                                <strong>Installasjonsdato:</strong> {
                                    elevator.installation_date ? 
                                    new Date(elevator.installation_date).toLocaleDateString('nb-NO') : 
                                    'Ikke angitt'
                                }
                            </p>
                            <p>
                                <strong>Siste inspeksjon:</strong> {
                                    elevator.last_inspection_date ? 
                                    new Date(elevator.last_inspection_date).toLocaleDateString('nb-NO') : 
                                    'Ikke angitt'
                                }
                            </p>
                            <p>
                                <strong>Neste inspeksjon:</strong> {
                                    elevator.next_inspection_date ? 
                                    new Date(elevator.next_inspection_date).toLocaleDateString('nb-NO') : 
                                    'Ikke planlagt'
                                }
                            </p>
                            <p>
                                <strong>Plassering:</strong> {
                                    elevator.location_description || 'Ingen beskrivelse'
                                }
                            </p>
                        </div>
                        
                        <hr />
                        
                        {/* Dokumentseksjon */}
                        <h4>Dokumenter</h4>
                        
                        {/* Servicemanual */}
                        <div className="document-section mb-3">
                            <strong>Servicemanual:</strong>
                            {serviceManualUrl ? (
                                <div className="mt-2">
                                    <p>
                                        <a href={serviceManualUrl} target="_blank" rel="noopener noreferrer">
                                            Vis/Last ned servicemanual
                                        </a>
                                    </p>
                                    
                                    {/* Knapper for å endre/slette */}
                                    <div className="document-actions" style={{ display: 'flex', gap: '10px' }}>
                                        {!showFileInput.service_manual ? (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-primary" 
                                                    onClick={() => handleShowFileInput('service_manual')}
                                                    disabled={isUpdating}
                                                >
                                                    Erstatt
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger" 
                                                    onClick={() => handleUpdateFile('service_manual', true)}
                                                    disabled={isUpdating}
                                                >
                                                    Slett
                                                </button>
                                            </>
                                        ) : (
                                            <div className="mt-2">
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => handleFileChange(e, 'service_manual')}
                                                    style={{ marginBottom: '10px' }}
                                                />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-success" 
                                                        onClick={() => handleUpdateFile('service_manual')}
                                                        disabled={isUpdating || !uploadedFiles.service_manual}
                                                    >
                                                        {isUpdating ? 'Laster opp...' : 'Last opp'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-secondary" 
                                                        onClick={() => setShowFileInput(prev => ({...prev, service_manual: false}))}
                                                        disabled={isUpdating}
                                                    >
                                                        Avbryt
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : showFileInput.service_manual ? (
                                <div className="mt-2">
                                    <input 
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'service_manual')}
                                        style={{ marginBottom: '10px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="btn btn-sm btn-success" 
                                            onClick={() => handleUpdateFile('service_manual')}
                                            disabled={isUpdating || !uploadedFiles.service_manual}
                                        >
                                            {isUpdating ? 'Laster opp...' : 'Last opp'}
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-secondary" 
                                            onClick={() => setShowFileInput(prev => ({...prev, service_manual: false}))}
                                            disabled={isUpdating}
                                        >
                                            Avbryt
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p><i>Ingen servicemanual lastet opp.</i></p>
                                    <button 
                                        className="btn btn-sm btn-primary" 
                                        onClick={() => handleShowFileInput('service_manual')}
                                        disabled={isUpdating}
                                    >
                                        Last opp manual
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Sertifisering */}
                        <div className="document-section mb-3">
                            <strong>Sertifisering:</strong>
                            {certificationUrl ? (
                                <div className="mt-2">
                                    <p>
                                        <a href={certificationUrl} target="_blank" rel="noopener noreferrer">
                                            Vis/Last ned sertifisering
                                        </a>
                                    </p>
                                    
                                    {/* Knapper for å endre/slette */}
                                    <div className="document-actions" style={{ display: 'flex', gap: '10px' }}>
                                        {!showFileInput.certification ? (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-primary" 
                                                    onClick={() => handleShowFileInput('certification')}
                                                    disabled={isUpdating}
                                                >
                                                    Erstatt
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger" 
                                                    onClick={() => handleUpdateFile('certification', true)}
                                                    disabled={isUpdating}
                                                >
                                                    Slett
                                                </button>
                                            </>
                                        ) : (
                                            <div className="mt-2">
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => handleFileChange(e, 'certification')}
                                                    style={{ marginBottom: '10px' }}
                                                />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-success" 
                                                        onClick={() => handleUpdateFile('certification')}
                                                        disabled={isUpdating || !uploadedFiles.certification}
                                                    >
                                                        {isUpdating ? 'Laster opp...' : 'Last opp'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-secondary" 
                                                        onClick={() => setShowFileInput(prev => ({...prev, certification: false}))}
                                                        disabled={isUpdating}
                                                    >
                                                        Avbryt
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : showFileInput.certification ? (
                                <div className="mt-2">
                                    <input 
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'certification')}
                                        style={{ marginBottom: '10px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="btn btn-sm btn-success" 
                                            onClick={() => handleUpdateFile('certification')}
                                            disabled={isUpdating || !uploadedFiles.certification}
                                        >
                                            {isUpdating ? 'Laster opp...' : 'Last opp'}
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-secondary" 
                                            onClick={() => setShowFileInput(prev => ({...prev, certification: false}))}
                                            disabled={isUpdating}
                                        >
                                            Avbryt
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p><i>Ingen sertifisering lastet opp.</i></p>
                                    <button 
                                        className="btn btn-sm btn-primary" 
                                        onClick={() => handleShowFileInput('certification')}
                                        disabled={isUpdating}
                                    >
                                        Last opp sertifisering
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Lukk-knapp */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={onClose}>Lukk</button>
            </div>
        </Modal>
    );
};

export default ElevatorDetailsModal; 