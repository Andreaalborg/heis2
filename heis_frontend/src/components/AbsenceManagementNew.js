import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Container, Paper, Typography, Grid, Card, CardContent,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, LinearProgress, Tab, Tabs, Badge, Tooltip
} from '@mui/material';
import {
    Add, Edit, Delete, CalendarMonth, Person, EventBusy,
    Sick, BeachAccess, School, LocalHospital, ChildCare,
    Home, DirectionsCar, Gavel, Warning, CheckCircle
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AbsenceManagementNew = () => {
    const [tabValue, setTabValue] = useState(0);
    const [absences, setAbsences] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [formData, setFormData] = useState({
        user: '',
        absence_type: '',
        start_date: null,
        end_date: null,
        reason: '',
        doctor_certificate: false
    });

    const absenceTypes = [
        { value: 'sick_leave', label: 'Sykemelding', icon: <Sick />, color: '#f44336' },
        { value: 'vacation', label: 'Ferie', icon: <BeachAccess />, color: '#4CAF50' },
        { value: 'leave_of_absence', label: 'Permisjon', icon: <EventBusy />, color: '#FF9800' },
        { value: 'public_holiday', label: 'Helligdag', icon: <CalendarMonth />, color: '#2196F3' },
        { value: 'other', label: 'Annet', icon: <Warning />, color: '#9E9E9E' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            const [absencesRes, usersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/absences/`, { headers }),
                axios.get(`${API_BASE_URL}/api/users/`, { headers })
            ]);

            setAbsences(absencesRes.data.results || absencesRes.data);
            setUsers(usersRes.data.results || usersRes.data);
        } catch (error) {
            console.error('Feil ved henting av data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (absence = null) => {
        if (absence) {
            setSelectedAbsence(absence);
            setFormData({
                user: absence.user,
                absence_type: absence.absence_type,
                start_date: new Date(absence.start_date),
                end_date: new Date(absence.end_date),
                reason: absence.reason || '',
                doctor_certificate: absence.doctor_certificate || false
            });
        } else {
            setSelectedAbsence(null);
            setFormData({
                user: '',
                absence_type: '',
                start_date: null,
                end_date: null,
                reason: '',
                doctor_certificate: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAbsence(null);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };
            
            const data = {
                ...formData,
                start_date: formData.start_date?.toISOString().split('T')[0],
                end_date: formData.end_date?.toISOString().split('T')[0]
            };

            if (selectedAbsence) {
                await axios.put(
                    `${API_BASE_URL}/api/absences/${selectedAbsence.id}/`,
                    data,
                    { headers }
                );
            } else {
                await axios.post(
                    `${API_BASE_URL}/api/absences/`,
                    data,
                    { headers }
                );
            }

            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Feil ved lagring:', error);
            console.error('Response data:', error.response?.data);
            
            let errorMessage = 'Kunne ikke lagre fravær';
            if (error.response?.data) {
                const errors = error.response.data;
                if (typeof errors === 'object') {
                    errorMessage += ': ' + Object.entries(errors).map(([field, msgs]) => 
                        `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
                    ).join('; ');
                }
            }
            alert(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Er du sikker på at du vil slette dette fraværet?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_BASE_URL}/api/absences/${id}/`,
                { headers: { 'Authorization': `Token ${token}` } }
            );
            fetchData();
        } catch (error) {
            console.error('Feil ved sletting:', error);
            alert('Kunne ikke slette fravær');
        }
    };

    const getAbsenceTypeInfo = (type) => {
        return absenceTypes.find(t => t.value === type) || absenceTypes[absenceTypes.length - 1];
    };

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const getActiveAbsences = () => {
        const today = new Date();
        return absences.filter(absence => {
            const endDate = new Date(absence.end_date);
            return endDate >= today;
        });
    };

    const renderOverview = () => {
        const activeAbsences = getActiveAbsences();
        const absencesByType = {};
        
        absences.forEach(absence => {
            if (!absencesByType[absence.absence_type]) {
                absencesByType[absence.absence_type] = 0;
            }
            absencesByType[absence.absence_type] += calculateDays(absence.start_date, absence.end_date);
        });

        return (
            <Grid container spacing={3}>
                {/* Statistikk-kort */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Aktivt fravær nå
                            </Typography>
                            <Typography variant="h3">
                                {activeAbsences.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                personer
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total fravær i år
                            </Typography>
                            <Typography variant="h3">
                                {Object.values(absencesByType).reduce((a, b) => a + b, 0)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                dager
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Sykefravær
                            </Typography>
                            <Typography variant="h3">
                                {absencesByType['sick_leave'] || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                dager
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Ferie
                            </Typography>
                            <Typography variant="h3">
                                {absencesByType['vacation'] || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                dager
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Aktive fravær */}
                <Grid size={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Aktivt fravær
                        </Typography>
                        {activeAbsences.length === 0 ? (
                            <Alert severity="success">
                                Ingen aktive fravær registrert
                            </Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {activeAbsences.map(absence => {
                                    const user = users.find(u => u.id === absence.user);
                                    const typeInfo = getAbsenceTypeInfo(absence.absence_type);
                                    return (
                                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={absence.id}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                        <Box sx={{ color: typeInfo.color }}>
                                                            {typeInfo.icon}
                                                        </Box>
                                                        <Box flex={1}>
                                                            <Typography variant="h6">
                                                                {user?.first_name} {user?.last_name}
                                                            </Typography>
                                                            <Chip 
                                                                label={typeInfo.label} 
                                                                size="small"
                                                                sx={{ 
                                                                    bgcolor: typeInfo.color + '20',
                                                                    color: typeInfo.color 
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {new Date(absence.start_date).toLocaleDateString('nb-NO')} - 
                                                        {new Date(absence.end_date).toLocaleDateString('nb-NO')}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {calculateDays(absence.start_date, absence.end_date)} dager
                                                    </Typography>
                                                    {absence.reason && (
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            {absence.reason}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        );
    };

    const renderAllAbsences = () => (
        <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    Alle fraværsregistreringer
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenModal()}
                >
                    Registrer fravær
                </Button>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ansatt</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Fra dato</TableCell>
                            <TableCell>Til dato</TableCell>
                            <TableCell>Dager</TableCell>
                            <TableCell>Årsak</TableCell>
                            <TableCell>Legeattest</TableCell>
                            <TableCell>Handlinger</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {absences.map(absence => {
                            const user = users.find(u => u.id === absence.user);
                            const typeInfo = getAbsenceTypeInfo(absence.absence_type);
                            return (
                                <TableRow key={absence.id}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person />
                                            {user?.first_name} {user?.last_name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={typeInfo.icon}
                                            label={typeInfo.label}
                                            size="small"
                                            sx={{ 
                                                bgcolor: typeInfo.color + '20',
                                                color: typeInfo.color 
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(absence.start_date).toLocaleDateString('nb-NO')}</TableCell>
                                    <TableCell>{new Date(absence.end_date).toLocaleDateString('nb-NO')}</TableCell>
                                    <TableCell>{calculateDays(absence.start_date, absence.end_date)}</TableCell>
                                    <TableCell>{absence.reason || '-'}</TableCell>
                                    <TableCell>
                                        {absence.doctor_certificate ? (
                                            <CheckCircle color="success" />
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenModal(absence)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(absence.id)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );

    const renderPerEmployee = () => {
        // Kalkuler fraværsdager per ansatt og type
        const employeeAbsences = {};
        
        users.forEach(user => {
            employeeAbsences[user.id] = {
                user: user,
                total: 0,
                byType: {},
                vacationDays: 0,
                sickDays: 0,
                absences: []
            };
            
            // Initialiser alle typer til 0
            absenceTypes.forEach(type => {
                employeeAbsences[user.id].byType[type.value] = 0;
            });
        });

        // Kalkuler fraværsdager
        absences.forEach(absence => {
            if (employeeAbsences[absence.user]) {
                const days = calculateDays(absence.start_date, absence.end_date);
                employeeAbsences[absence.user].total += days;
                employeeAbsences[absence.user].byType[absence.absence_type] += days;
                employeeAbsences[absence.user].absences.push(absence);
                
                // Spesielle tellere
                if (absence.absence_type === 'vacation') {
                    employeeAbsences[absence.user].vacationDays += days;
                }
                if (absence.absence_type === 'sick_leave') {
                    employeeAbsences[absence.user].sickDays += days;
                }
            }
        });

        const employeeList = Object.values(employeeAbsences).sort((a, b) => 
            b.total - a.total
        );

        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Fraværsoversikt per ansatt
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Alle fraværsdager registrert i systemet
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {employeeList.map((empData) => {
                        const isVacationHigh = empData.vacationDays > 25; // 5 uker = 25 dager
                        const isSickHigh = empData.sickDays > 10;
                        
                        return (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={empData.user.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Person color="primary" />
                                            <Box flex={1}>
                                                <Typography variant="h6">
                                                    {empData.user.first_name} {empData.user.last_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total: {empData.total} dager
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Ferie:</strong> {empData.vacationDays} dager
                                                {isVacationHigh && (
                                                    <Chip 
                                                        label="Over 5 uker" 
                                                        size="small" 
                                                        color="warning" 
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Sykefravær:</strong> {empData.sickDays} dager
                                                {isSickHigh && (
                                                    <Chip 
                                                        label="Høyt sykefravær" 
                                                        size="small" 
                                                        color="error" 
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Fordeling per type:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {absenceTypes.map(type => {
                                                const days = empData.byType[type.value];
                                                if (days > 0) {
                                                    return (
                                                        <Chip
                                                            key={type.value}
                                                            icon={type.icon}
                                                            label={`${type.label}: ${days}d`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: type.color + '20',
                                                                color: type.color,
                                                                '& .MuiChip-icon': {
                                                                    color: type.color
                                                                }
                                                            }}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </Box>

                                        {empData.absences.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Siste registreringer: {empData.absences.slice(-2).map(abs => 
                                                        new Date(abs.start_date).toLocaleDateString('nb-NO')
                                                    ).join(', ')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {employeeList.length === 0 && (
                    <Alert severity="info">
                        Ingen fraværsregistreringer funnet
                    </Alert>
                )}
            </Paper>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                    Fraværsadministrasjon
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Registrer og administrer fravær for alle ansatte
                </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)}
                    sx={{
                        '& .MuiTab-root': {
                            color: '#666666',
                            '&.Mui-selected': {
                                color: '#1976d2',
                                backgroundColor: 'transparent'
                            },
                            '&:hover': {
                                color: '#1976d2',
                                backgroundColor: 'rgba(25, 118, 210, 0.04)'
                            }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1976d2'
                        }
                    }}
                >
                    <Tab label="Oversikt" icon={<CalendarMonth />} />
                    <Tab label="Alle registreringer" icon={<EventBusy />} />
                    <Tab label="Per ansatt" icon={<Person />} />
                </Tabs>
            </Paper>

            {isLoading ? (
                <LinearProgress />
            ) : (
                <>
                    {tabValue === 0 && renderOverview()}
                    {tabValue === 1 && renderAllAbsences()}
                    {tabValue === 2 && renderPerEmployee()}
                </>
            )}

            {/* Modal for å legge til/redigere fravær */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {selectedAbsence ? 'Rediger fravær' : 'Registrer nytt fravær'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Ansatt</InputLabel>
                                <Select
                                    value={formData.user}
                                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                    label="Ansatt"
                                >
                                    {users.map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Fraværstype</InputLabel>
                                <Select
                                    value={formData.absence_type}
                                    onChange={(e) => setFormData({ ...formData, absence_type: e.target.value })}
                                    label="Fraværstype"
                                >
                                    {absenceTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ color: type.color }}>
                                                    {type.icon}
                                                </Box>
                                                {type.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                type="date"
                                label="Fra dato"
                                value={formData.start_date ? formData.start_date.toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value) : null })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                type="date"
                                label="Til dato"
                                value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : null })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Årsak/Kommentar"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />

                            {formData.absence_type === 'sick_leave' && (
                                <FormControl>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <input
                                            type="checkbox"
                                            checked={formData.doctor_certificate}
                                            onChange={(e) => setFormData({ ...formData, doctor_certificate: e.target.checked })}
                                        />
                                        <Typography>Legeattest levert</Typography>
                                    </Box>
                                </FormControl>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>Avbryt</Button>
                        <Button onClick={handleSave} variant="contained">
                            {selectedAbsence ? 'Oppdater' : 'Registrer'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
    );
};

export default AbsenceManagementNew;