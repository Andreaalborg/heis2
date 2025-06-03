import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddEditOpportunityModal from './AddEditOpportunityModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesAutomation = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'Heisinstallasjon - Nybygg',
            description: 'Standard mal for heisinstallasjon i nybygg',
            estimatedValue: 850000,
            defaultStatus: 'new'
        },
        {
            id: 2,
            name: 'Heisservice - Årsavtale',
            description: 'Årlig serviceavtale for heis',
            estimatedValue: 45000,
            defaultStatus: 'contacted'
        },
        {
            id: 3,
            name: 'Modernisering av eksisterende heis',
            description: 'Oppgradering og modernisering av gammel heis',
            estimatedValue: 350000,
            defaultStatus: 'new'
        }
    ]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        fetchOpportunities();
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (opportunities.length > 0) {
            generateReminders();
        }
    }, [opportunities]);

    const fetchOpportunities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/sales-opportunities/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const opps = response.data.results || response.data;
            setOpportunities(Array.isArray(opps) ? opps : []);
        } catch (error) {
            console.error('Feil ved henting av salgsmuligheter:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/customers/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const customerData = response.data.results || response.data;
            setCustomers(Array.isArray(customerData) ? customerData : []);
        } catch (error) {
            console.error('Feil ved henting av kunder:', error);
        }
    };

    const generateReminders = () => {
        const now = new Date();
        const remindersToSet = [];

        opportunities.forEach(opp => {
            const createdDate = new Date(opp.created_at);
            const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

            // Generer påminnelser basert på status og alder
            if (opp.status === 'new' && daysSinceCreated > 3) {
                remindersToSet.push({
                    id: opp.id,
                    type: 'contact',
                    message: `Kontakt ${opp.customer_name} - mulighet har vært ny i ${daysSinceCreated} dager`,
                    priority: 'high',
                    opportunity: opp
                });
            } else if (opp.status === 'contacted' && daysSinceCreated > 7) {
                remindersToSet.push({
                    id: opp.id,
                    type: 'follow-up',
                    message: `Følg opp ${opp.customer_name} - sist kontakt for ${daysSinceCreated} dager siden`,
                    priority: 'medium',
                    opportunity: opp
                });
            } else if (opp.status === 'proposal' && daysSinceCreated > 14) {
                remindersToSet.push({
                    id: opp.id,
                    type: 'quote-follow-up',
                    message: `Sjekk status på tilbud til ${opp.customer_name}`,
                    priority: 'high',
                    opportunity: opp
                });
            }
        });

        setReminders(remindersToSet);
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
    };

    const handleCreateFromTemplate = async () => {
        if (!selectedTemplate || !selectedCustomer) {
            alert('Vennligst velg både mal og kunde');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const opportunityData = {
                name: selectedTemplate.name,
                customer: selectedCustomer,
                description: selectedTemplate.description,
                status: selectedTemplate.defaultStatus,
                estimated_value: selectedTemplate.estimatedValue
            };

            await axios.post(`${API_BASE_URL}/api/sales-opportunities/`, opportunityData, {
                headers: { 'Authorization': `Token ${token}` }
            });

            // Oppdater listen
            fetchOpportunities();
            setSelectedTemplate(null);
            setSelectedCustomer('');
            alert('Salgsmulighet opprettet fra mal!');
        } catch (error) {
            console.error('Feil ved opprettelse fra mal:', error);
            alert('Kunne ikke opprette salgsmulighet');
        }
    };

    const handleActionClick = (reminder) => {
        // Åpne modal med forhåndsutfylt info
        setIsModalOpen(true);
    };

    return (
        <div className="container-fluid mt-4">
            <h2>Salgsautomatisering og oppfølging</h2>

            {/* Påminnelser */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header bg-warning">
                            <h5 className="mb-0 text-dark">
                                <i className="fas fa-bell me-2"></i>
                                Aktive påminnelser ({reminders.length})
                            </h5>
                        </div>
                        <div className="card-body">
                            {reminders.length === 0 ? (
                                <p className="text-muted">Ingen påminnelser for øyeblikket</p>
                            ) : (
                                <div className="list-group">
                                    {reminders.map(reminder => (
                                        <div key={reminder.id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className={`mb-1 ${reminder.priority === 'high' ? 'text-danger' : 'text-warning'}`}>
                                                        {reminder.message}
                                                    </h6>
                                                    <small className="text-muted">
                                                        {reminder.opportunity.name} - Verdi: {reminder.opportunity.estimated_value} kr
                                                    </small>
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleActionClick(reminder)}
                                                >
                                                    Ta handling
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Salgsmaler */}
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-file-alt me-2"></i>
                                Hurtigstart med salgsmaler
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Velg mal:</label>
                                    <select 
                                        className="form-select"
                                        value={selectedTemplate?.id || ''}
                                        onChange={(e) => {
                                            const template = templates.find(t => t.id === parseInt(e.target.value));
                                            handleTemplateSelect(template);
                                        }}
                                    >
                                        <option value="">-- Velg en mal --</option>
                                        {templates.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.name} ({template.estimatedValue.toLocaleString()} kr)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Velg kunde:</label>
                                    <select 
                                        className="form-select"
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                    >
                                        <option value="">-- Velg kunde --</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button 
                                        className="btn btn-success w-100"
                                        onClick={handleCreateFromTemplate}
                                        disabled={!selectedTemplate || !selectedCustomer}
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Opprett
                                    </button>
                                </div>
                            </div>

                            {selectedTemplate && (
                                <div className="alert alert-info mt-3">
                                    <h6>{selectedTemplate.name}</h6>
                                    <p className="mb-0">{selectedTemplate.description}</p>
                                    <small>Estimert verdi: {selectedTemplate.estimatedValue.toLocaleString()} kr</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Anbefalte handlinger */}
            <div className="row mt-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-lightbulb me-2"></i>
                                Anbefalte handlinger
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                <div className="list-group-item">
                                    <h6>Kontakt inaktive kunder</h6>
                                    <p className="mb-1">5 kunder har ikke hatt aktivitet siste 6 måneder</p>
                                    <button className="btn btn-sm btn-outline-primary">Se kunder</button>
                                </div>
                                <div className="list-group-item">
                                    <h6>Opprett kampanje for servicekontrakter</h6>
                                    <p className="mb-1">15 heiser mangler servicekontrakt</p>
                                    <button className="btn btn-sm btn-outline-primary">Start kampanje</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => {
                    setIsModalOpen(false);
                    fetchOpportunities();
                    generateReminders();
                }}
                opportunityToEdit={null}
            />
        </div>
    );
};

export default SalesAutomation; 