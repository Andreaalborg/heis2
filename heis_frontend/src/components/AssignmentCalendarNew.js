import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import nbLocale from '@fullcalendar/core/locales/nb';
// Ressurs-plugins
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

// Material-UI imports
import {
    Box, Container, Paper, Typography, Grid, Card, CardContent,
    Button, IconButton, Chip, Alert, LinearProgress, 
    FormControl, InputLabel, Select, MenuItem, Tooltip,
    AppBar, Toolbar, Divider
} from '@mui/material';
import {
    CalendarMonth, Today, ViewWeek, ViewDay, List as ListIcon,
    Person, Business, Schedule, Refresh, FilterList,
    Assignment, EventBusy, CheckCircle, PlayArrow,
    Warning, Error as ErrorIcon
} from '@mui/icons-material';

import AddAssignmentModal from './AddAssignmentModal';
import { LoadingSpinner, ErrorMessage } from './LoadingError';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Moderne fargeskjema som matcher Dashboard-komponent
const statusConfig = {
    pending: { color: '#FF9800', bgcolor: '#FFF3E0', label: 'Venter', icon: <Schedule /> },
    in_progress: { color: '#2196F3', bgcolor: '#E3F2FD', label: 'Påbegynt', icon: <PlayArrow /> },
    completed: { color: '#4CAF50', bgcolor: '#E8F5E9', label: 'Ferdig', icon: <CheckCircle /> },
    cancelled: { color: '#9E9E9E', bgcolor: '#F5F5F5', label: 'Avbrutt', icon: <ErrorIcon /> }
};

const absenceConfig = {
    sick_leave: { color: '#f44336', bgcolor: '#ffebee', icon: '🤒' },
    vacation: { color: '#4CAF50', bgcolor: '#e8f5e9', icon: '🏖️' },
    leave_of_absence: { color: '#FF9800', bgcolor: '#fff3e0', icon: '📋' },
    public_holiday: { color: '#2196F3', bgcolor: '#e3f2fd', icon: '🎉' },
    other: { color: '#9E9E9E', bgcolor: '#f5f5f5', icon: '📝' }
};

const getStatusColor = (status) => {
    return statusConfig[status]?.color || '#9E9E9E';
};

const getStatusBgColor = (status) => {
    return statusConfig[status]?.bgcolor || '#f5f5f5';
};

const AssignmentCalendarNew = () => {
    const [assignmentEvents, setAssignmentEvents] = useState([]);
    const [absenceEvents, setAbsenceEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [modalInitialDate, setModalInitialDate] = useState(null);
    const [currentView, setCurrentView] = useState('resourceTimelineWeek');
    const [statusFilter, setStatusFilter] = useState('all');

    // Brukerinfo fra localStorage
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

    const fetchEvents = useCallback(async (fetchInfo) => {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const config = {
            headers: { 'Authorization': `Token ${token}` }
        };

        const startDate = fetchInfo && fetchInfo.startStr ? fetchInfo.startStr.split('T')[0] : null;
        const endDate = fetchInfo && fetchInfo.endStr ? fetchInfo.endStr.split('T')[0] : null;

        let assignmentsUrl = `${API_BASE_URL}/api/assignments/`;
        let absencesUrl = `${API_BASE_URL}/api/absences/`;
        const usersUrl = `${API_BASE_URL}/api/users/`;

        const dateParams = [];
        if (startDate) dateParams.push(`start_date=${startDate}`);
        if (endDate) dateParams.push(`end_date=${endDate}`);
        const queryParams = dateParams.join('&');

        if (queryParams) {
            assignmentsUrl += `?${queryParams}`;
            absencesUrl += `?${queryParams}`;
        }
        
        if (userRole === 'tekniker' && userId) {
            assignmentsUrl = `${API_BASE_URL}/api/assignments/?assigned_to=${userId}`;
        }

        try {
            const [assignmentsRes, absencesRes, usersRes] = await Promise.all([
                axios.get(assignmentsUrl, config),
                axios.get(absencesUrl, config),
                axios.get(usersUrl, config)
            ]);

            // Behandle brukere -> Ressurser
            const users = usersRes.data.results || usersRes.data;
            const formattedResources = users.map(user => ({
                id: user.id.toString(),
                title: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
                extendedProps: { user }
            }));
            setResources(formattedResources);

            // Behandle oppdrag
            const assignments = assignmentsRes.data.results || assignmentsRes.data;
            const formattedAssignmentEvents = assignments
                .filter(a => a.assigned_to && a.scheduled_date)
                .filter(a => statusFilter === 'all' || a.status === statusFilter)
                .map(assignment => ({
                    id: `assign_${assignment.id}`,
                    resourceId: assignment.assigned_to.toString(),
                    title: assignment.title,
                    start: assignment.scheduled_date,
                    end: assignment.deadline_date ? addOneDay(assignment.deadline_date) : null,
                    extendedProps: { ...assignment, eventType: 'assignment' },
                    backgroundColor: getStatusColor(assignment.status),
                    borderColor: getStatusColor(assignment.status),
                    textColor: '#ffffff'
                }));
            setAssignmentEvents(formattedAssignmentEvents);

            // Behandle fravær
            const absences = absencesRes.data.results || absencesRes.data;
            const formattedAbsenceEvents = absences.map(absence => ({
                id: `absence_${absence.id}`,
                resourceId: absence.user.toString(),
                title: `${absenceConfig[absence.absence_type]?.icon || '📅'} ${absence.absence_type_display || 'Fravær'}`,
                start: absence.start_date,
                end: addOneDay(absence.end_date),
                allDay: true,
                extendedProps: { ...absence, eventType: 'absence' },
                backgroundColor: absenceConfig[absence.absence_type]?.color || '#9E9E9E',
                borderColor: absenceConfig[absence.absence_type]?.color || '#9E9E9E',
                display: 'background',
                textColor: '#ffffff'
            }));
            setAbsenceEvents(formattedAbsenceEvents);

        } catch (err) {
            console.error('Feil ved henting av kalenderdata:', err);
            setError('Kunne ikke hente data for kalender.');
            setAssignmentEvents([]);
            setAbsenceEvents([]);
            setResources([]);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    const addOneDay = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            date.setDate(date.getDate() + 1);
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error("Kunne ikke legge til dag:", dateString, e);
            return dateString;
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [userRole, userId, fetchEvents]);

    const handleEventClick = (clickInfo) => {
        const eventType = clickInfo.event.extendedProps.eventType;
        if (eventType === 'assignment') {
            setEditingAssignment(clickInfo.event.extendedProps);
            setModalInitialDate(null);
            setIsModalOpen(true);
        } else if (eventType === 'absence') {
            const endDate = clickInfo.event.end ? new Date(clickInfo.event.end.getTime() - 1) : null;
            const endDateString = endDate ? endDate.toLocaleDateString('no-NO') : 'Ubestemt';
            alert(`Fravær: ${clickInfo.event.title}\nBruker: ${clickInfo.event.extendedProps.user_details?.username || 'Ukjent'}\nPeriode: ${clickInfo.event.startStr} - ${endDateString}`);
        }
    };

    const handleDateSelect = (selectInfo) => {
        setEditingAssignment(null);
        setModalInitialDate(selectInfo.startStr.substring(0, 10));
        setIsModalOpen(true);
    };

    const handleAssignmentSaved = () => {
        setIsModalOpen(false);
        fetchEvents();
    };

    const renderEventContent = (eventInfo) => {
        const props = eventInfo.event.extendedProps;
        if (props.eventType === 'assignment') {
            const statusInfo = statusConfig[props.status];
            return (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    overflow: 'hidden',
                    p: 0.5
                }}>
                    {statusInfo?.icon && (
                        <Box sx={{ mr: 0.5, fontSize: '14px' }}>
                            {React.cloneElement(statusInfo.icon, { fontSize: 'inherit' })}
                        </Box>
                    )}
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2
                        }}>
                            {eventInfo.timeText}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2,
                            opacity: 0.9
                        }}>
                            {eventInfo.event.title}
                        </Typography>
                        {props.customer_name && (
                            <Typography variant="caption" sx={{ 
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2,
                                opacity: 0.8,
                                fontSize: '0.7em'
                            }}>
                                🏢 {props.customer_name}
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        } else if (props.eventType === 'absence') {
            return (
                <Box sx={{ 
                    textAlign: 'center', 
                    fontWeight: 500,
                    opacity: 0.8
                }}>
                    {eventInfo.event.title}
                </Box>
            );
        }
        return <span>{eventInfo.event.title}</span>;
    };

    const calendarToolbar = (
        <AppBar position="static" color="default" elevation={1} sx={{ mb: 2 }}>
            <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth color="primary" />
                    Oppdragskalender
                    {userRole === 'tekniker' && (
                        <Chip label="Mine Oppdrag" size="small" color="primary" variant="outlined" />
                    )}
                </Typography>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Filter status"
                    >
                        <MenuItem value="all">Alle</MenuItem>
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <MenuItem key={key} value={key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {config.icon}
                                    {config.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Tooltip title="Oppdater kalender">
                    <IconButton onClick={() => fetchEvents()} disabled={isLoading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );

    const legendCard = (
        <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Status-farger
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <Chip
                            key={key}
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            sx={{
                                bgcolor: config.bgcolor,
                                color: config.color,
                                '& .MuiChip-icon': { color: config.color }
                            }}
                        />
                    ))}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventBusy />
                    Fravær
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(absenceConfig).map(([key, config]) => (
                        <Chip
                            key={key}
                            label={`${config.icon} ${key.replace('_', ' ')}`}
                            size="small"
                            sx={{
                                bgcolor: config.bgcolor,
                                color: config.color
                            }}
                        />
                    ))}
                </Box>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {calendarToolbar}
                <LoadingSpinner message="Laster kalenderdata..." size={50} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {calendarToolbar}
                <ErrorMessage 
                    error={error} 
                    title="Kunne ikke laste kalender" 
                    onRetry={fetchEvents} 
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {calendarToolbar}
            {legendCard}
            
            <Paper sx={{ 
                p: 3, 
                borderRadius: 2, 
                boxShadow: 3,
                overflow: 'auto',
                '& .fc': {
                    // Custom FullCalendar styling
                    '& .fc-toolbar': {
                        flexWrap: 'wrap',
                        gap: 1
                    },
                    '& .fc-button': {
                        textTransform: 'none',
                        borderRadius: 1,
                        backgroundColor: '#1976d2',
                        borderColor: '#1976d2',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                            borderColor: '#1565c0'
                        },
                        '&.fc-button-active': {
                            backgroundColor: '#0d47a1',
                            borderColor: '#0d47a1'
                        }
                    },
                    '& .fc-event': {
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': {
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s ease',
                            zIndex: 100
                        }
                    },
                    '& .fc-daygrid-event': {
                        marginBottom: '1px'
                    },
                    '& .fc-resource': {
                        '& .fc-datagrid-cell-main': {
                            padding: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }
                    },
                    '& .fc-col-header': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 600
                    }
                }
            }}>
                <FullCalendar
                    plugins={[resourceTimelinePlugin, resourceDayGridPlugin, resourceTimeGridPlugin, interactionPlugin, listPlugin]}
                    schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'resourceTimelineWeek,resourceTimeGridDay,dayGridMonth,listWeek'
                    }}
                    initialView={userRole === 'tekniker' ? 'dayGridMonth' : 'resourceTimelineWeek'}
                    locale={nbLocale}
                    buttonText={{
                        today: 'I dag',
                        month: 'Måned',
                        week: 'Uke',
                        day: 'Dag',
                        list: 'Liste'
                    }}
                    weekNumbers={true}
                    navLinks={true}
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={4}
                    resources={resources}
                    resourceAreaHeaderContent='👥 Ansatte'
                    events={[...assignmentEvents, ...absenceEvents]}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    eventContent={renderEventContent}
                    height="auto"
                    aspectRatio={1.8}
                />
            </Paper>

            <AddAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAssignmentSaved={handleAssignmentSaved}
                assignmentToEdit={editingAssignment}
                initialData={modalInitialDate ? { scheduled_date: modalInitialDate } : {}}
            />
        </Container>
    );
};

export default AssignmentCalendarNew;