import React, { useState } from 'react';
import Modal from './Modal';
import axios from 'axios';

const UserDetailsModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({
        profile_picture: null,
        driver_license: null,
        other_certificate: null
    });
    const [showFileInput, setShowFileInput] = useState({
        profile_picture: false,
        driver_license: false,
        other_certificate: false
    });
    const [updateError, setUpdateError] = useState('');

    if (!user) {
        return null; // Ikke render hvis ingen bruker er valgt
    }

    // Formater dato hvis den finnes
    const formattedDateOfBirth = user.date_of_birth 
        ? new Date(user.date_of_birth).toLocaleDateString('nb-NO') 
        : 'Ikke oppgitt';

    // Konstruer base URL (juster ved behov hvis API er et annet sted enn localhost:8000)
    // I en ekte applikasjon hentes dette gjerne fra en environment variable.
    const API_BASE_URL = 'http://localhost:8000'; 

    // --- Bygg URL-er mer robust --- 
    let profilePictureUrl = null;
    let driverLicenseUrl = null;
    let otherCertificateUrl = null;
    try {
        if (user.profile_picture) {
            profilePictureUrl = new URL(user.profile_picture, API_BASE_URL).href;
        }
        if (user.driver_license) {
            driverLicenseUrl = new URL(user.driver_license, API_BASE_URL).href;
        }
        if (user.other_certificate) {
            otherCertificateUrl = new URL(user.other_certificate, API_BASE_URL).href;
        }
    } catch (e) {
        console.error("Feil ved bygging av media-URL:", e);
        // URLene forblir null hvis bygging feiler
    }

    // Håndter visning av filopplastingsfelt
    const handleShowFileInput = (fieldName) => {
        setShowFileInput(prev => ({
            ...prev,
            [fieldName]: true
        }));
    };

    // Håndter filopplasting
    const handleFileChange = (e, fieldName) => {
        setUploadedFiles(prev => ({
            ...prev,
            [fieldName]: e.target.files[0]
        }));
    };

    // Send forespørsel for å oppdatere eller slette fil
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
                // For å slette, send null eller en spesiell verdi som backend tolker som "slett"
                formData.append(fieldName, ''); // Tomstreng kan tolkes som "fjern filen"
            } else if (uploadedFiles[fieldName]) {
                formData.append(fieldName, uploadedFiles[fieldName]);
            } else {
                setUpdateError(`Ingen fil valgt for opplasting.`);
                setIsUpdating(false);
                return;
            }

            const response = await axios.patch(
                `http://localhost:8000/api/users/${user.id}/`, 
                formData,
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Nullstill statuser
            setShowFileInput(prev => ({
                ...prev,
                [fieldName]: false
            }));
            setUploadedFiles(prev => ({
                ...prev,
                [fieldName]: null
            }));

            // Varsle forelder-komponenten om at brukeren er oppdatert
            if (onUserUpdated) {
                onUserUpdated(response.data);
            } else {
                // Hvis ingen callback er gitt, lukk modalen og la bruker refreshe
                alert('Dokument oppdatert. Lukk modalen og oppdater siden for å se endringene.');
            }

        } catch (err) {
            console.error('Feil ved oppdatering av dokument:', err);
            setUpdateError(`Kunne ikke oppdatere dokumentet: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detaljer for ${user.username}`}>
            {updateError && <div className="form-error">{updateError}</div>}
            
            <div className="user-details-content">
                <p><strong>Brukernavn:</strong> {user.username}</p>
                <p><strong>Navn:</strong> {user.first_name} {user.last_name}</p>
                <p><strong>E-post:</strong> {user.email || 'Ikke oppgitt'}</p>
                <p><strong>Telefon:</strong> {user.phone_number || 'Ikke oppgitt'}</p>
                <p><strong>Rolle:</strong> {user.role}</p>
                <p><strong>Fødselsdato:</strong> {formattedDateOfBirth}</p>
                <p><strong>Aktiv:</strong> {user.is_active ? 'Ja' : 'Nei'}</p>
                
                <hr />
                <h4>Dokumenter</h4>
                
                {/* Profilbilde med admin-knapper */}
                <div className="detail-item">
                    <strong>Profilbilde:</strong>
                    {profilePictureUrl ? (
                        <div style={{ marginTop: '10px' }}>
                            <a href={profilePictureUrl} target="_blank" rel="noopener noreferrer" title="Åpne bilde i ny fane">
                                <img 
                                    src={profilePictureUrl} 
                                    alt="Profilbilde" 
                                    style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px', display: 'block', marginBottom: '10px' }} 
                                />
                            </a>
                            
                            {/* Knapper for å endre/slette */}
                            <div className="document-actions" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                {!showFileInput.profile_picture ? (
                                    <>
                                        <button 
                                            className="btn btn-sm btn-primary" 
                                            onClick={() => handleShowFileInput('profile_picture')}
                                            disabled={isUpdating}
                                        >
                                            Erstatt
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger" 
                                            onClick={() => handleUpdateFile('profile_picture', true)}
                                            disabled={isUpdating}
                                        >
                                            Slett
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ marginTop: '10px' }}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleFileChange(e, 'profile_picture')} 
                                            style={{ marginBottom: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                className="btn btn-sm btn-success" 
                                                onClick={() => handleUpdateFile('profile_picture')}
                                                disabled={isUpdating || !uploadedFiles.profile_picture}
                                            >
                                                {isUpdating ? 'Laster opp...' : 'Last opp'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => setShowFileInput(prev => ({...prev, profile_picture: false}))}
                                                disabled={isUpdating}
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : showFileInput.profile_picture ? (
                        <div style={{ marginTop: '10px' }}>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleFileChange(e, 'profile_picture')}
                                style={{ marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn btn-sm btn-success" 
                                    onClick={() => handleUpdateFile('profile_picture')}
                                    disabled={isUpdating || !uploadedFiles.profile_picture}
                                >
                                    {isUpdating ? 'Laster opp...' : 'Last opp'}
                                </button>
                                <button 
                                    className="btn btn-sm btn-secondary" 
                                    onClick={() => setShowFileInput(prev => ({...prev, profile_picture: false}))}
                                    disabled={isUpdating}
                                >
                                    Avbryt
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p><i>Ingen profilbilde lastet opp.</i></p>
                            <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => handleShowFileInput('profile_picture')}
                                disabled={isUpdating}
                            >
                                Last opp bilde
                            </button>
                        </div>
                    )}
                </div>

                {/* Førerkort med admin-knapper */}
                <div className="detail-item" style={{ marginTop: '20px' }}>
                    <strong>Førerkort:</strong>
                    {driverLicenseUrl ? (
                        <div style={{ marginTop: '10px' }}>
                            <p>
                                <a href={driverLicenseUrl} target="_blank" rel="noopener noreferrer">
                                    Vis/Last ned Førerkort
                                </a>
                            </p>
                            
                            {/* Knapper for å endre/slette */}
                            <div className="document-actions" style={{ display: 'flex', gap: '10px' }}>
                                {!showFileInput.driver_license ? (
                                    <>
                                        <button 
                                            className="btn btn-sm btn-primary" 
                                            onClick={() => handleShowFileInput('driver_license')}
                                            disabled={isUpdating}
                                        >
                                            Erstatt
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger" 
                                            onClick={() => handleUpdateFile('driver_license', true)}
                                            disabled={isUpdating}
                                        >
                                            Slett
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ marginTop: '10px' }}>
                                        <input 
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png" 
                                            onChange={(e) => handleFileChange(e, 'driver_license')}
                                            style={{ marginBottom: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                className="btn btn-sm btn-success" 
                                                onClick={() => handleUpdateFile('driver_license')}
                                                disabled={isUpdating || !uploadedFiles.driver_license}
                                            >
                                                {isUpdating ? 'Laster opp...' : 'Last opp'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => setShowFileInput(prev => ({...prev, driver_license: false}))}
                                                disabled={isUpdating}
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : showFileInput.driver_license ? (
                        <div style={{ marginTop: '10px' }}>
                            <input 
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, 'driver_license')}
                                style={{ marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn btn-sm btn-success" 
                                    onClick={() => handleUpdateFile('driver_license')}
                                    disabled={isUpdating || !uploadedFiles.driver_license}
                                >
                                    {isUpdating ? 'Laster opp...' : 'Last opp'}
                                </button>
                                <button 
                                    className="btn btn-sm btn-secondary" 
                                    onClick={() => setShowFileInput(prev => ({...prev, driver_license: false}))}
                                    disabled={isUpdating}
                                >
                                    Avbryt
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p><i>Ingen førerkort lastet opp.</i></p>
                            <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => handleShowFileInput('driver_license')}
                                disabled={isUpdating}
                            >
                                Last opp førerkort
                            </button>
                        </div>
                    )}
                </div>

                {/* Andre Sertifikater med admin-knapper */}
                <div className="detail-item" style={{ marginTop: '20px' }}>
                    <strong>Andre Sertifikater:</strong>
                    {otherCertificateUrl ? (
                        <div style={{ marginTop: '10px' }}>
                            <p>
                                <a href={otherCertificateUrl} target="_blank" rel="noopener noreferrer">
                                    Vis/Last ned Sertifikat
                                </a>
                            </p>
                            
                            {/* Knapper for å endre/slette */}
                            <div className="document-actions" style={{ display: 'flex', gap: '10px' }}>
                                {!showFileInput.other_certificate ? (
                                    <>
                                        <button 
                                            className="btn btn-sm btn-primary" 
                                            onClick={() => handleShowFileInput('other_certificate')}
                                            disabled={isUpdating}
                                        >
                                            Erstatt
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger" 
                                            onClick={() => handleUpdateFile('other_certificate', true)}
                                            disabled={isUpdating}
                                        >
                                            Slett
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ marginTop: '10px' }}>
                                        <input 
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png" 
                                            onChange={(e) => handleFileChange(e, 'other_certificate')}
                                            style={{ marginBottom: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                className="btn btn-sm btn-success" 
                                                onClick={() => handleUpdateFile('other_certificate')}
                                                disabled={isUpdating || !uploadedFiles.other_certificate}
                                            >
                                                {isUpdating ? 'Laster opp...' : 'Last opp'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-secondary" 
                                                onClick={() => setShowFileInput(prev => ({...prev, other_certificate: false}))}
                                                disabled={isUpdating}
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : showFileInput.other_certificate ? (
                        <div style={{ marginTop: '10px' }}>
                            <input 
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, 'other_certificate')}
                                style={{ marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn btn-sm btn-success" 
                                    onClick={() => handleUpdateFile('other_certificate')}
                                    disabled={isUpdating || !uploadedFiles.other_certificate}
                                >
                                    {isUpdating ? 'Laster opp...' : 'Last opp'}
                                </button>
                                <button 
                                    className="btn btn-sm btn-secondary" 
                                    onClick={() => setShowFileInput(prev => ({...prev, other_certificate: false}))}
                                    disabled={isUpdating}
                                >
                                    Avbryt
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p><i>Ingen andre sertifikater lastet opp.</i></p>
                            <button 
                                className="btn btn-sm btn-primary" 
                                onClick={() => handleShowFileInput('other_certificate')}
                                disabled={isUpdating}
                            >
                                Last opp sertifikat
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Lukk-knapp */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                 <button className="btn btn-secondary" onClick={onClose}>Lukk</button>
            </div>
        </Modal>
    );
};

export default UserDetailsModal; 