import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Paper, Typography, Stepper, Step, StepLabel, StepContent,
    Button, TextField, Select, MenuItem, FormControl, InputLabel, 
    Card, CardContent, Chip, Alert, LinearProgress, Grid,
    List, ListItem, ListItemText, ListItemIcon, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
    Person, Settings, CalendarMonth, Engineering, Description,
    CheckCircle, Warning, Add, Business, LocalPhone, Email,
    LocationOn, ArrowForward, ArrowBack
} from '@mui/icons-material';
import AddCustomerModal from './AddCustomerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesWorkflowNew = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [workflowData, setWorkflowData] = useState({
        customer: null,
        isNewCustomer: false,
        serviceType: '',
        elevatorType: '',
        selectedElevator: null,
        description: '',
        estimatedValue: '',
        startDate: '',
        endDate: '',
        assignedTechnician: '',
        priority: 'medium'
    });

    const [customers, setCustomers] = useState([]);
    const [elevatorTypes, setElevatorTypes] = useState([]);
    const [elevators, setElevators] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [technicianAvailability, setTechnicianAvailability] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const navigate = useNavigate();

    const serviceTypes = [
        { value: 'installation', label: 'Heisinstallasjon', basePrice: 850000, icon: '🏗️' },
        { value: 'service', label: 'Service/Vedlikehold', basePrice: 8500, icon: '🔧' },
        { value: 'repair', label: 'Reparasjon', basePrice: 15000, icon: '🔨' },
        { value: 'inspection', label: 'Inspeksjon', basePrice: 5000, icon: '🔍' },
        { value: 'modernization', label: 'Modernisering', basePrice: 350000, icon: '✨' }
    ];

    const steps = [
        { label: 'Velg Kunde', icon: <Person /> },
        { label: 'Velg Tjeneste', icon: <Settings /> },
        { label: 'Planlegg Dato', icon: <CalendarMonth /> },
        { label: 'Foreslå Tekniker', icon: <Engineering /> },
        { label: 'Fullfør Tilbud', icon: <Description /> }
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

            const [customersRes, elevatorTypesRes, elevatorsRes, techniciansRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/customers/`, { headers }),
                axios.get(`${API_BASE_URL}/api/elevator-types/`, { headers }),
                axios.get(`${API_BASE_URL}/api/elevators/`, { headers }),
                axios.get(`${API_BASE_URL}/api/users/`, { headers })
            ]);

            setCustomers(customersRes.data.results || customersRes.data);
            setElevatorTypes(elevatorTypesRes.data.results || elevatorTypesRes.data);
            setElevators(elevatorsRes.data.results || elevatorsRes.data);
            
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
            console.error('Feil ved sjekk av tekniker-tilgjengelighet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const isStepValid = (step) => {
        switch (step) {
            case 0: return workflowData.customer !== null;
            case 1: return workflowData.serviceType !== '' && workflowData.description.trim() !== '';
            case 2: return workflowData.startDate !== '' && workflowData.endDate !== '' && 
                          new Date(workflowData.endDate) >= new Date(workflowData.startDate);
            case 3: return true; // Tekniker er valgfritt
            case 4: return true;
            default: return false;
        }
    };

    const createOpportunityAndQuote = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // Opprett salgsmulighet
            const opportunityData = {
                customer: workflowData.customer.id,
                name: `${workflowData.serviceType} - ${workflowData.customer.name}`,
                description: workflowData.description,
                status: 'new',
                estimated_value: parseFloat(workflowData.estimatedValue) || 0,
                service: workflowData.serviceType
            };

            const opportunityResponse = await axios.post(
                `${API_BASE_URL}/api/sales-opportunities/`, 
                opportunityData, 
                { headers }
            );

            // Opprett tilbud
            const quoteData = {
                customer: workflowData.customer.id,
                sales_opportunity: opportunityResponse.data.id,
                valid_days: 30,
                vat_rate: 25.0,
                notes: workflowData.description
            };

            const quoteResponse = await axios.post(
                `${API_BASE_URL}/api/quotes/`, 
                quoteData, 
                { headers }
            );

            alert('Salgsmulighet og tilbud opprettet!');
            navigate(`/quotes/${quoteResponse.data.id}`);
        } catch (error) {
            console.error('Feil ved opprettelse:', error);
            alert('Feil ved opprettelse av tilbud');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Velg eksisterende kunde eller opprett ny</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    Opprett ny kunde
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Eller velg fra eksisterende kunder:
                                </Typography>
                                <List sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    {customers.map((customer) => (
                                        <ListItem
                                            key={customer.id}
                                            component="div"
                                            selected={workflowData.customer?.id === customer.id}
                                            onClick={() => setWorkflowData({ ...workflowData, customer })}
                                            sx={{
                                                bgcolor: workflowData.customer?.id === customer.id ? '#E3F2FD' : 'transparent',
                                                '&:hover': { 
                                                    bgcolor: workflowData.customer?.id === customer.id ? '#E3F2FD' : '#f5f5f5',
                                                    cursor: 'pointer'
                                                },
                                                border: workflowData.customer?.id === customer.id ? 2 : 1,
                                                borderColor: workflowData.customer?.id === customer.id ? '#1976d2' : 'transparent',
                                                mb: 0.5,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <ListItemIcon>
                                                <Business color={workflowData.customer?.id === customer.id ? 'primary' : 'inherit'} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={<Typography fontWeight={workflowData.customer?.id === customer.id ? 700 : 400}>{customer.name}</Typography>}
                                                secondary={
                                                    <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        {customer.contact_person && (
                                                            <Chip size="small" icon={<Person />} label={customer.contact_person} />
                                                        )}
                                                        {customer.phone && (
                                                            <Chip size="small" icon={<LocalPhone />} label={customer.phone} />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            {workflowData.customer?.id === customer.id && (
                                                <CheckCircle color="primary" />
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Velg tjenestetype og beskriv oppdraget</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Grid container spacing={2}>
                                    {serviceTypes.map((service) => (
                                        <Grid item xs={12} sm={6} md={4} key={service.value}>
                                            <Card 
                                                sx={{ 
                                                    cursor: 'pointer', 
                                                    border: workflowData.serviceType === service.value ? 2 : 1,
                                                    borderColor: workflowData.serviceType === service.value ? 'primary.main' : 'divider',
                                                    '&:hover': { borderColor: 'primary.main' }
                                                }}
                                                onClick={() => setWorkflowData({ 
                                                    ...workflowData, 
                                                    serviceType: service.value,
                                                    estimatedValue: service.basePrice
                                                })}
                                            >
                                                <CardContent>
                                                    <Typography variant="h3" align="center">{service.icon}</Typography>
                                                    <Typography variant="h6" align="center">{service.label}</Typography>
                                                    <Typography variant="body2" align="center" color="text.secondary">
                                                        Fra {service.basePrice.toLocaleString('nb-NO')} kr
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                            
                            {workflowData.serviceType === 'installation' && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Velg heistype eller eksisterende heis som mal:
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Heistype</InputLabel>
                                            <Select
                                                value={workflowData.elevatorType}
                                                onChange={(e) => setWorkflowData({ ...workflowData, elevatorType: e.target.value })}
                                                label="Heistype"
                                            >
                                                <MenuItem value="">Ingen valgt</MenuItem>
                                                {elevatorTypes.map(type => (
                                                    <MenuItem key={type.id} value={type.id}>
                                                        {type.name} - {type.manufacturer}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Eller velg eksisterende heis</InputLabel>
                                            <Select
                                                value={workflowData.selectedElevator?.id || ''}
                                                onChange={(e) => {
                                                    const elevator = elevators.find(el => el.id === e.target.value);
                                                    setWorkflowData({ 
                                                        ...workflowData, 
                                                        selectedElevator: elevator,
                                                        elevatorType: elevator?.elevator_type || ''
                                                    });
                                                }}
                                                label="Eller velg eksisterende heis"
                                            >
                                                <MenuItem value="">Ingen valgt</MenuItem>
                                                {elevators.map(elevator => (
                                                    <MenuItem key={elevator.id} value={elevator.id}>
                                                        {elevator.location} - {elevator.serial_number}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Beskrivelse av oppdraget"
                                    value={workflowData.description}
                                    onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                                    placeholder="Beskriv hva som skal gjøres..."
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Estimert verdi (kr)"
                                    value={workflowData.estimatedValue}
                                    onChange={(e) => setWorkflowData({ ...workflowData, estimatedValue: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Velg datoer for oppdraget</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Startdato"
                                    value={workflowData.startDate}
                                    onChange={(e) => setWorkflowData({ ...workflowData, startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Sluttdato"
                                    value={workflowData.endDate}
                                    onChange={(e) => setWorkflowData({ ...workflowData, endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Prioritet</InputLabel>
                                    <Select
                                        value={workflowData.priority}
                                        onChange={(e) => setWorkflowData({ ...workflowData, priority: e.target.value })}
                                        label="Prioritet"
                                    >
                                        <MenuItem value="low">Lav</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">Høy</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Foreslå tekniker (valgfritt)</Typography>
                        {isLoading ? (
                            <LinearProgress />
                        ) : (
                            <List>
                                {technicians.map((tech) => {
                                    const availability = technicianAvailability[tech.id];
                                    return (
                                        <ListItem
                                            key={tech.id}
                                            button
                                            selected={workflowData.assignedTechnician === tech.id}
                                            onClick={() => setWorkflowData({ ...workflowData, assignedTechnician: tech.id })}
                                        >
                                            <ListItemIcon>
                                                {availability?.isAvailable ? (
                                                    <CheckCircle color="success" />
                                                ) : (
                                                    <Warning color="warning" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`${tech.first_name} ${tech.last_name}`}
                                                secondary={
                                                    availability?.isAvailable 
                                                        ? 'Ledig i valgt periode'
                                                        : `${availability?.conflictingAssignments || 0} oppdrag i perioden`
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Box>
                );

            case 4:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Oppsummering</Typography>
                        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Kunde</Typography>
                                    <Typography variant="body1">{workflowData.customer?.name}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Tjeneste</Typography>
                                    <Typography variant="body1">
                                        {serviceTypes.find(s => s.value === workflowData.serviceType)?.label}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Periode</Typography>
                                    <Typography variant="body1">
                                        {workflowData.startDate} - {workflowData.endDate}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Estimert verdi</Typography>
                                    <Typography variant="body1">
                                        {parseInt(workflowData.estimatedValue).toLocaleString('nb-NO')} kr
                                    </Typography>
                                </Grid>
                                {workflowData.assignedTechnician && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">Foreslått tekniker</Typography>
                                        <Typography variant="body1">
                                            {technicians.find(t => t.id === workflowData.assignedTechnician)?.first_name} {' '}
                                            {technicians.find(t => t.id === workflowData.assignedTechnician)?.last_name}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Ved å fullføre vil det opprettes en salgsmulighet og et tilbud basert på informasjonen over.
                        </Alert>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Salgsarbeidsflyt
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Følg stegene for å opprette salgsmulighet og tilbud
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
                    {steps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: activeStep >= index ? '#1976d2' : '#e0e0e0',
                                            color: activeStep >= index ? '#ffffff' : '#666666',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            '& svg': {
                                                fontSize: '20px'
                                            }
                                        }}
                                    >
                                        {React.cloneElement(step.icon, { 
                                            style: { color: activeStep >= index ? '#ffffff' : '#666666' }
                                        })}
                                    </Box>
                                )}
                            >
                                {step.label}
                            </StepLabel>
                            <StepContent>
                                {renderStepContent(index)}
                                <Box sx={{ mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        onClick={index === steps.length - 1 ? createOpportunityAndQuote : handleNext}
                                        disabled={!isStepValid(index) || isLoading}
                                        endIcon={index === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                                    >
                                        {index === steps.length - 1 ? 'Fullfør' : 'Neste'}
                                    </Button>
                                    <Button
                                        disabled={index === 0}
                                        onClick={handleBack}
                                        sx={{ ml: 1 }}
                                        startIcon={<ArrowBack />}
                                    >
                                        Tilbake
                                    </Button>
                                </Box>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            <AddCustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onCustomerAdded={(newCustomer) => {
                    setCustomers([...customers, newCustomer]);
                    setWorkflowData({ ...workflowData, customer: newCustomer });
                    setIsCustomerModalOpen(false);
                }}
            />
        </Container>
    );
};

export default SalesWorkflowNew;