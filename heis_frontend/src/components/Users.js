import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddUserModal from './AddUserModal';
import UserDetailsModal from './UserDetailsModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/users/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const usersData = response.data.results || response.data;
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            console.error('Feil ved henting av brukere:', err);
            setError('Kunne ikke hente brukerliste.');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Er du sikker på at du vil slette denne brukeren? Handlingen kan ikke angres.')) {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/users/${userId}/`, {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            } catch (err) {
                console.error('Feil ved sletting av bruker:', err.response || err.message);
                setError(`Kunne ikke slette brukeren. (${err.response?.data?.detail || err.message})`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleUserSaved = () => {
        fetchUsers();
    };

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsAddEditModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setIsAddEditModalOpen(true);
    };

    const handleShowDetails = (user) => {
        setSelectedUserForDetails(user);
        setIsDetailsModalOpen(true);
    };

    // Callback-funksjon som oppdaterer bruker i users-state når en bruker har blitt oppdatert i detaljmodal
    const handleUserUpdated = (updatedUser) => {
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.id === updatedUser.id ? updatedUser : user
            )
        );
    };

    return (
        <div className="users-container">
            <h1>Brukere</h1>
            <button className="btn btn-primary mb-3" onClick={handleOpenAddModal}>Legg til bruker</button>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster brukere...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Brukernavn</th>
                        <th>Navn</th>
                        <th>Rolle</th>
                        <th>E-post</th>
                        <th>Telefon</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(users) && users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.role}</td>
                            <td>{user.email}</td>
                            <td>{user.phone_number}</td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-info me-2" 
                                    onClick={() => handleShowDetails(user)}
                                >
                                    Detaljer
                                </button>
                                <button 
                                    className="btn btn-sm btn-warning me-2" 
                                    onClick={() => handleOpenEditModal(user)}
                                >
                                    Rediger
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    Slett
                                </button>
                            </td>
                        </tr>
                    ))}
                    {Array.isArray(users) && users.length === 0 && !isLoading && (
                        <tr><td colSpan="6">Ingen brukere funnet.</td></tr>
                    )}
                </tbody>
            </table>
            
            <AddUserModal 
                isOpen={isAddEditModalOpen} 
                onClose={() => {
                    setIsAddEditModalOpen(false);
                    setEditingUser(null);
                }} 
                onUserSaved={handleUserSaved} 
                userToEdit={editingUser} 
            />

            {selectedUserForDetails && (
                <UserDetailsModal 
                    isOpen={isDetailsModalOpen} 
                    onClose={() => setIsDetailsModalOpen(false)} 
                    user={selectedUserForDetails}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
};

export default Users;