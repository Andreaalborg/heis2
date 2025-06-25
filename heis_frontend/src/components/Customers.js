import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import AddCustomerModal from './AddCustomerModal';
import AddEditOpportunityModal from './AddEditOpportunityModal';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LoadingSpinner, ErrorMessage, NoDataMessage } from './LoadingError';

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

    // Excel eksport funksjon
    const exportToExcel = () => {
        const exportData = filteredCustomers.map(customer => ({
            'Navn': customer.name,
            'Adresse': customer.address || '-',
            'By': customer.city || '-',
            'Postnummer': customer.postal_code || '-',
            'E-post': customer.email || '-',
            'Telefon': customer.phone || '-',
            'Orgnr': customer.org_number || '-',
            'Kontaktperson': customer.contact_person || '-',
            'Opprettet': new Date(customer.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kunder');

        // Generer Excel fil
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `Kunder_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="customers-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Kunder</h1>
                <div>
                    <button className="btn btn-outline-success me-2" onClick={exportToExcel}>
                        <i className="fas fa-download me-2"></i>Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus me-2"></i>Legg til kunde
                    </button>
                </div>
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
            
            {error && <ErrorMessage error={error} title="Feil ved lasting av kunder" onRetry={fetchCustomers} />}
            {isLoading && <LoadingSpinner message="Laster kunder..." />}
            
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
                                <td data-label="Navn">
                                    <strong>{customer.name}</strong>
                                </td>
                                <td data-label="Kontaktperson">{customer.contact_person_name}</td>
                                <td data-label="E-post">
                                    {customer.email && (
                                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                                    )}
                                </td>
                                <td data-label="Telefon">
                                    {customer.phone && (
                                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                                    )}
                                </td>
                                <td data-label="Adresse">{customer.address}</td>
                                <td data-label="By">{customer.zip_code} {customer.city}</td>
                                <td data-label="Handlinger">
                                    <div className="btn-group btn-group-sm btn-block-mobile" role="group">
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
                            !isLoading && (
                                <tr>
                                    <td colSpan="7">
                                        <NoDataMessage 
                                            message={searchTerm ? 'Ingen kunder funnet' : 'Ingen kunder registrert'}
                                            description={searchTerm ? `Ingen kunder matcher søket "${searchTerm}"` : 'Klikk på "Legg til kunde" for å registrere din første kunde.'}
                                            actionText={!searchTerm ? "Legg til kunde" : null}
                                            onAction={!searchTerm ? () => setIsModalOpen(true) : null}
                                        />
                                    </td>
                                </tr>
                            )
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