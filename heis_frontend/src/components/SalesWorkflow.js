import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCustomerModal from './AddCustomerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesWorkflow = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [workflowData, setWorkflowData] = useState({
        customer: null,
        isNewCustomer: false,
        serviceType: '',
        elevatorType: '',
        description: '',
        estimatedValue: '',
        startDate: '',
        endDate: '',
        assignedTechnician: '',
        priority: 'medium'
    });

    // Data fra API
    const [customers, setCustomers] = useState([]);
    const [elevatorTypes, setElevatorTypes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [technicianAvailability, setTechnicianAvailability] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    // Service type options
    const serviceTypes = [
        { value: 'installation', label: 'Heisinstallasjon', estimatedDays: 5, basePrice: 850000 },
        { value: 'service', label: 'Service/Vedlikehold', estimatedDays: 1, basePrice: 8500 },
        { value: 'repair', label: 'Reparasjon', estimatedDays: 2, basePrice: 15000 },
        { value: 'inspection', label: 'Inspeksjon', estimatedDays: 0.5, basePrice: 5000 },
        { value: 'modernization', label: 'Modernisering', estimatedDays: 7, basePrice: 350000 }
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (workflowData.startDate && workflowData.serviceType) {
            checkTechnicianAvailability();
        }
    }, [workflowData.startDate, workflowData.serviceType]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // Hent kunder, heistyper og teknikere parallelt
            const [customersRes, elevatorTypesRes, techniciansRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/customers/`, { headers }),
                axios.get(`${API_BASE_URL}/api/elevator-types/`, { headers }),
                axios.get(`${API_BASE_URL}/api/users/`, { headers })
            ]);

            setCustomers(customersRes.data.results || customersRes.data);
            setElevatorTypes(elevatorTypesRes.data.results || elevatorTypesRes.data);
            
            // Filtrer kun teknikere
            const allUsers = techniciansRes.data.results || techniciansRes.data;
            setTechnicians(allUsers.filter(user => user.role === 'tekniker'));
        } catch (error) {
            console.error('Feil ved henting av data:', error);
        }
    };

    const checkTechnicianAvailability = async () => {
        if (!workflowData.startDate) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const serviceType = serviceTypes.find(s => s.value === workflowData.serviceType);
            const estimatedDays = serviceType?.estimatedDays || 1;
            
            // Beregn sluttdato basert på estimerte dager
            const startDate = new Date(workflowData.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + Math.ceil(estimatedDays));
            
            // Oppdater workflow data med beregnet sluttdato
            setWorkflowData(prev => ({
                ...prev,
                endDate: endDate.toISOString().split('T')[0]
            }));

            // Sjekk tilgjengelighet for hver tekniker
            const availability = {};
            for (const tech of technicians) {
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/api/assignments/?assigned_to=${tech.id}&start_date=${workflowData.startDate}&end_date=${endDate.toISOString().split('T')[0]}`,
                        { headers: { 'Authorization': `Token ${token}` } }
                    );
                    const assignments = response.data.results || response.data;
                    availability[tech.id] = {
                        isAvailable: assignments.length === 0,
                        conflictingAssignments: assignments.length,
                        assignments: assignments
                    };
                } catch (error) {
                    availability[tech.id] = { isAvailable: false, error: true };
                }
            }
            setTechnicianAvailability(availability);
        } catch (error) {
            console.error('Feil ved sjekk av tilgjengelighet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStepChange = (step) => {
        setCurrentStep(step);
    };

    const handleInputChange = (field, value) => {
        setWorkflowData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-kalkuler estimert verdi basert på service type og heistype
        if (field === 'serviceType' || field === 'elevatorType') {
            const serviceType = serviceTypes.find(s => s.value === (field === 'serviceType' ? value : workflowData.serviceType));
            const elevatorType = elevatorTypes.find(e => e.id === parseInt(field === 'elevatorType' ? value : workflowData.elevatorType));
            
            if (serviceType) {
                let estimatedValue = serviceType.basePrice;
                if (elevatorType && elevatorType.price) {
                    estimatedValue = serviceType.value === 'installation' ? elevatorType.price : serviceType.basePrice;
                }
                setWorkflowData(prev => ({
                    ...prev,
                    estimatedValue: estimatedValue
                }));
            }
        }
    };

    const handleCustomerSelect = (customerId) => {
        const customer = customers.find(c => c.id === parseInt(customerId));
        setWorkflowData(prev => ({
            ...prev,
            customer: customer,
            isNewCustomer: false
        }));
    };

    const handleNewCustomer = () => {
        setWorkflowData(prev => ({
            ...prev,
            isNewCustomer: true
        }));
        setIsCustomerModalOpen(true);
    };

    const handleCustomerAdded = (newCustomer) => {
        setCustomers(prev => [...prev, newCustomer]);
        setWorkflowData(prev => ({
            ...prev,
            customer: newCustomer,
            isNewCustomer: false
        }));
        setIsCustomerModalOpen(false);
        setCurrentStep(2);
    };

    const handleFinishWorkflow = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // Opprett salgsmulighet
            const opportunityData = {
                name: `${workflowData.customer.name} - ${serviceTypes.find(s => s.value === workflowData.serviceType)?.label}`,
                customer: workflowData.customer.id,
                description: workflowData.description,
                status: 'contacted',
                estimated_value: workflowData.estimatedValue
            };

            const oppResponse = await axios.post(`${API_BASE_URL}/api/sales-opportunities/`, opportunityData, { headers });

            // Opprett oppdrag
            const assignmentData = {
                title: `${serviceTypes.find(s => s.value === workflowData.serviceType)?.label} - ${workflowData.customer.name}`,
                description: workflowData.description,
                customer: workflowData.customer.id,
                assignment_type: workflowData.serviceType,
                assigned_to: workflowData.assignedTechnician,
                scheduled_date: `${workflowData.startDate}T09:00:00`,
                deadline_date: workflowData.endDate,
                priority: workflowData.priority,
                status: 'pending'
            };

            await axios.post(`${API_BASE_URL}/api/assignments/`, assignmentData, { headers });

            alert('Kunde og oppdrag opprettet successfully!');
            
            // Reset workflow
            setWorkflowData({
                customer: null,
                isNewCustomer: false,
                serviceType: '',
                elevatorType: '',
                description: '',
                estimatedValue: '',
                startDate: '',
                endDate: '',
                assignedTechnician: '',
                priority: 'medium'
            });
            setCurrentStep(1);
        } catch (error) {
            console.error('Feil ved opprettelse:', error);
            alert('Feil ved opprettelse av kunde/oppdrag');
        } finally {
            setIsLoading(false);
        }
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1: return workflowData.customer !== null;
            case 2: return workflowData.serviceType !== '';
            case 3: return workflowData.startDate !== '' && workflowData.endDate !== '';
            case 4: return workflowData.assignedTechnician !== '';
            default: return false;
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-md-12">
                    <h2>Kunde til Oppdrag - Arbeidsflyt</h2>
                    <p className="text-muted">Guide for å opprette nye kunder og planlegge oppdrag</p>

                    {/* Progress Steps */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                {[
                                    { step: 1, title: 'Velg Kunde', icon: 'fas fa-user' },
                                    { step: 2, title: 'Velg Tjeneste', icon: 'fas fa-cogs' },
                                    { step: 3, title: 'Planlegg Dato', icon: 'fas fa-calendar' },
                                    { step: 4, title: 'Velg Tekniker', icon: 'fas fa-hard-hat' },
                                    { step: 5, title: 'Fullført', icon: 'fas fa-check' }
                                ].map(({ step, title, icon }) => (
                                    <div key={step} className={`text-center ${currentStep >= step ? 'text-primary' : 'text-muted'}`}>
                                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                                            currentStep >= step ? 'bg-primary text-white' : 'bg-light'
                                        }`} style={{width: '50px', height: '50px'}}>
                                            <i className={icon}></i>
                                        </div>
                                        <div className="small">{title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="card">
                        <div className="card-body">
                            {/* Steg 1: Velg Kunde */}
                            {currentStep === 1 && (
                                <div>
                                    <h4>Steg 1: Velg eller Opprett Kunde</h4>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <label className="form-label">Velg eksisterende kunde:</label>
                                            <select 
                                                className="form-select mb-3"
                                                value={workflowData.customer?.id || ''}
                                                onChange={(e) => handleCustomerSelect(e.target.value)}
                                            >
                                                <option value="">-- Velg kunde --</option>
                                                {customers.map(customer => (
                                                    <option key={customer.id} value={customer.id}>
                                                        {customer.name} - {customer.city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Eller opprett ny:</label>
                                            <button 
                                                className="btn btn-success w-100"
                                                onClick={handleNewCustomer}
                                            >
                                                <i className="fas fa-plus me-2"></i>Ny Kunde
                                            </button>
                                        </div>
                                    </div>
                                    {workflowData.customer && (
                                        <div className="alert alert-success">
                                            <h6>Valgt kunde: {workflowData.customer.name}</h6>
                                            <p className="mb-0">{workflowData.customer.address}, {workflowData.customer.city}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Steg 2: Velg Tjeneste */}
                            {currentStep === 2 && (
                                <div>
                                    <h4>Steg 2: Velg Tjeneste</h4>
                                    <div className="row">
                                        {serviceTypes.map(service => (
                                            <div key={service.value} className="col-md-4 mb-3">
                                                <div 
                                                    className={`card h-100 ${workflowData.serviceType === service.value ? 'border-primary bg-light' : ''}`}
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => handleInputChange('serviceType', service.value)}
                                                >
                                                    <div className="card-body text-center">
                                                        <h5>{service.label}</h5>
                                                        <p className="text-muted">Ca. {service.estimatedDays} dag(er)</p>
                                                        <p className="h6">Fra {service.basePrice.toLocaleString()} kr</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {workflowData.serviceType === 'installation' && (
                                        <div className="mt-3">
                                            <label className="form-label">Velg heistype:</label>
                                            <select 
                                                className="form-select"
                                                value={workflowData.elevatorType}
                                                onChange={(e) => handleInputChange('elevatorType', e.target.value)}
                                            >
                                                <option value="">-- Velg heistype --</option>
                                                {elevatorTypes.map(type => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.name} - {type.price?.toLocaleString()} kr
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <label className="form-label">Beskrivelse:</label>
                                        <textarea 
                                            className="form-control"
                                            rows="3"
                                            value={workflowData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Beskriv oppdraget..."
                                        />
                                    </div>

                                    {workflowData.estimatedValue && (
                                        <div className="alert alert-info mt-3">
                                            <strong>Estimert verdi: {workflowData.estimatedValue.toLocaleString()} kr</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Steg 3: Planlegg Dato */}
                            {currentStep === 3 && (
                                <div>
                                    <h4>Steg 3: Planlegg Oppdrag</h4>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <label className="form-label">Startdato:</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                value={workflowData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Estimert sluttdato:</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                value={workflowData.endDate}
                                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                readOnly
                                            />
                                            <small className="text-muted">Beregnet automatisk basert på tjenestetype</small>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="form-label">Prioritet:</label>
                                        <select 
                                            className="form-select"
                                            value={workflowData.priority}
                                            onChange={(e) => handleInputChange('priority', e.target.value)}
                                        >
                                            <option value="low">Lav</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">Høy</option>
                                            <option value="urgent">Kritisk</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Steg 4: Velg Tekniker */}
                            {currentStep === 4 && (
                                <div>
                                    <h4>Steg 4: Velg Tekniker</h4>
                                    {isLoading ? (
                                        <p>Sjekker tilgjengelighet...</p>
                                    ) : (
                                        <div className="row">
                                            {technicians.map(tech => {
                                                const availability = technicianAvailability[tech.id];
                                                const isAvailable = availability?.isAvailable;
                                                
                                                return (
                                                    <div key={tech.id} className="col-md-6 mb-3">
                                                        <div 
                                                            className={`card ${workflowData.assignedTechnician === tech.id ? 'border-primary' : ''} ${!isAvailable ? 'bg-light' : ''}`}
                                                            style={{cursor: isAvailable ? 'pointer' : 'not-allowed'}}
                                                            onClick={() => isAvailable && handleInputChange('assignedTechnician', tech.id)}
                                                        >
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h6>{tech.first_name} {tech.last_name}</h6>
                                                                        <small className="text-muted">{tech.email}</small>
                                                                    </div>
                                                                    <span className={`badge ${isAvailable ? 'bg-success' : 'bg-danger'}`}>
                                                                        {isAvailable ? 'Ledig' : 'Opptatt'}
                                                                    </span>
                                                                </div>
                                                                {!isAvailable && availability?.conflictingAssignments > 0 && (
                                                                    <small className="text-danger">
                                                                        {availability.conflictingAssignments} konflikterende oppdrag
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Steg 5: Oppsummering */}
                            {currentStep === 5 && (
                                <div>
                                    <h4>Steg 5: Oppsummering</h4>
                                    <div className="alert alert-info">
                                        <h5>Klar til å opprette oppdrag!</h5>
                                        <hr />
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p><strong>Kunde:</strong> {workflowData.customer?.name}</p>
                                                <p><strong>Tjeneste:</strong> {serviceTypes.find(s => s.value === workflowData.serviceType)?.label}</p>
                                                <p><strong>Periode:</strong> {workflowData.startDate} til {workflowData.endDate}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p><strong>Tekniker:</strong> {technicians.find(t => t.id === parseInt(workflowData.assignedTechnician))?.first_name} {technicians.find(t => t.id === parseInt(workflowData.assignedTechnician))?.last_name}</p>
                                                <p><strong>Estimert verdi:</strong> {workflowData.estimatedValue?.toLocaleString()} kr</p>
                                                <p><strong>Prioritet:</strong> {workflowData.priority}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="d-flex justify-content-between mt-4">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                                    disabled={currentStep === 1}
                                >
                                    <i className="fas fa-arrow-left me-2"></i>Tilbake
                                </button>

                                {currentStep < 5 ? (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => handleStepChange(currentStep + 1)}
                                        disabled={!canProceedToNextStep()}
                                    >
                                        Neste<i className="fas fa-arrow-right ms-2"></i>
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-success"
                                        onClick={handleFinishWorkflow}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Oppretter...' : 'Opprett Oppdrag'}
                                        <i className="fas fa-check ms-2"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddCustomerModal 
                isOpen={isCustomerModalOpen} 
                onClose={() => setIsCustomerModalOpen(false)} 
                onCustomerAdded={handleCustomerAdded} 
            />
        </div>
    );
};

export default SalesWorkflow; 