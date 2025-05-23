import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [allAssignments, setAllAssignments] = useState([]);
    const [customers, setCustomers] = useState({});
    const [users, setUsers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [stats, setStats] = useState({
        activeTotal: 0,
        assignedToMe: 0,
        statusNew: 0,
        statusInProgress: 0,
        dueSoon: 0,
    });
    
    const statusChoices = [
        { value: 'ny', label: 'Ny' },
        { value: 'tildelt', label: 'Tildelt' },
        { value: 'påbegynt', label: 'Påbegynt' },
        { value: 'ferdig', label: 'Ferdig' },
        { value: 'fakturert', label: 'Fakturert' },
    ];

    // Flytt fetchDashboardData ut hit
    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
            setIsLoading(false);
            setError("Ingen gyldig token funnet. Prøv å logge inn på nytt.");
            return;
        }
        
        let currentUserInfo = null;
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                currentUserInfo = JSON.parse(userString);
                setUserInfo(currentUserInfo);
            }
            
            const config = { headers: { 'Authorization': `Token ${token}` } };

            const [customerRes, userRes, assignmentRes] = await Promise.all([
                axios.get('http://localhost:8000/api/customers/', config),
                axios.get('http://localhost:8000/api/users/', config),
                axios.get('http://localhost:8000/api/assignments/?ordering=scheduled_date,scheduled_time', config)
            ]);

            const customerMap = (customerRes.data.results || customerRes.data).reduce((acc, customer) => {
                acc[customer.id] = customer.name;
                return acc;
            }, {});
            setCustomers(customerMap);

            const userMap = (userRes.data.results || userRes.data).reduce((acc, user) => {
                acc[user.id] = user.first_name ? `${user.first_name} ${user.last_name}` : user.username;
                return acc;
            }, {});
            setUsers(userMap);
            
            const assignmentsData = assignmentRes.data.results || assignmentRes.data;
            setAllAssignments(assignmentsData);

            calculateStats(assignmentsData, currentUserInfo);
            
        } catch (err) {
            console.error('Feil ved henting av dashboarddata:', err.response || err);
            setError('Kunne ikke hente dashboarddata. Sjekk konsollen for detaljer.');
            setAllAssignments([]);
            setCustomers({});
            setUsers({});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Kall funksjonen ved første lasting
        fetchDashboardData();
    }, []); // Tom dependency array sikrer at den kun kjører én gang ved mount

    const calculateStats = (assignments, currentUser) => {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        let activeTotal = 0;
        let assignedToMe = 0;
        let statusNew = 0;
        let statusInProgress = 0;
        let dueSoon = 0;

        assignments.forEach(a => {
            const isCompleted = a.status === 'ferdig' || a.status === 'fakturert';
            
            if (!isCompleted) {
                activeTotal++;
            }
            if (!isCompleted && a.assigned_to === currentUser?.id) {
                assignedToMe++;
            }
            if (a.status === 'ny') {
                statusNew++;
            }
            if (a.status === 'påbegynt') {
                statusInProgress++;
            }
            const deadline = a.deadline_date ? new Date(a.deadline_date) : null;
            const scheduled = new Date(a.scheduled_date);
            const relevantDate = deadline || scheduled;

            if (!isCompleted && relevantDate <= oneWeekFromNow && relevantDate >= now) {
                 dueSoon++;
            }
        });

        setStats({
            activeTotal,
            assignedToMe,
            statusNew,
            statusInProgress,
            dueSoon,
        });
    };
    
    const getStatusClass = (status) => {
        switch(status) {
            case 'ny': return 'status-new';
            case 'tildelt': return 'status-assigned';
            case 'påbegynt': return 'status-in-progress';
            case 'ferdig': return 'status-completed';
            case 'fakturert': return 'status-invoiced';
            default: return '';
        }
    };

    const getStatusLabel = (value) => statusChoices.find(s => s.value === value)?.label || value;

    // Datofunksjoner (lik Assignments.js)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('no-NO', { 
            year: 'numeric', month: '2-digit', day: '2-digit' 
          });
        } catch (e) { return dateString; }
    };
    
    const formatTime = (dateString) => {
        if (!dateString) return '-';
        try {
          const date = new Date(dateString);
          return date.toLocaleTimeString('no-NO', { 
            hour: '2-digit', minute: '2-digit' 
          });
        } catch (e) { return '-'; }
    };

    const filteredAndLimitedAssignments = useMemo(() => {
        const activeAssignments = allAssignments.filter(a => a.status !== 'ferdig' && a.status !== 'fakturert');
        
        if (!searchTerm) {
            return activeAssignments.slice(0, 10);
        }
        
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return activeAssignments.filter(assignment => 
            assignment.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            (customers[assignment.customer] && customers[assignment.customer].toLowerCase().includes(lowerCaseSearchTerm))
        ).slice(0, 10);

    }, [allAssignments, searchTerm, customers]);

    if (isLoading) {
        return <div className="loading-container">Laster dashboard...</div>;
    }
    
    if (error) {
        return <div className="error-container">{error}</div>;
    }
    
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Velkommen {userInfo?.first_name || userInfo?.username}!</h1>
                <button onClick={fetchDashboardData} className="btn btn-sm btn-secondary" disabled={isLoading}>
                    {isLoading ? 'Oppdaterer...' : 'Oppdater'}
                </button>
            </div>
            
            <div className="dashboard-grid stats-grid">
                 <div className="dashboard-card stat-card">
                    <div className="stat-value">{stats.activeTotal}</div>
                    <div className="stat-label">Aktive Oppdrag</div>
                 </div>
                 <div className="dashboard-card stat-card">
                     <div className="stat-value">{stats.assignedToMe}</div>
                     <div className="stat-label">Mine Aktive</div>
                 </div>
                 <div className="dashboard-card stat-card">
                     <div className="stat-value">{stats.statusNew}</div>
                     <div className="stat-label">Nye Oppdrag</div>
                 </div>
                 <div className="dashboard-card stat-card">
                     <div className="stat-value">{stats.statusInProgress}</div>
                     <div className="stat-label">Pågående</div>
                 </div>
                 <div className="dashboard-card stat-card stat-card-highlight">
                     <div className="stat-value">{stats.dueSoon}</div>
                     <div className="stat-label">Nær Frist (7 dager)</div>
                 </div>
            </div>
            
            <div className="dashboard-card upcoming-assignments-card">
                <div className="card-header">
                    <h2>Kommende Oppdrag</h2>
                    <div className="header-controls">
                        <input 
                            type="text"
                            placeholder="Søk i tittel/kunde..."
                            className="form-control form-control-sm search-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Link to="/assignments" className="view-all-link">Se alle</Link> 
                    </div>
                </div>
                <div className="card-content">
                    {filteredAndLimitedAssignments.length === 0 ? (
                        <p className="no-data">{searchTerm ? 'Ingen treff på søket.' : 'Ingen aktive kommende oppdrag funnet.'}</p>
                    ) : (
                        <table className="table table-sm table-hover dashboard-table">
                            <thead>
                                <tr>
                                    <th>Dato</th>
                                    <th>Tid</th>
                                    <th>Tittel</th>
                                    <th>Kunde</th>
                                    <th>Tildelt</th>
                                    <th>Status</th>
                                    <th>Frist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndLimitedAssignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>{formatDate(assignment.scheduled_date)}</td>
                                        <td>{formatTime(assignment.scheduled_date)}</td>
                                        <td>{assignment.title}</td>
                                        <td>{customers[assignment.customer] || '-'}</td>
                                        <td>{users[assignment.assigned_to] || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusClass(assignment.status)}`}>
                                                {getStatusLabel(assignment.status)}
                                            </span>
                                        </td>
                                         <td>{formatDate(assignment.deadline_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard; 