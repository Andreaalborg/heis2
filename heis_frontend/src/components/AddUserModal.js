import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const AddUserModal = ({ isOpen, onClose, onUserSaved, userToEdit }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [role, setRole] = useState('tekniker');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [driverLicenseFile, setDriverLicenseFile] = useState(null);
    const [otherCertificateFile, setOtherCertificateFile] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setUsername(userToEdit.username || '');
                setRole(userToEdit.role || 'tekniker');
                setFirstName(userToEdit.first_name || '');
                setLastName(userToEdit.last_name || '');
                setEmail(userToEdit.email || '');
                setPhoneNumber(userToEdit.phone_number || '');
                setDateOfBirth(userToEdit.date_of_birth || '');
                setPassword('');
                setCurrentStep(1);
            } else {
                resetFormFields();
                setCurrentStep(1);
            }
        } else {
            resetFormFields();
            setError('');
            setCurrentStep(1);
        }
    }, [isOpen, userToEdit]);

    const resetFormFields = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRole('tekniker');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhoneNumber('');
        setDateOfBirth('');
        setProfilePictureFile(null);
        setDriverLicenseFile(null);
        setOtherCertificateFile(null);
    };

    const handleNextStep = () => {
        if (!firstName || !lastName || !email) {
            setError('Fornavn, etternavn og e-post må fylles ut i steg 1.');
            return;
        }
        setError('');
        setCurrentStep(2);
    };

    const handlePreviousStep = () => {
        setError('');
        setCurrentStep(1);
    };

    const handleFileChange = (event, setFileState) => {
        if (event.target.files && event.target.files[0]) {
            setFileState(event.target.files[0]);
        } else {
            setFileState(null);
        }
    };

    const validatePassword = (pass) => {
        if (pass.length < 8) {
            return 'Passordet må være minst 8 tegn langt';
        }
        if (!/[A-Z]/.test(pass)) {
            return 'Passordet må inneholde minst én stor bokstav';
        }
        if (!/[a-z]/.test(pass)) {
            return 'Passordet må inneholde minst én liten bokstav';
        }
        if (!/[0-9]/.test(pass)) {
            return 'Passordet må inneholde minst ett tall';
        }
        if (!/[!@#$%^&*]/.test(pass)) {
            return 'Passordet må inneholde minst ett spesialtegn (!@#$%^&*)';
        }
        return '';
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (!userToEdit) {
            setPasswordError(validatePassword(newPassword));
        }
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        if (e.target.value !== password) {
            setPasswordError('Passordene matcher ikke');
        } else {
            setPasswordError('');
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!username) {
            setError('Brukernavn er påkrevd.');
            setIsLoading(false);
            return;
        }

        if (!userToEdit) {
            if (!password) {
                setError('Passord er påkrevd for ny bruker.');
                setIsLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError('Passordene matcher ikke.');
                setIsLoading(false);
                return;
            }
            const passwordValidationError = validatePassword(password);
            if (passwordValidationError) {
                setError(passwordValidationError);
                setIsLoading(false);
                return;
            }
        }

        if (!role) {
            setError('Rolle er påkrevd.');
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('role', role);
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('email', email);
        if (phoneNumber) formData.append('phone_number', phoneNumber);
        if (dateOfBirth) formData.append('date_of_birth', dateOfBirth);
        
        if (password) {
            formData.append('password', password);
        }

        if (profilePictureFile) {
            formData.append('profile_picture', profilePictureFile);
        }
        if (driverLicenseFile) {
            formData.append('driver_license', driverLicenseFile);
        }
        if (otherCertificateFile) {
            formData.append('other_certificate', otherCertificateFile);
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            let response;

            if (userToEdit) {
                response = await axios.patch(`http://localhost:8000/api/users/${userToEdit.id}/`, formData, config);
            } else {
                response = await axios.post('http://localhost:8000/api/users/', formData, config);
            }

            if (response.status === 200 || response.status === 201) {
                onUserSaved();
                onClose();
            } else {
                setError('Noe gikk galt under lagring.');
            }
        } catch (err) {
            let errorMsg = `Kunne ikke ${userToEdit ? 'oppdatere' : 'opprette'} bruker.`;
            if (err.response && err.response.data) {
                const backendErrors = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
                errorMsg += ` Feil: ${backendErrors}`;
            } else if (err.message) {
                errorMsg += ` ${err.message}`;
            }
            setError(errorMsg);
            console.error(`Feil ved ${userToEdit ? 'oppdatering' : 'opprettelse'} av bruker:`, err.response || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${userToEdit ? 'Rediger' : 'Legg til'} bruker - Steg ${currentStep} av 2`}>
            {error && <div className="form-error" style={{marginBottom: '15px'}}>{error}</div>}

            {currentStep === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <div className="form-group">
                        <label htmlFor="firstName">Fornavn *</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Etternavn *</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">E-post *</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Telefonnummer</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dateOfBirth">Fødselsdato</label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="profilePicture">Profilbilde</label>
                        <input 
                            type="file" 
                            id="profilePicture" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setProfilePictureFile)} 
                        />
                        {profilePictureFile && <small style={{ display: 'block', marginTop: '5px' }}>Valgt: {profilePictureFile.name}</small>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="driverLicense">Førerkort</label>
                        <input 
                            type="file" 
                            id="driverLicense" 
                            accept=".pdf,image/*"
                            onChange={(e) => handleFileChange(e, setDriverLicenseFile)} 
                        />
                        {driverLicenseFile && <small style={{ display: 'block', marginTop: '5px' }}>Valgt: {driverLicenseFile.name}</small>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="otherCertificate">Andre Sertifikat/Bevis</label>
                        <input 
                            type="file" 
                            id="otherCertificate" 
                            accept=".pdf,image/*" 
                            onChange={(e) => handleFileChange(e, setOtherCertificateFile)} 
                        />
                        {otherCertificateFile && <small style={{ display: 'block', marginTop: '5px' }}>Valgt: {otherCertificateFile.name}</small>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary">
                            Neste
                        </button>
                    </div>
                </form>
            )}

            {currentStep === 2 && (
                <form onSubmit={handleSaveUser}>
                    <div className="form-group">
                        <label htmlFor="username">Brukernavn *</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={!!userToEdit}
                        />
                        {userToEdit && <small>Brukernavn kan ikke endres.</small>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Passord {userToEdit ? '(Valgfritt)':'*'}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder={userToEdit ? 'La stå for å beholde passord' : 'Sett passord'}
                            required={!userToEdit}
                        />
                        {!userToEdit && passwordError && <small className="text-danger">{passwordError}</small>}
                    </div>
                    {!userToEdit && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Bekreft passord *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                placeholder="Bekreft passord"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="role">Rolle *</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="admin">Administrator</option>
                            <option value="tekniker">Tekniker</option>
                            <option value="selger">Selger</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button type="button" className="btn btn-secondary" onClick={handlePreviousStep}>
                            Forrige
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Lagrer...' : (userToEdit ? 'Oppdater bruker' : 'Opprett bruker')}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default AddUserModal; 