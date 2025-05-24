import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api'; // <--- IMPORTER APIKLIENTEN
import AddAssignmentModal from './AddAssignmentModal';
import ElevatorProcedureModal from './ElevatorProcedureModal';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);

  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [selectedAssignmentForProcedure, setSelectedAssignmentForProcedure] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const API_URL = `${API_BASE_URL}/api/assignments/`;

  const statusChoices = [
      { value: 'pending', label: 'Venter' },
      { value: 'in_progress', label: 'Pågår' },
      { value: 'completed', label: 'Fullført' },
      { value: 'cancelled', label: 'Kansellert' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Token ${token}` } };

        const [assignmentRes, customerRes, userRes] = await Promise.all([
            axios.get(API_URL, config),
            axios.get('/api/customers/', config),
            axios.get('/api/users/', config)
        ]);

        setAssignments(assignmentRes.data.results || assignmentRes.data);
        setCustomers(customerRes.data.results || customerRes.data);
        setUsers(userRes.data.results || userRes.data);

    } catch (err) {
        setError('Kunne ikke hente nødvendig data.');
        console.error("Fetch Initial Data Error:", err);
        setAssignments([]);
        setCustomers([]);
        setUsers([]);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchAssignmentsOnly = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_URL, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        setAssignments(response.data.results || response.data);
      } catch (err) {
        setError('Kunne ikke oppdatere oppdragslisten.');
        console.error("Fetch Assignments Only Error:", err);
      } finally {
          setIsLoading(false);
      }
  };

  const deleteAssignment = async (id) => {
    if (window.confirm('Er du sikker på at du vil slette dette oppdraget?')) {
      const originalAssignments = [...assignments];
      setAssignments(assignments.filter(a => a.id !== id));
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}${id}/`, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
      } catch (err) {
        setError('Kunne ikke slette oppdrag. Prøv å laste siden på nytt.');
        console.error("Delete Assignment Error:", err);
        setAssignments(originalAssignments);
      }
    }
  };

  const handleOpenAddModal = () => {
      setEditingAssignment(null);
      setIsModalOpen(true);
  };

  const handleOpenEditModal = (assignment) => {
      setEditingAssignment(assignment);
      setIsModalOpen(true);
  };

  const handleOpenProcedureModal = (assignment) => {
      if (assignment.elevator) {
          setSelectedAssignmentForProcedure(assignment);
          setIsProcedureModalOpen(true);
      } else {
          alert("Dette oppdraget er ikke knyttet til en spesifikk heis.");
      }
  };

  const handleAssignmentSaved = () => {
      fetchAssignmentsOnly();
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Ukjent';
  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? (user.first_name ? `${user.first_name} ${user.last_name}` : user.username) : 'Ikke tildelt';
  }
  const getStatusLabel = (value) => statusChoices.find(s => s.value === value)?.label || value;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('no-NO', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch (e) {
      console.error("Kunne ikke formatere dato:", dateString);
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      console.error("Kunne ikke formatere tid:", dateString);
      return '-';
    }
  };

  return (
    <div className="assignments-container">
      <h1>Oppdrag</h1>
      <button className="button is-primary mb-4" onClick={handleOpenAddModal}>Nytt oppdrag</button>

      {error && <div className="notification is-danger" role="alert">{error}</div>}
      {isLoading && <div className="loading-indicator">Laster oppdrag...</div>}

      <div className="table-container">
        <table className="table is-striped is-hoverable is-fullwidth">
            <thead>
                <tr>
                    <th>Tittel</th>
                    <th>Beskrivelse</th>
                    <th>Kunde</th>
                    <th>Heis</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Tildelt</th>
                    <th>Planlagt Dato</th>
                    <th>Planlagt Tid</th>
                    <th>Frist</th>
                    <th>Handlinger</th>
                </tr>
            </thead>
            <tbody>
                {Array.isArray(assignments) && assignments.map(assignment => (
                    <tr key={assignment.id}>
                        <td>{assignment.title}</td>
                        <td>{assignment.description || '-'}</td>
                        <td>{assignment.customer ? getCustomerName(assignment.customer) : '-'}</td>
                        <td>{assignment.elevator || '-'}</td>
                        <td>{assignment.assignment_type}</td>
                        <td>{getStatusLabel(assignment.status)}</td>
                        <td>{assignment.assigned_to ? getUserName(assignment.assigned_to) : '-'}</td>
                        <td>{formatDate(assignment.scheduled_date)}</td>
                        <td>{formatTime(assignment.scheduled_date)}</td>
                        <td>{formatDate(assignment.deadline_date)}</td>
                        <td>
                            <button 
                                onClick={() => handleOpenProcedureModal(assignment)} 
                                className="button is-info is-small mr-2" 
                                disabled={isLoading || !assignment.elevator}
                                title={!assignment.elevator ? "Oppdraget mangler heis" : "Vis heis-prosedyre"}
                              >
                                <span className="icon is-small"><i className="fas fa-elevator"></i></span>
                                <span>Vis Heis</span>
                            </button>
                            <button 
                                onClick={() => handleOpenEditModal(assignment)} 
                                className="button is-warning is-small mr-2" 
                                disabled={isLoading}
                              >
                                <span className="icon is-small"><i className="fas fa-edit"></i></span>
                                <span>Rediger</span>
                            </button>
                            <button 
                                onClick={() => deleteAssignment(assignment.id)} 
                                className="button is-danger is-small" 
                                disabled={isLoading}
                              >
                                <span className="icon is-small"><i className="fas fa-trash"></i></span>
                                <span>Slett</span>
                            </button>
                        </td>
                    </tr>
                ))}
                {Array.isArray(assignments) && assignments.length === 0 && !isLoading && (
                    <tr>
                        <td colSpan="11" className="has-text-centered">Ingen oppdrag funnet.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      <AddAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssignmentSaved={handleAssignmentSaved}
        assignmentToEdit={editingAssignment}
      />

      {selectedAssignmentForProcedure && (
        <ElevatorProcedureModal
          isOpen={isProcedureModalOpen}
          onClose={() => setIsProcedureModalOpen(false)}
          assignment={selectedAssignmentForProcedure}
        />
      )}
    </div>
  );
}

export default Assignments;