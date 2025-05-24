import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import AddCustomerModal from './AddCustomerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

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

    return (
        <div className="customers-container">
            <h1>Kunder</h1>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Legg til kunde</button>
            
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster kunder...</p>}
            
            <table className="table">
                <thead>
                    <tr>
                        <th>Navn</th>
                        <th>Kontaktperson</th>
                        <th>E-post</th>
                        <th>Telefon</th>
                        <th>Adresse</th>
                        <th>Postnummer</th>
                        <th>By</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(customers) ? customers.map(customer => (
                        <tr key={customer.id}>
                            <td>{customer.name}</td>
                            <td>{customer.contact_person_name}</td>
                            <td>{customer.email}</td>
                            <td>{customer.phone}</td>
                            <td>{customer.address}</td>
                            <td>{customer.zip_code}</td>
                            <td>{customer.city}</td>
                        </tr>
                    )) : <tr><td colSpan="7">Ingen kunder å vise</td></tr>}
                    
                    {Array.isArray(customers) && customers.length === 0 && !isLoading && 
                        <tr><td colSpan="7">Ingen kunder funnet</td></tr>}
                </tbody>
            </table>
            <AddCustomerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onCustomerAdded={handleCustomerAdded} 
            />
        </div>
    );
};

export default Customers;