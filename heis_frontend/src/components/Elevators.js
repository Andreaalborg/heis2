import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom';
import ElevatorDetailsModal from './ElevatorDetailsModal';
import AddElevatorModal from './AddElevatorModal';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Elevators = () => {
    const [elevators, setElevators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedElevator, setSelectedElevator] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [elevatorTypes, setElevatorTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Hent heiser og referansedata
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Token ${token}` } };
                
                // Hent heiser
                // const elevatorsResponse = await axios.get('http://localhost:8000/api/elevators/', config);
                const elevatorsResponse = await axios.get(`${API_BASE_URL}/api/elevators/`, config);
                
                // Hent kunder for referanse
                // const customersResponse = await axios.get('http://localhost:8000/api/customers/', config);
                const customersResponse = await axios.get(`${API_BASE_URL}/api/customers/`, config);
                const customersData = customersResponse.data.reduce((acc, customer) => {
                    acc.push(customer);
                    return acc;
                }, []);
                
                // Hent heistyper for referanse
                // const typesResponse = await axios.get('http://localhost:8000/api/elevator-types/', config);
                const typesResponse = await axios.get(`${API_BASE_URL}/api/elevator-types/`, config);
                const typesData = typesResponse.data.reduce((acc, type) => {
                    acc.push(type);
                    return acc;
                }, []);
                
                // Sett data i state
                setElevators(elevatorsResponse.data.results || elevatorsResponse.data);
                setCustomers(customersData);
                setElevatorTypes(typesData);
                
                setLoading(false);
            } catch (err) {
                console.error('Feil ved henting av data:', err);
                setError('Kunne ikke hente heiser. Vennligst prøv igjen senere.');
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Håndter søk
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filtrer heiser basert på søkeord
    const filteredElevators = elevators.filter(elevator => {
        const searchTerms = searchQuery.toLowerCase();
        return (
            elevator.serial_number.toLowerCase().includes(searchTerms) ||
            elevator.customer_name.toLowerCase().includes(searchTerms) ||
            (elevator.location_description && 
             elevator.location_description.toLowerCase().includes(searchTerms))
        );
    });

    // Excel eksport funksjon
    const exportToExcel = () => {
        const exportData = filteredElevators.map(elevator => ({
            'Serienummer': elevator.serial_number,
            'Kunde': elevator.customer_name,
            'Type': elevator.elevator_type_name || '-',
            'Produsent': elevator.manufacturer || '-',
            'Installasjonsdato': elevator.installation_date ? new Date(elevator.installation_date).toLocaleDateString() : '-',
            'Lokasjon': elevator.location_description || '-',
            'QR-kode': elevator.qr_code || '-',
            'Status': elevator.status || 'Aktiv'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Heiser');

        // Generer Excel fil
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `Heiser_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Vis detaljer for en heis
    const handleShowDetails = (elevator) => {
        setSelectedElevator(elevator);
        setIsDetailsModalOpen(true);
    };

    // Håndter oppdatering av en heis
    const handleElevatorUpdated = (updatedElevator) => {
        setElevators(prevElevators => 
            prevElevators.map(elevator => 
                elevator.id === updatedElevator.id ? updatedElevator : elevator
            )
        );
    };

    // Håndter legge til ny heis
    const handleAddElevator = () => {
        setIsAddModalOpen(true);
    };

    // Håndter at en ny heis er lagt til
    const handleElevatorAdded = (newElevator) => {
        setElevators(prevElevators => [...prevElevators, newElevator]);
        setIsAddModalOpen(false);
    };

    if (loading) return <div className="text-center mt-5"><p>Laster heiser...</p></div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Heiser</h2>
                <div>
                    <button 
                        className="btn btn-outline-success me-2"
                        onClick={exportToExcel}
                    >
                        <i className="fas fa-download me-2"></i>Excel
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddElevator}
                    >
                        Legg til heis
                    </button>
                </div>
            </div>

            {/* Søkefelt */}
            <div className="mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Søk etter serienummer, kunde eller plassering..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {/* Feilmelding */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Heistabell */}
            {filteredElevators.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Serienummer</th>
                                <th>Kunde</th>
                                <th>Type</th>
                                <th>Installasjonsdato</th>
                                <th>Neste inspeksjon</th>
                                <th>Handlinger</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredElevators.map(elevator => (
                                <tr key={elevator.id}>
                                    <td>{elevator.serial_number}</td>
                                    <td>{elevator.customer_name}</td>
                                    <td>{elevator.elevator_type_name}</td>
                                    <td>
                                        {elevator.installation_date ? 
                                            new Date(elevator.installation_date).toLocaleDateString('nb-NO') : 
                                            'Ikke satt'}
                                    </td>
                                    <td>
                                        {elevator.next_inspection_date ? 
                                            new Date(elevator.next_inspection_date).toLocaleDateString('nb-NO') : 
                                            'Ikke planlagt'}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-info me-2"
                                            onClick={() => handleShowDetails(elevator)}
                                        >
                                            Detaljer
                                        </button>
                                        <Link 
                                            to={`/assignments?elevator=${elevator.id}`} 
                                            className="btn btn-sm btn-secondary"
                                        >
                                            Oppdrag
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="alert alert-info">
                    {searchQuery ? 'Ingen heiser matcher søket.' : 'Ingen heiser funnet.'}
                </div>
            )}

            {/* Detalj-modal */}
            {selectedElevator && (
                <ElevatorDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    elevator={selectedElevator}
                    customers={customers}
                    elevatorTypes={elevatorTypes}
                    onElevatorUpdated={handleElevatorUpdated}
                />
            )}

            {/* Legg til-modal */}
            <AddElevatorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onElevatorAdded={handleElevatorAdded}
                customers={customers}
                elevatorTypes={elevatorTypes}
            />
        </div>
    );
};

export default Elevators; 