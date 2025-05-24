import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Fjernes
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import Modal from './Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPersonId, setContactPersonId] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // Token håndteres av apiClient
            // const token = localStorage.getItem('token');
            // const response = await axios.get('http://localhost:8000/api/users/', {
            //     headers: {
            //         'Authorization': `Token ${token}`
            //     }
            // });
            const response = await apiClient.get('/api/users/'); // <--- ENDRET
            setUsers(response.data.results || response.data);
        } catch (err) {
            console.error('Feil ved henting av brukere:', err);
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setError('');

        if (!contactPersonId) {
            setError('Du må velge en kontaktperson for kunden.');
            return;
        }

        try {
            // Token håndteres av apiClient
            // const token = localStorage.getItem('token');
            // const response = await axios.post('http://localhost:8000/api/customers/', {
            const response = await apiClient.post('/api/customers/', { // <--- ENDRET
                name,
                contact_person_user: contactPersonId, // Send bruker ID som contact_person_user
                email,
                phone,
                address,
                zip_code: zipCode,
                city
            }); // Fjerner manuell config, apiClient håndterer token
            // }, {
            //     headers: {
            //         'Authorization': `Token ${token}`
            //     }
            // });

            if (response.status === 201) {
                onCustomerAdded(response.data);
                resetForm();
                onClose();
            }
        } catch (err) {
            setError('Kunne ikke legge til kunde. Sjekk at alle felt er fylt ut korrekt.');
            console.error('Feil ved opprettelse av kunde:', err);
        }
    };

    const resetForm = () => {
        setName('');
        setContactPerson('');
        setContactPersonId('');
        setEmail('');
        setPhone('');
        setAddress('');
        setZipCode('');
        setCity('');
        setError('');
    };

    const handleContactPersonChange = (e) => {
        const selectedUserId = e.target.value;
        setContactPersonId(selectedUserId);
        
        // Finn brukernavnet basert på ID
        const selectedUser = users.find(user => user.id === parseInt(selectedUserId, 10));
        if (selectedUser) {
            setContactPerson(`${selectedUser.first_name} ${selectedUser.last_name}`);
        } else {
            setContactPerson('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Legg til ny kunde">
            <form onSubmit={handleAddCustomer} className="form">
                {error && <div className="form-error">{error}</div>}
                <div className="form-group">
                    <label htmlFor="name">Navn</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="contactPerson">Kontaktperson</label>
                    {loadingUsers ? (
                        <p>Laster brukere...</p>
                    ) : (
                        <select
                            id="contactPerson"
                            value={contactPersonId}
                            onChange={handleContactPersonChange}
                            required
                        >
                            <option value="">Velg en kontaktperson</option>
                            {Array.isArray(users) && users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} ({user.username})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="email">E-post</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Telefon</label>
                    <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address">Adresse</label>
                    <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="zipCode">Postnummer</label>
                    <input
                        type="text"
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="city">By</label>
                    <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Legg til kunde</button>
            </form>
        </Modal>
    );
};

export default AddCustomerModal; 