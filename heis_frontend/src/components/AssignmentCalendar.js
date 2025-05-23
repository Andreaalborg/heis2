import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import nbLocale from '@fullcalendar/core/locales/nb'; 
// Importer ressurs-plugins
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import AddAssignmentModal from './AddAssignmentModal'; 
import '../styles/AssignmentCalendar.css'; // Custom styles for the calendar if needed

// Funksjon for å få farge basert på status
const getStatusColor = (status) => {
    switch (status) {
        // Bruker backend sine status-verdier
        case 'pending': return '#ffc107'; // Bootstrap Warning Yellow (tidl. oransje)
        case 'in_progress': return '#0d6efd'; // Bootstrap Primary Blue (tidl. brunlig)
        case 'completed': return '#198754'; // Bootstrap Success Green (tidl. grønn)
        case 'cancelled': return '#6c757d'; // Bootstrap Secondary Gray (tidl. lysere grå)
        default: return '#343a40'; // Mørk Grå (default)
    }
};

const AssignmentCalendar = () => {
    const [assignmentEvents, setAssignmentEvents] = useState([]);
    const [absenceEvents, setAbsenceEvents] = useState([]);
    const [resources, setResources] = useState([]); // State for ressurser (brukere)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [modalInitialDate, setModalInitialDate] = useState(null);

    // Henter brukerinfo fra localStorage
    let userRole = null;
    let userId = null;
    try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            userRole = storedUser.role;
            userId = storedUser.id;
        }
    } catch (e) {
        console.error("Kunne ikke parse brukerdata fra localStorage", e);
    }

    const ASSIGNMENTS_API_URL = 'http://127.0.0.1:8000/api/assignments/';
    const ABSENCES_API_URL = 'http://127.0.0.1:8000/api/absences/';
    const USERS_API_URL = 'http://127.0.0.1:8000/api/users/'; // URL for brukere

    // Henter oppdrag, fravær OG brukere
    const fetchDataForCalendar = async () => {
        setIsLoading(true);
        setError(null);
        
        let assignmentsUrl = ASSIGNMENTS_API_URL;
        if (userRole === 'tekniker' && userId) {
            assignmentsUrl += `?assigned_to=${userId}`;
        }
        
        let absencesUrl = ABSENCES_API_URL;
        // TODO: Vurder å filtrere fravær også for tekniker?
        
        // Henter alle brukere for ressurslisten (kan filtreres senere)
        let usersUrl = USERS_API_URL; 

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Token ${token}` } };
            
            // Utfør ALLE API-kallene parallelt
            const [assignmentRes, absenceRes, userRes] = await Promise.all([
                axios.get(assignmentsUrl, config),
                axios.get(absencesUrl, config),
                axios.get(usersUrl, config) // Henter brukere
            ]);

            // Behandle brukere -> Ressurser
            const users = userRes.data.results || userRes.data;
            const formattedResources = users.map(user => ({
                id: user.id.toString(), // Ressurs-ID må være streng
                title: user.username // Viser brukernavn i ressurskolonnen
                // Kan legge til flere felt her hvis ønskelig
            }));
            setResources(formattedResources);

            // Behandle oppdrag (legger til resourceId og farge)
            const assignments = assignmentRes.data.results || assignmentRes.data;
            const formattedAssignmentEvents = assignments
                .filter(a => a.assigned_to && a.scheduled_date) // Vis kun tildelte OG planlagte
                .map(assignment => ({
                    id: `assign_${assignment.id}`,
                    resourceId: assignment.assigned_to.toString(),
                    title: assignment.title,
                    start: assignment.scheduled_date, // Bruker planlagt tidspunkt som start
                    // Setter end til dagen ETTER deadline_date for riktig visning
                    end: assignment.deadline_date ? addOneDay(assignment.deadline_date) : null, 
                    // allDay: false, // Kan settes eksplisitt hvis ønskelig, men FullCalendar håndterer det ofte greit
                    extendedProps: { ...assignment, eventType: 'assignment' },
                    backgroundColor: getStatusColor(assignment.status), 
                    borderColor: getStatusColor(assignment.status)
                }));
            setAssignmentEvents(formattedAssignmentEvents);

            // Behandle fravær (legger til resourceId)
            const absences = absenceRes.data.results || absenceRes.data;
            const formattedAbsenceEvents = absences.map(absence => ({
                id: `absence_${absence.id}`,
                resourceId: absence.user.toString(), // Kobler til bruker
                title: `${absence.absence_type_display}`, // Trenger ikke brukernavn her lenger
                start: absence.start_date,
                end: addOneDay(absence.end_date), 
                allDay: true, 
                extendedProps: { ...absence, eventType: 'absence' },
                backgroundColor: '#dc3545', 
                borderColor: '#dc3545', 
                display: 'background' 
            }));
            setAbsenceEvents(formattedAbsenceEvents);

        } catch (err) {
            console.error('Feil ved henting av kalenderdata:', err);
            setError('Kunne ikke hente data for kalender.');
            setAssignmentEvents([]);
            setAbsenceEvents([]);
            setResources([]); // Tøm ressurser ved feil
        } finally {
            setIsLoading(false);
        }
    };

    // Hjelpefunksjon for å legge til en dag (for FullCalendar allDay end date)
    const addOneDay = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            date.setDate(date.getDate() + 1);
            return date.toISOString().split('T')[0]; // Returner YYYY-MM-DD
        } catch (e) {
            console.error("Kunne ikke legge til dag:", dateString, e);
            return dateString;
        }
    };

    // Hent data når komponenten lastes
    useEffect(() => {
        fetchDataForCalendar();
    }, [userRole, userId]); // Endret fetch-funksjon

    // Åpne modal for redigering når et event klikkes
    const handleEventClick = (clickInfo) => {
        const eventType = clickInfo.event.extendedProps.eventType;
        if (eventType === 'assignment') {
            // Åpne oppdragsmodal som før
            setEditingAssignment(clickInfo.event.extendedProps);
            setModalInitialDate(null);
            setIsModalOpen(true);
        } else if (eventType === 'absence') {
            // Korrigerer formatering av sluttdato for alert
            const endDate = clickInfo.event.end ? new Date(clickInfo.event.end.getTime() - 1) : null; // Trekk fra 1 ms for å få riktig dato
            const endDateString = endDate ? endDate.toLocaleDateString('no-NO') : 'Ubestemt';
            alert(`Fravær: ${clickInfo.event.title}\nBruker: ${clickInfo.event.extendedProps.user_details?.username || 'Ukjent'}\nPeriode: ${clickInfo.event.startStr} - ${endDateString}`);
        }
    };

    // Åpne modal for å legge til nytt oppdrag når en dato klikkes
    const handleDateSelect = (selectInfo) => {
        setEditingAssignment(null);
        setModalInitialDate(selectInfo.startStr.substring(0, 10));
        setIsModalOpen(true);
    };

    // Lukk modal og hent data på nytt ved lagring
    const handleAssignmentSaved = () => {
        setIsModalOpen(false);
        fetchDataForCalendar(); // Hent all data på nytt
    };

    // Funksjon for å rendre innholdet i event-blokkene
    const renderEventContent = (eventInfo) => {
        const props = eventInfo.event.extendedProps;
        if (props.eventType === 'assignment') {
             return (
                <div className="fc-event-main-custom">
                    <div className="fc-event-time">{eventInfo.timeText}</div>
                    <div className="fc-event-title">{eventInfo.event.title}</div>
                    {/* Viser kundenavn hvis det finnes */} 
                    {props.customer_name && <div className="fc-event-customer">{props.customer_name}</div>}
                </div>
            );
        } else if (props.eventType === 'absence') {
            // For fravær kan vi bare vise tittelen sentrert e.l.
             return (
                 <div className="fc-event-main-custom fc-event-absence">
                     {eventInfo.event.title}
                 </div>
            );
        }
        return <i>{eventInfo.event.title}</i>; // Fallback
    };

    return (
        <div className="calendar-container container mt-4">
            <h1>Oppdragskalender {userRole === 'tekniker' && " (Mine Oppdrag)"}</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster kalender...</p>}
            
            <FullCalendar
                // Legger til ressurs-plugins
                plugins={[resourceTimelinePlugin, resourceDayGridPlugin, resourceTimeGridPlugin, interactionPlugin, listPlugin]}
                schedulerLicenseKey='GPL-My-Project-Is-Open-Source' // Nødvendig for ressurs-plugins (bruk din nøkkel i prod)
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    // Legger til ressurs-visninger
                    right: 'resourceTimelineWeek,resourceTimeGridDay,dayGridMonth,listWeek' 
                }}
                // Setter ressurs-tidslinje som default hvis admin/selger
                initialView={userRole === 'tekniker' ? 'dayGridMonth' : 'resourceTimelineWeek'} 
                locale={nbLocale}
                buttonText={{ 
                    today:    'I dag',
                    month:    'Måned',
                    week:     'Uke',
                    day:      'Dag',
                    list:     'Liste'
                 }}
                weekNumbers={true}
                navLinks={true}
                editable={false} 
                selectable={true} 
                selectMirror={true}
                dayMaxEvents={3} // Viser opptil 3 events før +more
                // Legger til resources prop
                resources={resources} 
                resourceAreaHeaderContent='Ansatte' // Tittel på ressurskolonnen
                events={[...assignmentEvents, ...absenceEvents]} 
                eventClick={handleEventClick} 
                select={handleDateSelect} 
                // Legger til eventContent prop
                eventContent={renderEventContent} 
            />

            <AddAssignmentModal
                 isOpen={isModalOpen}
                 onClose={() => setIsModalOpen(false)}
                 onAssignmentSaved={handleAssignmentSaved}
                 assignmentToEdit={editingAssignment}
                 initialData={modalInitialDate ? { scheduled_date: modalInitialDate } : {}}
            />
        </div>
    );
};

export default AssignmentCalendar; 