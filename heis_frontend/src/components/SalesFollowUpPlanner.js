import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/SalesFollowUpPlanner.css';

const SalesFollowUpPlanner = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [followUpTasks, setFollowUpTasks] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOption, setSortOption] = useState('nextAction');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        reminder_date: '',
        completed: false
    });
    const navigate = useNavigate();

    // Faste statusfiltre
    const statusFilters = [
        { id: 'all', label: 'Alle muligheter' },
        { id: 'new', label: 'Nye leads' },
        { id: 'contacted', label: 'Kontaktet' },
        { id: 'proposal', label: 'Tilbud sendt' },
        { id: 'negotiation', label: 'Forhandling' },
        { id: 'won', label: 'Vunnet' },
        { id: 'due-today', label: 'Oppfølging i dag' },
        { id: 'overdue', label: 'Forsinket' }
    ];

    // Sorteringsalternativer
    const sortOptions = [
        { id: 'nextAction', label: 'Neste oppfølging' },
        { id: 'newest', label: 'Nyeste først' },
        { id: 'value', label: 'Høyeste verdi' },
        { id: 'name', label: 'Kundenavn' }
    ];

    // Oppgavetyper for rask opprettelse
    const taskTemplates = [
        { title: 'Følg opp etter tilbud', description: 'Ring kunden for å følge opp det sendte tilbudet', days: 3 },
        { title: 'Første kontakt', description: 'Ring og introduser produktene våre', days: 1 },
        { title: 'Send produktinformasjon', description: 'Send informasjonsbrosjyrer om våre heistyper', days: 2 },
        { title: 'Avtal befaring', description: 'Avtal tid for befaring på anlegget', days: 5 },
        { title: 'Send revidert tilbud', description: 'Forbered og send revidert tilbud basert på tilbakemelding', days: 2 }
    ];

    useEffect(() => {
        fetchOpportunities();
    }, []);

    useEffect(() => {
        if (selectedOpportunity) {
            fetchFollowUpTasks(selectedOpportunity.id);
        } else {
            setFollowUpTasks([]);
        }
    }, [selectedOpportunity]);

    const fetchOpportunities = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/sales-opportunities/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            const fetchedData = response.data.results || response.data;
            setOpportunities(Array.isArray(fetchedData) ? fetchedData : []);
        } catch (err) {
            console.error('Feil ved henting av salgsmuligheter:', err);
            setError('Kunne ikke hente salgsmuligheter');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFollowUpTasks = async (opportunityId) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Dette er et eksempel - endepunktet må implementeres i backend
            const response = await axios.get(`http://localhost:8000/api/sales-opportunities/${opportunityId}/follow-up-tasks/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const fetchedTasks = response.data.results || response.data;
            setFollowUpTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
        } catch (err) {
            console.error('Feil ved henting av oppfølgingsoppgaver:', err);
            // Midlertidig: Bruk dummy-data hvis endepunktet ikke finnes
            const dummyTasks = [
                {
                    id: 1,
                    opportunity: opportunityId,
                    title: 'Ring om tilbudet',
                    description: 'Følg opp tilbudet som ble sendt forrige uke',
                    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // i morgen
                    reminder_date: new Date().toISOString().split('T')[0], // i dag
                    completed: false,
                    created_at: new Date(Date.now() - 604800000).toISOString() // for en uke siden
                },
                {
                    id: 2,
                    opportunity: opportunityId,
                    title: 'Send produktbrosjyrer',
                    description: 'Send over detaljerte produktinformasjon om produktmodellene',
                    due_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // to dager siden
                    reminder_date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // tre dager siden
                    completed: true,
                    created_at: new Date(Date.now() - 1209600000).toISOString() // for to uker siden
                }
            ];
            setFollowUpTasks(dummyTasks);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!selectedOpportunity) return;

        const taskData = {
            ...newTask,
            opportunity: selectedOpportunity.id
        };

        try {
            const token = localStorage.getItem('token');
            // Dette er et eksempel - endepunktet må implementeres i backend
            const response = await axios.post(`http://localhost:8000/api/sales-follow-up-tasks/`, taskData, {
                headers: { 'Authorization': `Token ${token}` }
            });

            // Oppdater task list med ny oppgave
            const createdTask = response.data;
            setFollowUpTasks(prev => [...prev, createdTask]);

            // Reset skjema
            setNewTask({
                title: '',
                description: '',
                due_date: new Date().toISOString().split('T')[0],
                reminder_date: '',
                completed: false
            });
        } catch (err) {
            console.error('Feil ved opprettelse av oppgave:', err);
            // For demo: Legg til lokalt uten server
            const dummyId = Math.floor(Math.random() * 10000);
            const dummyTask = {
                id: dummyId,
                ...taskData,
                created_at: new Date().toISOString(),
                completed: false
            };
            setFollowUpTasks(prev => [...prev, dummyTask]);
            setNewTask({
                title: '',
                description: '',
                due_date: new Date().toISOString().split('T')[0],
                reminder_date: '',
                completed: false
            });
        }
    };

    const handleApplyTemplate = (template) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + template.days);
        
        setNewTask({
            title: template.title,
            description: template.description,
            due_date: dueDate.toISOString().split('T')[0],
            reminder_date: new Date().toISOString().split('T')[0], // standard påminnelse i dag
            completed: false
        });
    };

    const handleToggleTaskComplete = async (taskId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            // Dette er et eksempel - endepunktet må implementeres i backend
            await axios.patch(`http://localhost:8000/api/sales-follow-up-tasks/${taskId}/`, 
                { completed: !currentStatus },
                { headers: { 'Authorization': `Token ${token}` } }
            );
            
            // Oppdater lokalt
            setFollowUpTasks(prev => 
                prev.map(task => 
                    task.id === taskId ? {...task, completed: !currentStatus} : task
                )
            );
        } catch (err) {
            console.error('Feil ved oppdatering av oppgavestatus:', err);
            // For demo: Oppdater lokalt uten server
            setFollowUpTasks(prev => 
                prev.map(task => 
                    task.id === taskId ? {...task, completed: !currentStatus} : task
                )
            );
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Er du sikker på at du vil slette denne oppgaven?')) return;
        
        try {
            const token = localStorage.getItem('token');
            // Dette er et eksempel - endepunktet må implementeres i backend
            await axios.delete(`http://localhost:8000/api/sales-follow-up-tasks/${taskId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            // Fjern fra lokal liste
            setFollowUpTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (err) {
            console.error('Feil ved sletting av oppgave:', err);
            // For demo: Fjern lokalt uten server
            setFollowUpTasks(prev => prev.filter(task => task.id !== taskId));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filterOpportunities = () => {
        if (filterStatus === 'all') return opportunities;
        
        const today = new Date().toISOString().split('T')[0];
        
        if (filterStatus === 'due-today' || filterStatus === 'overdue') {
            // Dette ville normalt gjøres på server-side med en dedikert API
            // Her simulerer vi det med lokal filtrering
            return opportunities.filter(opp => {
                const hasTasks = followUpTasks.some(task => {
                    if (filterStatus === 'due-today') {
                        return task.due_date === today && !task.completed;
                    } else { // overdue
                        return task.due_date < today && !task.completed;
                    }
                });
                return hasTasks;
            });
        }
        
        return opportunities.filter(opp => opp.status === filterStatus);
    };

    const sortOpportunities = (filteredOpps) => {
        return [...filteredOpps].sort((a, b) => {
            switch (sortOption) {
                case 'nextAction':
                    // Sorter basert på neste oppfølgingsdato
                    // Dette ville normalt gjøres på server-side
                    return 0; // Placeholder
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'value':
                    return (b.estimated_value || 0) - (a.estimated_value || 0);
                case 'name':
                    return a.customer_name?.localeCompare(b.customer_name) || 0;
                default:
                    return 0;
            }
        });
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'new': 'Ny',
            'contacted': 'Kontaktet',
            'proposal': 'Tilbud sendt',
            'negotiation': 'Forhandling',
            'won': 'Vunnet',
            'lost': 'Tapt'
        };
        return statusMap[status] || status;
    };
    
    const getStatusClass = (status) => {
        const classMap = {
            'new': 'badge-info',
            'contacted': 'badge-primary',
            'proposal': 'badge-warning',
            'negotiation': 'badge-secondary',
            'won': 'badge-success',
            'lost': 'badge-danger'
        };
        return classMap[status] || 'badge-light';
    };

    const getTaskStatusClass = (task) => {
        if (task.completed) return 'completed-task';
        
        const today = new Date().toISOString().split('T')[0];
        const dueDate = task.due_date;
        
        if (dueDate < today) return 'overdue-task';
        if (dueDate === today) return 'due-today-task';
        return '';
    };

    const filteredOpportunities = filterOpportunities();
    const sortedOpportunities = sortOpportunities(filteredOpportunities);

    return (
        <div className="sales-follow-up-container">
            <h2>Oppfølgingsplan</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Salgsmuligheter</h5>
                            <div className="d-flex">
                                <select 
                                    className="form-select me-2"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    {statusFilters.map(filter => (
                                        <option key={filter.id} value={filter.id}>{filter.label}</option>
                                    ))}
                                </select>
                                <select 
                                    className="form-select"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="card-body opportunities-list">
                            {isLoading && <p>Laster salgsmuligheter...</p>}
                            
                            {!isLoading && sortedOpportunities.length === 0 && (
                                <p className="text-muted">Ingen salgsmuligheter funnet med disse filtrene.</p>
                            )}
                            
                            {sortedOpportunities.map(opportunity => (
                                <div 
                                    key={opportunity.id} 
                                    className={`opportunity-item ${selectedOpportunity?.id === opportunity.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedOpportunity(opportunity)}
                                >
                                    <div className="opportunity-header">
                                        <h6>{opportunity.name}</h6>
                                        <span className={`status-badge ${getStatusClass(opportunity.status)}`}>
                                            {getStatusLabel(opportunity.status)}
                                        </span>
                                    </div>
                                    <div className="opportunity-details">
                                        <span>Kunde: {opportunity.customer_name}</span>
                                        {opportunity.estimated_value && (
                                            <span className="opportunity-value">{opportunity.estimated_value} kr</span>
                                        )}
                                    </div>
                                    <div className="opportunity-meta">
                                        <span>Opprettet: {new Date(opportunity.created_at).toLocaleDateString()}</span>
                                        <span className="action-links">
                                            <button 
                                                className="btn btn-sm btn-link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/sales-opportunities/${opportunity.id}`);
                                                }}
                                            >
                                                Detaljer
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                {selectedOpportunity 
                                    ? `Oppfølging for: ${selectedOpportunity.name}`
                                    : 'Velg en salgsmulighet for å se oppfølgingsplan'}
                            </h5>
                        </div>
                        
                        {selectedOpportunity && (
                            <div className="card-body">
                                <div className="task-templates mb-3">
                                    <h6>Hurtigoppgaver:</h6>
                                    <div className="template-buttons">
                                        {taskTemplates.map((template, index) => (
                                            <button 
                                                key={index}
                                                className="btn btn-sm btn-outline-primary me-2 mb-2"
                                                onClick={() => handleApplyTemplate(template)}
                                            >
                                                {template.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <form onSubmit={handleCreateTask} className="mb-4">
                                    <div className="mb-3">
                                        <input 
                                            type="text"
                                            className="form-control"
                                            placeholder="Oppgavetittel"
                                            name="title"
                                            value={newTask.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <textarea 
                                            className="form-control"
                                            placeholder="Beskrivelse av oppgaven"
                                            name="description"
                                            value={newTask.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                        ></textarea>
                                    </div>
                                    
                                    <div className="row mb-3">
                                        <div className="col">
                                            <label className="form-label">Frist</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                name="due_date"
                                                value={newTask.due_date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col">
                                            <label className="form-label">Påminnelse</label>
                                            <input 
                                                type="date"
                                                className="form-control"
                                                name="reminder_date"
                                                value={newTask.reminder_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="btn btn-primary">
                                        Legg til oppfølgingsoppgave
                                    </button>
                                </form>
                                
                                <h6>Oppfølgingsoppgaver ({followUpTasks.length})</h6>
                                
                                {isLoading && <p>Laster oppfølgingsoppgaver...</p>}
                                
                                {!isLoading && followUpTasks.length === 0 && (
                                    <p className="text-muted">Ingen oppfølgingsoppgaver lagt til ennå.</p>
                                )}
                                
                                <div className="tasks-list">
                                    {followUpTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className={`task-item ${getTaskStatusClass(task)}`}
                                        >
                                            <div className="task-status">
                                                <input 
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={task.completed}
                                                    onChange={() => handleToggleTaskComplete(task.id, task.completed)}
                                                />
                                            </div>
                                            <div className="task-content">
                                                <div className="task-title">{task.title}</div>
                                                <div className="task-description">{task.description}</div>
                                                <div className="task-dates">
                                                    <span>Frist: {new Date(task.due_date).toLocaleDateString()}</span>
                                                    {task.reminder_date && (
                                                        <span>Påminnelse: {new Date(task.reminder_date).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="task-actions">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    <i className="far fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesFollowUpPlanner; 