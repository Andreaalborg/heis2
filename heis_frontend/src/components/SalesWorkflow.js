import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCustomerModal from './AddCustomerModal';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

    // Service type options
    const serviceTypes = [
        { value: 'installation', label: 'Heisinstallasjon', basePrice: 850000 },
        { value: 'service', label: 'Service/Vedlikehold', basePrice: 8500 },
        { value: 'repair', label: 'Reparasjon', basePrice: 15000 },
        { value: 'inspection', label: 'Inspeksjon', basePrice: 5000 },
        { value: 'modernization', label: 'Modernisering', basePrice: 350000 }
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (workflowData.startDate && workflowData.endDate && workflowData.serviceType) {
            if (new Date(workflowData.endDate) >= new Date(workflowData.startDate)) {
                checkTechnicianAvailability();
            }
        }
    }, [workflowData.startDate, workflowData.endDate, workflowData.serviceType]);

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
        if (!workflowData.startDate || !workflowData.endDate) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const availability = {};
            for (const tech of technicians) {
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/api/assignments/?assigned_to=${tech.id}&start_date=${workflowData.startDate}&end_date=${workflowData.endDate}`,
                        { headers: { 'Authorization': `Token ${token}` } }
                    );
                    const assignments = response.data.results || response.data;
                    availability[tech.id] = {
                        isAvailable: assignments.length === 0,
                        conflictingAssignments: assignments.length,
                        assignments: assignments
                    };
                } catch (error) {
                    availability[tech.id] = { isAvailable: false, error: true, conflictingAssignments: 0 };
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

        if (field === 'serviceType' || field === 'elevatorType') {
            const serviceConf = serviceTypes.find(s => s.value === (field === 'serviceType' ? value : workflowData.serviceType));
            const elevatorConf = elevatorTypes.find(e => e.id === parseInt(field === 'elevatorType' ? value : workflowData.elevatorType));
            
            if (serviceConf) {
                let estimatedValue = serviceConf.basePrice;
                if (workflowData.serviceType === 'installation' && elevatorConf && elevatorConf.price) {
                    estimatedValue = elevatorConf.price;
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

            const finalDescription = workflowData.description.trim() === '' ? 
                `Tilbud for ${workflowData.customer.name} - ${serviceTypes.find(s => s.value === workflowData.serviceType)?.label}` : 
                workflowData.description;

            // 1. Opprett Salgsmulighet
            const opportunityData = {
                name: `${workflowData.customer.name} - ${serviceTypes.find(s => s.value === workflowData.serviceType)?.label}`,
                customer: workflowData.customer.id,
                description: finalDescription,
                status: 'proposal',
                estimated_value: workflowData.estimatedValue
            };
            const oppResponse = await axios.post(`${API_BASE_URL}/api/sales-opportunities/`, opportunityData, { headers });
            const newOpportunityId = oppResponse.data.id;

            // 2. Opprett Tilbud (Quote)
            const internalNotes = `Foreslått tekniker: ${technicians.find(t => t.id === parseInt(workflowData.assignedTechnician))?.first_name || 'Ikke valgt'}. Foreslått periode: ${workflowData.startDate} til ${workflowData.endDate}. Prioritet: ${workflowData.priority}.`;
            const quoteData = {
                opportunity: newOpportunityId,
                status: 'draft',
                notes: internalNotes,
                customer_notes: finalDescription,
                total_amount: workflowData.estimatedValue,
            };
            const quoteResponse = await axios.post(`${API_BASE_URL}/api/quotes/`, quoteData, { headers });
            const newQuoteId = quoteResponse.data.id;

            // 3. (Valgfritt) Opprett QuoteLineItem hvis det er en installasjon
            if (workflowData.serviceType === 'installation' && workflowData.elevatorType) {
                const lineItemData = {
                    quote: newQuoteId,
                    elevator_type: parseInt(workflowData.elevatorType),
                    quantity: 1
                };
                console.log('Forsøker å opprette QuoteLineItem med data:', lineItemData);
                await axios.post(`${API_BASE_URL}/api/quote-line-items/`, lineItemData, { headers });
            }

            alert('Tilbud opprettet vellykket!');
            
            // Reset workflow og naviger til det nye tilbudet
            setCurrentStep(1);
            setWorkflowData({
                customer: null, isNewCustomer: false, serviceType: '', elevatorType: '', description: '',
                estimatedValue: '', startDate: '', endDate: '', assignedTechnician: '', priority: 'medium'
            });
            navigate(`/quotes/${newQuoteId}`);

        } catch (error) {
            console.error('Feil ved opprettelse av tilbud:', error);
            console.error('Response data:', error.response?.data);
            let errorMessage = 'Feil ved opprettelse av tilbud.';
            if (error.response?.data) {
                const fieldErrors = Object.entries(error.response.data)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join('; ');
                if (fieldErrors) {
                    errorMessage += ` Detaljer: ${fieldErrors}`;
                } else if (error.response.data.detail) {
                    errorMessage += ` Detaljer: ${error.response.data.detail}`;
                }
            } else if (error.message) {
                errorMessage += ` (${error.message})`;
            }
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const canProceedToNextStep = (targetStep) => {
        const stepToValidate = targetStep ? targetStep -1 : currentStep;
        switch (stepToValidate) {
            case 1: 
                return workflowData.customer !== null;
            case 2: 
                return workflowData.serviceType !== '' && workflowData.description.trim() !== '';
            case 3: 
                return workflowData.startDate !== '' && 
                       workflowData.endDate !== '' && 
                       new Date(workflowData.endDate) >= new Date(workflowData.startDate);
            case 4: 
                // Foreslått tekniker er valgfritt, så vi returnerer alltid true her hvis vi har kommet så langt.
                // Hvis det var påkrevd, ville det vært: workflowData.assignedTechnician !== ''
                return true; 
            default: 
                return false;
        }
    };

    // Funksjon for å sjekke om alle *tidligere* steg er gyldige
    const arePreviousStepsValid = (upToStep) => {
        for (let i = 1; i < upToStep; i++) {
            if (!canProceedToNextStep(i + 1)) { // Sjekker om vi KAN gå TIL neste steg fra i
                return false;
            }
        }
        return true;
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-md-12">
                    <h2>Kunde til Oppdrag - Arbeidsflyt</h2>
                    <p className="text-muted">Guide for å opprette nye kunder og klargjøre tilbud</p>

                    {/* Improved Progress Stepper */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row align-items-center">
                                {[
                                    { step: 1, title: 'Velg Kunde', icon: 'fas fa-user' },
                                    { step: 2, title: 'Velg Tjeneste', icon: 'fas fa-cogs' },
                                    { step: 3, title: 'Planlegg Dato', icon: 'fas fa-calendar' },
                                    { step: 4, title: 'Foreslå Tekniker', icon: 'fas fa-hard-hat' },
                                    { step: 5, title: 'Fullfør Tilbud', icon: 'fas fa-file-signature' }
                                ].map(({ step, title, icon }, index, arr) => (
                                    <React.Fragment key={step}>
                                        <div className="col text-center">
                                            <div 
                                                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                                                    currentStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'
                                                }`}
                                                style={{width: '50px', height: '50px', border: currentStep === step ? '2px solid var(--bs-primary)' : '2px solid #dee2e6'}}
                                            >
                                                <i className={icon} style={{fontSize: '1.25rem'}}></i>
                                            </div>
                                            <div className={`small ${currentStep >= step ? 'fw-bold text-primary' : 'text-muted'}`}>{title}</div>
                                        </div>
                                        {index < arr.length - 1 && (
                                            <div className="col-auto px-0" style={{ flexGrow: 1}}>
                                                <div 
                                                    className={`progress-line ${currentStep > step ? 'bg-primary' : 'bg-light'}`}
                                                    style={{height: '4px', width: '100%', marginTop: '25px'}}
                                                ></div>
                                            </div>
                                        )}
                                    </React.Fragment>
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
                                    <h4>Steg 2: Spesifiser Tjeneste</h4>
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
                                        <label className="form-label">Beskrivelse *:</label>
                                        <textarea 
                                            className="form-control"
                                            rows="3"
                                            value={workflowData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Beskriv oppdraget/tjenesten... (Påkrevd)"
                                            required
                                        />
                                    </div>

                                    {workflowData.estimatedValue && (
                                        <div className="alert alert-info mt-3">
                                            <strong>Estimert verdi for tilbud: {workflowData.estimatedValue.toLocaleString()} kr</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Steg 3: Planlegg Dato (Manuell) */}
                            {currentStep === 3 && (
                                <div>
                                    <h4>Steg 3: Foreslå Periode for Tilbud</h4>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <label className="form-label">Foreslått startdato *:</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                value={workflowData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Foreslått sluttdato *:</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                value={workflowData.endDate}
                                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                min={workflowData.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                            {workflowData.startDate && workflowData.endDate && new Date(workflowData.endDate) < new Date(workflowData.startDate) && (
                                                <small className="text-danger">Sluttdato kan ikke være før startdato.</small>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="form-label">Prioritet (for internt bruk):</label>
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

                            {/* Steg 4: Velg Tekniker (med visuell markering) */}
                            {currentStep === 4 && (
                                <div>
                                    <h4>Steg 4: Foreslå Tekniker (valgfritt)</h4>
                                    <p className="text-muted">Velg en tekniker som foreslås for oppdraget. Dette kan endres senere.</p>
                                    {isLoading ? (
                                        <p>Sjekker tilgjengelighet...</p>
                                    ) : (
                                        <div className="row">
                                            {technicians.map(tech => {
                                                const availability = technicianAvailability[tech.id];
                                                const isAvailable = availability?.isAvailable;
                                                const isSelected = parseInt(workflowData.assignedTechnician) === tech.id;
                                                
                                                return (
                                                    <div key={tech.id} className="col-md-6 mb-3">
                                                        <div 
                                                            className={`card ${isSelected ? 'border-primary shadow-sm' : ''} ${!isAvailable && !isSelected ? 'bg-light opacity-75' : ''}`}
                                                            style={{cursor: isAvailable || isSelected ? 'pointer' : 'not-allowed'}}
                                                            onClick={() => (isAvailable || isSelected) && handleInputChange('assignedTechnician', tech.id)}
                                                        >
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <h6>{tech.first_name} {tech.last_name}</h6>
                                                                        <small className="text-muted">{tech.email}</small>
                                                                    </div>
                                                                    <div>
                                                                        {isSelected && (
                                                                            <i className="fas fa-check-circle text-success me-2" style={{fontSize: '1.2rem'}}></i>
                                                                        )}
                                                                        <span className={`badge ${isAvailable ? 'bg-success' : 'bg-danger'}`}>
                                                                            {isAvailable ? 'Ledig' : `Opptatt (${availability?.conflictingAssignments || 0})`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {!isAvailable && availability?.conflictingAssignments > 0 && (
                                                                    <small className="text-danger d-block mt-1">
                                                                        Har {availability.conflictingAssignments} oppdrag i perioden.
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

                            {/* Steg 5: Oppsummering og Lag Tilbud */}
                            {currentStep === 5 && (
                                <div>
                                    <h4>Steg 5: Oppsummering og Klargjør Tilbud</h4>
                                    <div className="alert alert-info">
                                        <h5>Vennligst se over detaljene før du oppretter tilbudet:</h5>
                                        <hr />
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p><strong>Kunde:</strong> {workflowData.customer?.name}</p>
                                                <p><strong>Tjeneste:</strong> {serviceTypes.find(s => s.value === workflowData.serviceType)?.label}</p>
                                                {workflowData.serviceType === 'installation' && workflowData.elevatorType && (
                                                    <p><strong>Heistype:</strong> {elevatorTypes.find(et => et.id === parseInt(workflowData.elevatorType))?.name}</p>
                                                )}
                                                <p><strong>Beskrivelse:</strong> {workflowData.description}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p><strong>Foreslått Periode:</strong> {workflowData.startDate || 'Ikke satt'} til {workflowData.endDate || 'Ikke satt'}</p>
                                                <p><strong>Foreslått Tekniker:</strong> 
                                                    {workflowData.assignedTechnician 
                                                        ? `${technicians.find(t => t.id === parseInt(workflowData.assignedTechnician))?.first_name} ${technicians.find(t => t.id === parseInt(workflowData.assignedTechnician))?.last_name}`
                                                        : 'Ikke valgt'}
                                                </p>
                                                <p><strong>Estimert Verdi:</strong> {workflowData.estimatedValue?.toLocaleString()} kr</p>
                                                <p><strong>Intern Prioritet:</strong> {workflowData.priority}</p>
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
                                        disabled={isLoading || !arePreviousStepsValid(5)}
                                    >
                                        {isLoading ? 'Oppretter Tilbud...' : 'Opprett Tilbud'}
                                        <i className="fas fa-file-signature ms-2"></i>
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