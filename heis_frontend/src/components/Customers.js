import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import AddCustomerModal from './AddCustomerModal';
import AddEditOpportunityModal from './AddEditOpportunityModal';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        // Filtrer og sorter kunder
        let filtered = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sorter
        filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '');
            if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at);
            return 0;
        });

        setFilteredCustomers(filtered);
    }, [customers, searchTerm, sortBy]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/customers/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            console.log('API response for customers:', response.data);
            const customerData = response.data.results || response.data;
            setCustomers(Array.isArray(customerData) ? customerData : []);
        } catch (err) {
            console.error('Feil ved henting av kunder:', err);
            setError('Kunne ikke hente kunder fra serveren.');
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomerAdded = (newCustomer) => {
        fetchCustomers();
    };

    const handleCreateOpportunity = (customerId) => {
        setSelectedCustomerId(customerId);
        setIsOpportunityModalOpen(true);
    };

    const handleViewElevators = (customerId) => {
        navigate(`/elevators?customer=${customerId}`);
    };

    return (
        <div className="customers-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Kunder</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <i className="fas fa-plus me-2"></i>Legg til kunde
                </button>
            </div>
            
            {/* Søk og filtrering */}
            <div className="row mb-3">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Søk etter kunde, by eller e-post..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-3">
                    <select 
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name">Sorter etter navn</option>
                        <option value="city">Sorter etter by</option>
                        <option value="recent">Nyeste først</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <div className="text-muted">
                        Viser {filteredCustomers.length} av {customers.length} kunder
                    </div>
                </div>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster kunder...</p>}
            
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Navn</th>
                            <th>Kontaktperson</th>
                            <th>E-post</th>
                            <th>Telefon</th>
                            <th>Adresse</th>
                            <th>By</th>
                            <th>Handlinger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                            <tr key={customer.id}>
                                <td>
                                    <strong>{customer.name}</strong>
                                </td>
                                <td>{customer.contact_person_name}</td>
                                <td>
                                    {customer.email && (
                                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                                    )}
                                </td>
                                <td>
                                    {customer.phone && (
                                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                                    )}
                                </td>
                                <td>{customer.address}</td>
                                <td>{customer.zip_code} {customer.city}</td>
                                <td>
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => handleCreateOpportunity(customer.id)}
                                            title="Ny salgsmulighet"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                        <button
                                            className="btn btn-outline-info"
                                            onClick={() => handleViewElevators(customer.id)}
                                            title="Se heiser"
                                        >
                                            <i className="fas fa-elevator"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    {searchTerm ? 'Ingen kunder funnet med søkekriteriene' : 'Ingen kunder funnet'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddCustomerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onCustomerAdded={handleCustomerAdded} 
            />

            <AddEditOpportunityModal
                isOpen={isOpportunityModalOpen}
                onClose={() => {
                    setIsOpportunityModalOpen(false);
                    setSelectedCustomerId(null);
                }}
                onSave={() => {
                    setIsOpportunityModalOpen(false);
                    setSelectedCustomerId(null);
                }}
                opportunityToEdit={null}
                preselectedCustomerId={selectedCustomerId}
            />
        </div>
    );
};

export default Customers;