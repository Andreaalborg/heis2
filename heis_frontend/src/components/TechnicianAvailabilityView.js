import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// Importer CSS-filen
import '../styles/TechnicianAvailability.css';

// Hjelpefunksjon for å formatere dato til YYYY-MM-DD
const formatDateISO = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

// Hjelpefunksjon for å få dato X dager frem/tilbake
const getDateOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const TechnicianAvailabilityView = () => {
    // State for datovalg (default til neste 7 dager)
    const [startDate, setStartDate] = useState(formatDateISO(new Date()));
    const [endDate, setEndDate] = useState(formatDateISO(getDateOffset(7)));
    
    // State for hentet data
    const [technicians, setTechnicians] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [absences, setAbsences] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Effekt for å hente data når datoer endres
    useEffect(() => {
        if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
            fetchAllData(startDate, endDate);
        }
    }, [startDate, endDate]);

    const fetchAllData = async (start, end) => {
        setIsLoading(true);
        setError('');
        console.log(`Henter data for ${start} til ${end}`);

        const ASSIGNMENTS_API_URL = 'http://127.0.0.1:8000/api/assignments/';
        const ABSENCES_API_URL = 'http://127.0.0.1:8000/api/absences/';
        const USERS_API_URL = 'http://127.0.0.1:8000/api/users/';

        // Bygger URLer med dato-filtrering (antar backend støtter dette - MÅ VERIFISERES/LEGGES TIL)
        // Viktig: Backend må kunne filtrere på datoområder for assignments og absences
        // Eksempel: /api/assignments/?scheduled_date__gte=YYYY-MM-DD&scheduled_date__lte=YYYY-MM-DD
        // Vi trenger også å hente brukere som er teknikere
        const assignmentsUrl = `${ASSIGNMENTS_API_URL}?scheduled_date__gte=${start}&scheduled_date__lte=${end}`; 
        const absencesUrl = `${ABSENCES_API_URL}?end_date__gte=${start}&start_date__lte=${end}`; // Filter for overlapp
        const usersUrl = `${USERS_API_URL}?role=tekniker`; // Henter kun teknikere

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            
            const [assignmentRes, absenceRes, userRes] = await Promise.all([
                axios.get(assignmentsUrl, config),
                axios.get(absencesUrl, config),
                axios.get(usersUrl, config)
            ]);

            setAssignments(assignmentRes.data.results || assignmentRes.data);
            setAbsences(absenceRes.data.results || absenceRes.data);
            setTechnicians(userRes.data.results || userRes.data);
            console.log('Data hentet:', { 
                assignments: assignmentRes.data.results || assignmentRes.data,
                absences: absenceRes.data.results || absenceRes.data,
                technicians: userRes.data.results || userRes.data 
            });

        } catch (err) {
            console.error('Feil ved henting av tilgjengelighetsdata:', err.response || err.message);
            setError('Kunne ikke hente nødvendig data for tilgjengelighet.');
            setAssignments([]);
            setAbsences([]);
            setTechnicians([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ----- Prosesserer hentet data for å bygge tilgjengelighetsmatrise ----- 
    const availabilityData = useMemo(() => {
        if (!technicians.length || (!assignments.length && !absences.length) || !startDate || !endDate) {
            return {};
        }
        console.log("Prosesserer data for tilgjengelighet...");

        const availability = {};
        const start = new Date(startDate + 'T00:00:00'); // Sikrer start på dagen
        const end = new Date(endDate + 'T00:00:00');   // Sikrer start på dagen

        // Initialiser struktur for hver tekniker
        technicians.forEach(tech => {
            availability[tech.id] = {};
        });

        // Gå gjennom hver dag i tidsrommet
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const currentDateStr = formatDateISO(currentDate);
            
            // Initialiser dagen for hver tekniker
            technicians.forEach(tech => {
                availability[tech.id][currentDateStr] = { status: 'free', details: [] };
            });

            // Sjekk fravær for denne dagen
            absences.forEach(absence => {
                const absenceStart = new Date(absence.start_date + 'T00:00:00');
                const absenceEnd = new Date(absence.end_date + 'T00:00:00');
                if (currentDate >= absenceStart && currentDate <= absenceEnd) {
                    if (availability[absence.user] && availability[absence.user][currentDateStr]) {
                        availability[absence.user][currentDateStr] = { 
                            status: 'absence', 
                            details: [`Fravær: ${absence.absence_type_display}`] 
                        };
                    }
                }
            });

            // Sjekk oppdrag for denne dagen (kun for de som ikke allerede har fravær)
            assignments.forEach(assignment => {
                // Sikrer at scheduled_date er gyldig
                if (!assignment.scheduled_date) return;
                
                const assignmentStart = new Date(assignment.scheduled_date);
                // Bruker deadline for å definere slutt, ellers bare startdagen
                const assignmentEnd = assignment.deadline_date ? new Date(assignment.deadline_date + 'T23:59:59') : new Date(assignmentStart.toISOString().split('T')[0] + 'T23:59:59');
                
                const techId = assignment.assigned_to;
                
                // Sjekker om dagen faller innenfor oppdragsperioden OG om teknikeren ikke har fravær
                if (techId && availability[techId] && availability[techId][currentDateStr]?.status !== 'absence' && 
                    currentDate >= new Date(assignmentStart.toISOString().split('T')[0] + 'T00:00:00') && 
                    currentDate <= assignmentEnd) 
                {
                    availability[techId][currentDateStr].status = 'busy_assignment';
                    availability[techId][currentDateStr].details.push(`Oppdrag: ${assignment.title}`);
                }
            });

            // Gå til neste dag
            currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log("Prosessert availability:", availability);
        return availability;
    }, [technicians, assignments, absences, startDate, endDate]);
    // ------------------------------------------------------------------------
    
    // Hjelpefunksjon for å få alle datoer i range (til tabell-header)
    const getDateRange = (startStr, endStr) => {
        const dates = [];
        let current = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        while (current <= end) {
            dates.push(formatDateISO(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };
    const dateColumns = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);

    return (
        <div className="container mt-4">
            <h1>Teknikertilgjengelighet</h1>

            <div className="row mb-3 align-items-end">
                <div className="col-md-4">
                    <label htmlFor="start-date" className="form-label">Startdato</label>
                    <input 
                        type="date" 
                        id="start-date" 
                        className="form-control" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <label htmlFor="end-date" className="form-label">Sluttdato</label>
                    <input 
                        type="date" 
                        id="end-date" 
                        className="form-control" 
                        value={endDate} 
                        min={startDate} // Sluttdato kan ikke være før startdato
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                {/* Kan legge til knapp for å trigge henting manuelt hvis ønskelig */} 
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster tilgjengelighetsdata...</p>}

            {/* ----- VISUALISERING ----- */} 
            <div className="availability-display mt-4 table-responsive">
                <h2>Oversikt ({formatDateISO(new Date(startDate))} - {formatDateISO(new Date(endDate))})</h2>
                {!isLoading && technicians.length === 0 && <p>Ingen teknikere funnet.</p>}
                
                {!isLoading && technicians.length > 0 && (
                    <table className="table table-bordered table-sm availability-table">
                        <thead>
                            <tr>
                                <th className="technician-header">Tekniker</th>
                                {dateColumns.map(dateStr => (
                                    <th key={dateStr} className="date-header">
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('no-NO', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {technicians.map(tech => (
                                <tr key={tech.id}>
                                    <td className="technician-name">{tech.username}</td>
                                    {dateColumns.map(dateStr => {
                                        const dayData = availabilityData[tech.id]?.[dateStr];
                                        let cellClass = 'status-free';
                                        let cellContent = 'Ledig';
                                        let cellTitle = ''; // For tooltip

                                        if (dayData?.status === 'absence') {
                                            cellClass = 'status-absence';
                                            cellContent = dayData.details[0] || 'Fravær';
                                            cellTitle = cellContent;
                                        } else if (dayData?.status === 'busy_assignment') {
                                            cellClass = 'status-busy';
                                            cellContent = `${dayData.details.length} oppdrag`; // Viser antall oppdrag
                                            cellTitle = dayData.details.join('\n'); // Viser detaljer på hover
                                        }
                                        
                                        return (
                                            <td key={`${tech.id}-${dateStr}`} className={`availability-cell ${cellClass}`} title={cellTitle}>
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* ------------------------- */} 
        </div>
    );
};

export default TechnicianAvailabilityView; 