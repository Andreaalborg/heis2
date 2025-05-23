import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const AddAssignmentModal = ({ isOpen, onClose, onAssignmentSaved, assignmentToEdit, initialData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [elevatorId, setElevatorId] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [assignmentType, setAssignmentType] = useState('');
    const [status, setStatus] = useState('pending');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);

    // State for select options
    const [customers, setCustomers] = useState([]);
    const [elevators, setElevators] = useState([]);
    const [filteredElevators, setFilteredElevators] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(false);

    const API_URL = 'http://127.0.0.1:8000/api/assignments/';
    const CUSTOMERS_API_URL = 'http://127.0.0.1:8000/api/customers/';
    const ELEVATORS_API_URL = 'http://127.0.0.1:8000/api/elevators/';
    const USERS_API_URL = 'http://127.0.0.1:8000/api/users/';

    const assignmentTypeChoices = [
        { value: 'installation', label: 'Installasjon' },
        { value: 'service', label: 'Service' },
        { value: 'repair', label: 'Reparasjon' },
        { value: 'inspection', label: 'Inspeksjon' },
    ];

    const statusChoices = [
        { value: 'pending', label: 'Venter' },
        { value: 'in_progress', label: 'Pågår' },
        { value: 'completed', label: 'Fullført' },
        { value: 'cancelled', label: 'Kansellert' },
    ];

    // Fetch customers, elevators and users when modal opens
    useEffect(() => {
        // Flytter funksjonen inn for å løse exhaustive-deps
        const fetchAllSelectData = async () => {
            setLoadingSelects(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Token ${token}` } };
                
                const [customerRes, elevatorRes, userRes] = await Promise.all([
                    axios.get(CUSTOMERS_API_URL, config),
                    axios.get(ELEVATORS_API_URL, config),
                    axios.get(USERS_API_URL, config)
                ]);
    
                console.log("Raw Elevator API Response:", elevatorRes.data); // Log rådata for heiser
                const elevatorsData = elevatorRes.data.results || elevatorRes.data;
                console.log("Parsed Elevators Data:", elevatorsData); // Log parset heisdata
                setCustomers(customerRes.data.results || customerRes.data);
                setElevators(elevatorsData); 
                setUsers(userRes.data.results || userRes.data);
    
                // Filtrer heiser umiddelbart hvis assignmentToEdit har en kunde
                if (assignmentToEdit && assignmentToEdit.customer) {
                    const initialFiltered = elevatorsData.filter(elevator => 
                        elevator.customer === parseInt(assignmentToEdit.customer)
                    );
                    setFilteredElevators(initialFiltered);
                }
    
            } catch (err) {
                console.error("Fetch Select Data Error:", err.response || err); // Log hele feilobjektet
                setError('Kunne ikke laste data for nedtrekkslister. Sjekk konsollen for detaljer.'); // Mer spesifikk feilmelding
                setCustomers([]);
                setElevators([]);
                setUsers([]);
            } finally {
                setLoadingSelects(false);
            }
        };

        if (isOpen) {
            fetchAllSelectData(); // Kall den lokale funksjonen
            if (assignmentToEdit) {
                setTitle(assignmentToEdit.title || '');
                setDescription(assignmentToEdit.description || '');
                setCustomerId(assignmentToEdit.customer || ''); 
                setElevatorId(assignmentToEdit.elevator || '');
                setAssignedToId(assignmentToEdit.assigned_to || ''); 
                setAssignmentType(assignmentToEdit.assignment_type || ''); 
                setStatus(assignmentToEdit.status || 'pending'); 
                
                // Forbedret datohåndtering
                const formatDateForInput = (dateString) => {
                    if (!dateString) return '';
                    try {
                        const date = new Date(dateString);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    } catch (e) {
                        console.error("Kunne ikke formatere dato:", dateString, e);
                        return '';
                    }
                };

                const formatTimeForInput = (dateString) => {
                    if (!dateString) return '';
                    try {
                        const date = new Date(dateString);
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                    } catch (e) {
                        console.error("Kunne ikke formatere tid:", dateString, e);
                        return '';
                    }
                };
                
                setScheduledDate(formatDateForInput(assignmentToEdit.scheduled_date));
                setScheduledTime(formatTimeForInput(assignmentToEdit.scheduled_date));
                setDeadlineDate(formatDateForInput(assignmentToEdit.deadline_date));
                setOrderId(assignmentToEdit.order || null);
            } else if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setCustomerId(initialData.customer || '');
                if (initialData.customer) fetchElevators(initialData.customer);
                setElevatorId(initialData.elevator || '');
                setAssignedToId(initialData.assigned_to || '');
                setAssignmentType(initialData.assignment_type || '');
                setStatus('pending');
                setScheduledDate('');
                setDeadlineDate('');
                setOrderId(initialData.order || null);
            } else {
                resetFormFields();
            }
            // Hent relevante heiser hvis kunde er forhåndsutfylt
            const prefilledCustomerId = assignmentToEdit?.customer || initialData?.customer;
            if (prefilledCustomerId) {
                 fetchElevators(prefilledCustomerId);
            }
        } else {
            resetFormFields();
            setError('');
            setErrors({});
        }
    }, [isOpen, assignmentToEdit, initialData]);

    // Filtrer heiser når kunde endres
    useEffect(() => {
        if (customerId) {
            console.log("Kunde endret, filtrerer heiser. KundeID:", customerId, "Alle heiser:", elevators);
            const filtered = elevators.filter(elevator => {
                console.log(`Sammenligner heis kunde ID ${elevator.customer} (type: ${typeof elevator.customer}) med valgt kunde ID ${customerId} (type: ${typeof customerId})`);
                // Antar elevator.customer er en ID basert på standard DRF-oppførsel
                return elevator.customer === parseInt(customerId);
            });
            console.log("Filtrerte heiser:", filtered);
            setFilteredElevators(filtered);
            if (elevatorId && !filtered.some(e => e.id === parseInt(elevatorId))) {
                setElevatorId(''); 
            }
        } else {
            setFilteredElevators([]);
            setElevatorId('');
        }
    }, [customerId, elevators, elevatorId]);

    const validateForm = () => {
        let newErrors = {};
        if (!title.trim()) newErrors.title = "Tittel er påkrevd.";
        if (!description.trim()) newErrors.description = "Beskrivelse er påkrevd.";
        if (!customerId) newErrors.customer = "Kunde er påkrevd.";
        if (!elevatorId) newErrors.elevator = "Heis er påkrevd.";
        if (!assignmentType) newErrors.assignmentType = "Type oppdrag er påkrevd.";
        if (!status) newErrors.status = "Status er påkrevd.";
        if (!scheduledDate) newErrors.scheduledDate = "Planlagt dato er påkrevd.";
        if (!scheduledTime) newErrors.scheduledTime = "Planlagt tid er påkrevd.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetFormFields = () => {
        setTitle('');
        setDescription('');
        setCustomerId('');
        setElevatorId('');
        setAssignedToId('');
        setAssignmentType('');
        setStatus('pending');
        setScheduledDate('');
        setScheduledTime('');
        setDeadlineDate('');
        setOrderId(null);
        setErrors({});
    };

    const fetchCustomers = async () => {
        // Implementation of fetchCustomers
    };

    const fetchElevators = async (selectedCustomerId) => {
        // Implementation of fetchElevators
    };

    const fetchTechnicians = async () => {
        // Implementation of fetchTechnicians
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        const scheduledDateTime = scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : null;
        const deadlineDateToSend = deadlineDate || null;

        const assignmentData = {
            title,
            description,
            customer: customerId || null,
            elevator: elevatorId || null,
            assigned_to: assignedToId || null,
            assignment_type: assignmentType,
            status: status,
            scheduled_date: scheduledDateTime,
            deadline_date: deadlineDateToSend,
            order: orderId,
        };

        console.log("Sender oppdragsdata:", assignmentData);

        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const isEditing = !!assignmentToEdit;

            if (isEditing) {
                await axios.put(`${API_URL}${assignmentToEdit.id}/`, assignmentData, config);
            } else {
                await axios.post(API_URL, assignmentData, config);
            }
            
            onAssignmentSaved();
            onClose();

        } catch (err) {
            let errorMsg = `Kunne ikke ${assignmentToEdit ? 'oppdatere' : 'opprette'} oppdrag.`;
            if (err.response && err.response.data) {
                // Detaljert logging av API-feilmeldingen
                console.error("API Error Response:", err.response.data);
                
                const backendErrors = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
                errorMsg += ` Feil: ${backendErrors}`;
            } else if (err.message) {
                errorMsg += ` ${err.message}`;
            }
            setError(errorMsg);
            console.error("Submit Assignment Error:", err.response || err);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={assignmentToEdit ? 'Rediger oppdrag' : 'Legg til nytt oppdrag'}
        >
            <form onSubmit={handleSubmit} className="form">
                {error && <div className="form-error" role="alert">{error}</div>}
                {loadingSelects && <p>Laster valg...</p>}

                {/* --- Form Fields --- */}
                <div className="form-group">
                    <label htmlFor="title">Tittel:</label>
                    <input 
                        type="text" 
                        id="title"
                        placeholder="Tittel på oppdraget" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                        disabled={loadingSelects}
                    />
                    {errors.title && <p className="form-error-text">{errors.title}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Beskrivelse:</label>
                    <textarea
                        id="description"
                        placeholder="Beskrivelse av oppdraget"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        disabled={loadingSelects}
                    />
                    {errors.description && <p className="form-error-text">{errors.description}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="customer">Kunde:</label>
                    <select id="customer" value={customerId} onChange={e => setCustomerId(e.target.value)} required disabled={loadingSelects}>
                        <option value="">-- Velg kunde --</option>
                        {Array.isArray(customers) && customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name}
                        </option>
                        ))}
                    </select>
                    {errors.customer && <p className="form-error-text">{errors.customer}</p>}
                </div>

                {customerId && (
                    <div className="form-group">
                        <label htmlFor="elevator">Heis:</label>
                        <select 
                            id="elevator" 
                            value={elevatorId} 
                            onChange={e => setElevatorId(e.target.value)} 
                            required 
                            disabled={loadingSelects || filteredElevators.length === 0}
                        >
                            <option value="">-- Velg heis --</option>
                            {filteredElevators.length > 0 ? (
                                filteredElevators.map(elevator => (
                                <option key={elevator.id} value={elevator.id}>
                                    {elevator.serial_number} ({elevator.location_description})
                                </option>
                                ))
                            ) : (
                                <option value="" disabled>Ingen heiser funnet for denne kunden</option>
                            )}
                        </select>
                        {errors.elevator && <p className="form-error-text">{errors.elevator}</p>}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="assignmentType">Type oppdrag:</label>
                    <select id="assignmentType" value={assignmentType} onChange={e => setAssignmentType(e.target.value)} required disabled={loadingSelects}>
                        <option value="">-- Velg type --</option>
                        {assignmentTypeChoices.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                        ))}
                    </select>
                    {errors.assignmentType && <p className="form-error-text">{errors.assignmentType}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="scheduledDate">Planlagt dato:</label>
                    <input 
                        type="date" 
                        id="scheduledDate" 
                        value={scheduledDate} 
                        onChange={e => setScheduledDate(e.target.value)} 
                        required 
                        disabled={loadingSelects}
                    />
                    {errors.scheduledDate && <p className="form-error-text">{errors.scheduledDate}</p>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="scheduledTime">Planlagt tid:</label>
                    <input 
                        type="time" 
                        id="scheduledTime" 
                        value={scheduledTime} 
                        onChange={e => setScheduledTime(e.target.value)} 
                        required 
                        disabled={loadingSelects}
                    />
                    {errors.scheduledTime && <p className="form-error-text">{errors.scheduledTime}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="deadlineDate">Frist (valgfritt):</label>
                    <input 
                        type="date" 
                        id="deadlineDate" 
                        value={deadlineDate} 
                        onChange={e => setDeadlineDate(e.target.value)} 
                        disabled={loadingSelects}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="user">Tildelt bruker:</label>
                    <select id="user" value={assignedToId} onChange={e => setAssignedToId(e.target.value)} disabled={loadingSelects}>
                        <option value="">-- Ikke tildelt --</option>
                        {Array.isArray(users) && users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status:</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value)} required disabled={loadingSelects}>
                        {statusChoices.map(choice => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label} 
                            </option>
                        ))}
                    </select>
                    {errors.status && <p className="form-error-text">{errors.status}</p>}
                </div>
                {/* --- End Form Fields --- */}

                <button type="submit" className="btn btn-primary" disabled={isLoading || loadingSelects}>
                    {isLoading ? 'Lagrer...' : (assignmentToEdit ? 'Oppdater oppdrag' : 'Opprett oppdrag')}
                </button>
            </form>
        </Modal>
    );
};

export default AddAssignmentModal; 