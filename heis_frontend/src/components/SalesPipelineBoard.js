import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import '../styles/SalesPipelineBoard.css'; // Vi trenger litt CSS for dette
import AddEditOpportunityModal from './AddEditOpportunityModal'; // Gjenbruker modalen

// Definerer kolonnene og deres rekkefølge
const pipelineColumns = [
    { id: 'new', title: 'Ny' },
    { id: 'contacted', title: 'Kontaktet' },
    { id: 'proposal', title: 'Tilbud Sendt' },
    { id: 'negotiation', title: 'Forhandling' },
    { id: 'won', title: 'Vunnet' },
    { id: 'lost', title: 'Tapt' },
];

// Helper for å få tak i auth token
const getToken = () => localStorage.getItem('token');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesPipelineBoard = () => {
    const [opportunitiesByStatus, setOpportunitiesByStatus] = useState({});
    const [allOpportunities, setAllOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false); // Egen state for oppdatering
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [customers, setCustomers] = useState([]);
    
    // Nytt for filtrering og sortering
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [statsVisible, setStatsVisible] = useState(false);
    const [stats, setStats] = useState({
        totalValue: 0,
        count: 0,
        avgDaysInPipeline: 0,
        countByStatus: {}
    });

    useEffect(() => {
        fetchOpportunities();
        fetchCustomers();
    }, []);

    useEffect(() => {
        // Re-beregn statistikk når muligheter endres
        calculateStats();
    }, [allOpportunities]);

    useEffect(() => {
        // Filtrer og sorter når filterkriterier endres
        if (allOpportunities.length > 0) {
            const filtered = filterOpportunities(allOpportunities);
            const sorted = sortOpportunities(filtered);
            groupOpportunities(sorted);
        }
    }, [filterCustomer, filterTerm, sortOption, allOpportunities]);

    const fetchCustomers = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/customers/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const customerData = response.data.results || response.data;
            setCustomers(Array.isArray(customerData) ? customerData : []);
        } catch (err) {
            console.error("Feil ved henting av kunder:", err);
        }
    };

    const fetchOpportunities = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/sales-opportunities/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const opportunities = response.data.results || response.data;
            const opportunitiesArray = Array.isArray(opportunities) ? opportunities : [];
            setAllOpportunities(opportunitiesArray);
            
            // Filtrer og grupper
            const filtered = filterOpportunities(opportunitiesArray);
            const sorted = sortOpportunities(filtered);
            groupOpportunities(sorted);
        } catch (err) {
            console.error('Feil ved henting av salgsmuligheter:', err.response || err.message);
            setError('Kunne ikke hente salgsmuligheter for pipeline.');
            setOpportunitiesByStatus({});
        } finally {
            setIsLoading(false);
        }
    };

    const filterOpportunities = (opportunities) => {
        return opportunities.filter(opp => {
            const matchesCustomer = !filterCustomer || opp.customer === parseInt(filterCustomer);
            const matchesTerm = !filterTerm || 
                opp.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
                (opp.description && opp.description.toLowerCase().includes(filterTerm.toLowerCase()));
            return matchesCustomer && matchesTerm;
        });
    };

    const sortOpportunities = (opportunities) => {
        return [...opportunities].sort((a, b) => {
            switch (sortOption) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'value-high':
                    return (b.estimated_value || 0) - (a.estimated_value || 0);
                case 'value-low':
                    return (a.estimated_value || 0) - (b.estimated_value || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    };

    const calculateStats = () => {
        if (allOpportunities.length === 0) {
            setStats({
                totalValue: 0,
                count: 0,
                avgDaysInPipeline: 0,
                countByStatus: {}
            });
            return;
        }

        // Beregn totalt verdi
        const totalValue = allOpportunities.reduce((sum, opp) => 
            sum + (parseFloat(opp.estimated_value) || 0), 0);
            
        // Beregn gjennomsnittlig dager i pipeline
        const now = new Date();
        const totalDays = allOpportunities.reduce((sum, opp) => {
            const createdDate = new Date(opp.created_at);
            const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            return sum + diffDays;
        }, 0);
        
        // Teller per status
        const countByStatus = {};
        pipelineColumns.forEach(col => {
            countByStatus[col.id] = allOpportunities.filter(opp => opp.status === col.id).length;
        });
        
        setStats({
            totalValue,
            count: allOpportunities.length,
            avgDaysInPipeline: Math.floor(totalDays / allOpportunities.length),
            countByStatus
        });
    };

    const groupOpportunities = (opportunities) => {
        const grouped = pipelineColumns.reduce((acc, col) => {
            acc[col.id] = [];
            return acc;
        }, {});
        opportunities.forEach(opp => {
            if (grouped[opp.status]) {
                grouped[opp.status].push(opp);
            } else {
                console.warn(`Ukjent status funnet: ${opp.status} for mulighet ID: ${opp.id}`);
            }
        });
        setOpportunitiesByStatus(grouped);
    };

    // --- Drag & Drop Logikk ---
    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Droppet utenfor et gyldig område
        if (!destination) {
            return;
        }

        // Droppet på samme sted
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const startColumnId = source.droppableId;
        const endColumnId = destination.droppableId; // Dette er den nye statusen
        const opportunityId = draggableId; // ID for muligheten som ble flyttet

        // Finn muligheten som ble flyttet
        const opportunityToMove = opportunitiesByStatus[startColumnId]?.find(opp => opp.id.toString() === opportunityId);
        if (!opportunityToMove) {
            console.error('Kunne ikke finne muligheten som ble flyttet');
            return;
        }

        // Optimistisk oppdatering av UI
        const newOpportunitiesByStatus = { ...opportunitiesByStatus };
        // Fjern fra startkolonnen
        const startColumnOpportunities = Array.from(newOpportunitiesByStatus[startColumnId]);
        startColumnOpportunities.splice(source.index, 1);
        newOpportunitiesByStatus[startColumnId] = startColumnOpportunities;
        // Legg til i sluttkolonnen
        const endColumnOpportunities = Array.from(newOpportunitiesByStatus[endColumnId] || []);
        const updatedOpportunity = { ...opportunityToMove, status: endColumnId }; // Oppdater status lokalt
        endColumnOpportunities.splice(destination.index, 0, updatedOpportunity);
        newOpportunitiesByStatus[endColumnId] = endColumnOpportunities;

        setOpportunitiesByStatus(newOpportunitiesByStatus); // Oppdater state for UI
        setIsUpdating(true); // Indikerer at vi lagrer
        setError('');

        // Oppdater allOpportunities for å holde statistikk oppdatert
        setAllOpportunities(prev => 
            prev.map(opp => opp.id === parseInt(opportunityId) ? { ...opp, status: endColumnId } : opp)
        );

        // Send PATCH-forespørsel til API
        try {
            const token = getToken();
            await axios.patch(`${API_BASE_URL}/api/sales-opportunities/${opportunityId}/`, 
                { status: endColumnId }, // Send kun statusendringen
                { headers: { 'Authorization': `Token ${token}` } }
            );
            // Suksess! Den optimistiske oppdateringen var korrekt.
        } catch (err) {
            console.error('Feil ved oppdatering av status:', err.response || err.message);
            setError('Kunne ikke oppdatere status. Prøver å tilbakestille.');
            // Tilbakestill UI ved feil
            fetchOpportunities(); // Hent alt på nytt ved feil
        } finally {
            setIsUpdating(false);
        }
    };
    // --- Slutt Drag & Drop Logikk ---

    const handleOpenEditModal = (opportunity) => {
        setEditingOpportunity(opportunity);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOpportunity(null);
    };
    
    const handleSave = () => {
        fetchOpportunities();
        handleCloseModal();
    };
    
    const handleAddOpportunityClick = () => {
        setEditingOpportunity(null);
        setIsModalOpen(true);
    };
    
    const toggleStats = () => {
        setStatsVisible(!statsVisible);
    };

    const totalOpportunitiesCount = Object.values(opportunitiesByStatus)
        .reduce((sum, list) => sum + list.length, 0);

    const calculateTotalValue = (status) => {
        if (!opportunitiesByStatus[status]) return 0;
        return opportunitiesByStatus[status].reduce((sum, opp) => 
            sum + (parseFloat(opp.estimated_value) || 0), 0);
    };

    // Fargeindikator basert på hvor lenge muligheten har vært i pipeline
    const getAgeBadgeColor = (createdDate) => {
        const now = new Date();
        const created = new Date(createdDate);
        const ageInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        
        if (ageInDays < 7) return 'badge-success';
        if (ageInDays < 14) return 'badge-warning';
        return 'badge-danger';
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="pipeline-board-container">
                <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Salgspipeline {isUpdating && <span className="saving-indicator">(Oppdaterer...)</span>}</h2>
                    <div>
                        <button 
                            className="btn btn-outline-info me-2"
                            onClick={toggleStats}
                        >
                            {statsVisible ? 'Skjul statistikk' : 'Vis statistikk'}
                        </button>
                        <button 
                            className="btn btn-success"
                            onClick={handleAddOpportunityClick}
                        >
                            <i className="fas fa-plus me-1"></i> Ny salgsmulighet
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                
                {/* Statistikkpanel */}
                {statsVisible && (
                    <div className="card mb-3">
                        <div className="card-header">Salgsstatistikk</div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <h5>Totalt antall muligheter</h5>
                                        <div className="display-4">{stats.count}</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <h5>Total potensiell verdi</h5>
                                        <div className="display-4">{stats.totalValue.toLocaleString()} kr</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <h5>Gjennomsnittlig tid i pipeline</h5>
                                        <div className="display-4">{stats.avgDaysInPipeline} dager</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <h5>Konverteringsrate</h5>
                                        <div className="display-4">
                                            {stats.count ? Math.round((stats.countByStatus.won || 0) / stats.count * 100) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtreringsverktøy */}
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-3">
                                <label htmlFor="filterCustomer" className="form-label">Filter kunde:</label>
                                <select 
                                    id="filterCustomer" 
                                    className="form-select"
                                    value={filterCustomer}
                                    onChange={(e) => setFilterCustomer(e.target.value)}
                                >
                                    <option value="">Alle kunder</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="filterTerm" className="form-label">Søk:</label>
                                <input 
                                    type="text" 
                                    id="filterTerm" 
                                    className="form-control"
                                    placeholder="Søk i navn eller beskrivelse..." 
                                    value={filterTerm}
                                    onChange={(e) => setFilterTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="sortOption" className="form-label">Sorter etter:</label>
                                <select 
                                    id="sortOption" 
                                    className="form-select"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option value="newest">Nyeste først</option>
                                    <option value="oldest">Eldste først</option>
                                    <option value="value-high">Høyeste verdi først</option>
                                    <option value="value-low">Laveste verdi først</option>
                                    <option value="name">Alfabetisk</option>
                                </select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button 
                                    className="btn btn-secondary w-100 mt-4"
                                    onClick={() => {
                                        setFilterCustomer('');
                                        setFilterTerm('');
                                        setSortOption('newest');
                                    }}
                                >
                                    Nullstill filter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && !totalOpportunitiesCount && <p>Laster pipeline...</p>}

                <div className="pipeline-board">
                    {pipelineColumns.map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`pipeline-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                >
                                    <div className="column-header">
                                    <h3>{column.title} ({opportunitiesByStatus[column.id]?.length || 0})</h3>
                                        <div className="column-value">
                                            {calculateTotalValue(column.id).toLocaleString()} kr
                                        </div>
                                    </div>
                                    <div className="column-content">
                                        {(opportunitiesByStatus[column.id] || []).map((opp, index) => (
                                            <Draggable key={opp.id.toString()} draggableId={opp.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`opportunity-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                        onClick={() => handleOpenEditModal(opp)}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <div className="card-title">{opp.name}</div>
                                                        <div className="card-customer">{opp.customer_name}</div>
                                                        {opp.estimated_value && 
                                                            <div className="card-value">{opp.estimated_value} kr</div>
                                                        }
                                                        <div className="card-footer">
                                                            <span className={`age-badge ${getAgeBadgeColor(opp.created_at)}`} 
                                                                title="Alder i pipeline">
                                                                {Math.floor((new Date() - new Date(opp.created_at)) / (1000 * 60 * 60 * 24))} dager
                                                            </span>
                                                            {opp.quotes_count > 0 && (
                                                                <span className="quote-badge" title="Antall tilbud">
                                                                    <i className="fas fa-file-invoice"></i> {opp.quotes_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                    {opportunitiesByStatus[column.id]?.length === 0 && !isLoading && !snapshot.isDraggingOver && (
                                         <p className="text-muted small mt-2">Dra kort hit</p>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>

                <AddEditOpportunityModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    opportunityToEdit={editingOpportunity}
                />
            </div>
        </DragDropContext>
    );
};

export default SalesPipelineBoard; 