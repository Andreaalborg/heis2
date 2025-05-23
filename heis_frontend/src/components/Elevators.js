import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ElevatorDetailsModal from './ElevatorDetailsModal';
import AddElevatorModal from './AddElevatorModal';

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
                
                // Hent heiser
                const elevatorsResponse = await axios.get('http://localhost:8000/api/elevators/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                // Hent kunder for referanse
                const customersResponse = await axios.get('http://localhost:8000/api/customers/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                // Hent heistyper for referanse
                const typesResponse = await axios.get('http://localhost:8000/api/elevator-types/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                
                // Sett data i state
                setElevators(elevatorsResponse.data.results || elevatorsResponse.data);
                setCustomers(customersResponse.data.results || customersResponse.data);
                setElevatorTypes(typesResponse.data.results || typesResponse.data);
                
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
                <button 
                    className="btn btn-primary"
                    onClick={handleAddElevator}
                >
                    Legg til heis
                </button>
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