import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Paper, Typography, Grid, Card, CardContent,
    Button, IconButton, Chip, Alert, LinearProgress, 
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Tab, Tabs, Badge, Tooltip, Divider
} from '@mui/material';
import {
    AutoMode, Schedule, Notification, TrendingUp, Person,
    CalendarMonth, AttachMoney, Email, Phone, Edit, Delete,
    CheckCircle, Warning, Info, Add, ArrowForward, Settings
} from '@mui/icons-material';
import AddEditOpportunityModal from './AddEditOpportunityModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SalesAutomationNew = () => {
    const [tabValue, setTabValue] = useState(0);
    const [opportunities, setOpportunities] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({
        totalOpportunities: 0,
        totalValue: 0,
        conversionRate: 0,
        avgDaysInPipeline: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            const [oppRes, custRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/sales-opportunities/`, { headers }),
                axios.get(`${API_BASE_URL}/api/customers/`, { headers })
            ]);

            const opps = oppRes.data.results || oppRes.data;
            setOpportunities(opps);
            setCustomers(custRes.data.results || custRes.data);
            
            generateReminders(opps);
            calculateStats(opps);
        } catch (error) {
            console.error('Feil ved henting av data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateReminders = (opps) => {
        const now = new Date();
        const reminders = [];

        opps.forEach(opp => {
            const createdDate = new Date(opp.created_at);
            const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

            // Påminnelser basert på status og alder
            if (opp.status === 'new' && daysSinceCreated > 3) {
                reminders.push({
                    id: `${opp.id}-new`,
                    type: 'warning',
                    opportunity: opp,
                    message: `Ny salgsmulighet har vært ubehandlet i ${daysSinceCreated} dager`,
                    action: 'Kontakt kunde',
                    priority: 'high'
                });
            }

            if (opp.status === 'contacted' && daysSinceCreated > 7) {
                reminders.push({
                    id: `${opp.id}-contacted`,
                    type: 'info',
                    opportunity: opp,
                    message: `Følg opp kontaktet kunde - ${daysSinceCreated} dager siden siste kontakt`,
                    action: 'Send tilbud',
                    priority: 'medium'
                });
            }

            if (opp.status === 'quoted' && daysSinceCreated > 14) {
                reminders.push({
                    id: `${opp.id}-quoted`,
                    type: 'warning',
                    opportunity: opp,
                    message: `Tilbud sendt for ${daysSinceCreated} dager siden - følg opp`,
                    action: 'Ring kunde',
                    priority: 'high'
                });
            }

            // Høyverdi-muligheter
            if (opp.estimated_value > 100000 && opp.status !== 'won' && opp.status !== 'lost') {
                reminders.push({
                    id: `${opp.id}-highvalue`,
                    type: 'info',
                    opportunity: opp,
                    message: `Høyverdi-mulighet (${opp.estimated_value.toLocaleString('nb-NO')} kr) - prioriter oppfølging`,
                    action: 'Planlegg møte',
                    priority: 'high'
                });
            }
        });

        setReminders(reminders.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }));
    };

    const calculateStats = (opps) => {
        const totalOpportunities = opps.length;
        const totalValue = opps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
        const wonOpps = opps.filter(opp => opp.status === 'won');
        const closedOpps = opps.filter(opp => ['won', 'lost'].includes(opp.status));
        const conversionRate = closedOpps.length > 0 ? (wonOpps.length / closedOpps.length) * 100 : 0;

        const daysInPipeline = opps
            .filter(opp => !['won', 'lost'].includes(opp.status))
            .map(opp => {
                const created = new Date(opp.created_at);
                const now = new Date();
                return Math.floor((now - created) / (1000 * 60 * 60 * 24));
            });
        
        const avgDaysInPipeline = daysInPipeline.length > 0 
            ? Math.round(daysInPipeline.reduce((a, b) => a + b, 0) / daysInPipeline.length)
            : 0;

        setStats({
            totalOpportunities,
            totalValue,
            conversionRate: Math.round(conversionRate),
            avgDaysInPipeline
        });
    };

    const handleActionClick = async (reminder) => {
        const opp = reminder.opportunity;
        
        switch (reminder.action) {
            case 'Kontakt kunde':
                // Åpne modal for å oppdatere status til 'contacted'
                setSelectedOpportunity({ ...opp, status: 'contacted' });
                setIsModalOpen(true);
                break;
            
            case 'Send tilbud':
                // Naviger til tilbudsside
                navigate('/quotes/new', { state: { opportunity: opp } });
                break;
            
            case 'Ring kunde':
            case 'Planlegg møte':
                // Åpne modal for å legge til notater
                setSelectedOpportunity(opp);
                setIsModalOpen(true);
                break;
            
            default:
                break;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'info',
            contacted: 'warning',
            quoted: 'secondary',
            negotiating: 'primary',
            won: 'success',
            lost: 'error'
        };
        return colors[status] || 'default';
    };

    const renderDashboard = () => (
        <Grid container spacing={3}>
            {/* Statistikk-kort */}
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Aktive muligheter
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalOpportunities}
                                </Typography>
                            </Box>
                            <TrendingUp color="primary" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Total verdi
                                </Typography>
                                <Typography variant="h4">
                                    {(stats.totalValue / 1000).toFixed(0)}k
                                </Typography>
                            </Box>
                            <AttachMoney color="success" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Konverteringsrate
                                </Typography>
                                <Typography variant="h4">
                                    {stats.conversionRate}%
                                </Typography>
                            </Box>
                            <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Snitt dager i pipeline
                                </Typography>
                                <Typography variant="h4">
                                    {stats.avgDaysInPipeline}
                                </Typography>
                            </Box>
                            <Schedule color="warning" sx={{ fontSize: 40 }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Påminnelser */}
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Automatiske påminnelser ({reminders.length})
                    </Typography>
                    {reminders.length === 0 ? (
                        <Alert severity="success">
                            Ingen påminnelser - alle salgsmuligheter er oppdatert!
                        </Alert>
                    ) : (
                        <List>
                            {reminders.map((reminder) => (
                                <ListItem 
                                    key={reminder.id} 
                                    divider
                                    sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', md: 'row' },
                                        alignItems: { xs: 'flex-start', md: 'center' },
                                        py: 2,
                                        gap: { xs: 2, md: 0 }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flex: 1, alignItems: 'flex-start', gap: 2 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {reminder.type === 'warning' ? (
                                                <Warning color="warning" />
                                            ) : (
                                                <Info color="info" />
                                            )}
                                        </ListItemIcon>
                                        <Box sx={{ flex: 1 }}>
                                            <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mb={1}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {reminder.opportunity.name}
                                                </Typography>
                                                <Chip 
                                                    label={reminder.opportunity.customer_name} 
                                                    size="small" 
                                                    icon={<Person />}
                                                />
                                                <Chip 
                                                    label={`${reminder.opportunity.estimated_value?.toLocaleString('nb-NO')} kr`} 
                                                    size="small" 
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {reminder.message}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ 
                                        ml: { xs: 0, md: 2 }, 
                                        mt: { xs: 1, md: 0 },
                                        width: { xs: '100%', md: 'auto' }
                                    }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            endIcon={<ArrowForward />}
                                            onClick={() => handleActionClick(reminder)}
                                            fullWidth
                                            sx={{ width: { xs: '100%', md: 'auto' } }}
                                        >
                                            {reminder.action}
                                        </Button>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Grid>
        </Grid>
    );

    const renderOpportunities = () => (
        <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    Alle salgsmuligheter
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setSelectedOpportunity(null);
                        setIsModalOpen(true);
                    }}
                >
                    Ny salgsmulighet
                </Button>
            </Box>
            
            <List>
                {opportunities.map((opp) => (
                    <ListItem key={opp.id} divider>
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body1">{opp.name}</Typography>
                                    <Chip 
                                        label={opp.status} 
                                        size="small" 
                                        color={getStatusColor(opp.status)}
                                    />
                                </Box>
                            }
                            secondary={
                                <Box display="flex" alignItems="center" gap={2} mt={1}>
                                    <Chip 
                                        icon={<Person />} 
                                        label={opp.customer_name} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        icon={<AttachMoney />} 
                                        label={`${opp.estimated_value?.toLocaleString('nb-NO')} kr`} 
                                        size="small" 
                                        variant="outlined"
                                        color="success"
                                    />
                                    <Chip 
                                        icon={<CalendarMonth />} 
                                        label={new Date(opp.created_at).toLocaleDateString('nb-NO')} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                onClick={() => {
                                    setSelectedOpportunity(opp);
                                    setIsModalOpen(true);
                                }}
                            >
                                <Edit />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Paper>
    );

    const renderAutomationRules = () => (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Automatiseringsregler
            </Typography>
            <List>
                <ListItem>
                    <ListItemIcon>
                        <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Nye muligheter"
                        secondary="Påminnelse etter 3 dager uten aktivitet"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Kontaktet kunde"
                        secondary="Påminnelse om å sende tilbud etter 7 dager"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Tilbud sendt"
                        secondary="Påminnelse om oppfølging etter 14 dager"
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Høyverdi-muligheter"
                        secondary="Ekstra påminnelser for muligheter over 100.000 kr"
                    />
                </ListItem>
            </List>
            <Alert severity="info" sx={{ mt: 2 }}>
                Automatiseringsreglene kjører kontinuerlig og genererer påminnelser basert på status og alder.
            </Alert>
        </Paper>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                    Salgsautomatisering
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Automatiske påminnelser og oppfølging av salgsmuligheter
                </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab 
                        label="Dashboard" 
                        icon={
                            <Badge badgeContent={reminders.length} color="error">
                                <AutoMode />
                            </Badge>
                        }
                    />
                    <Tab label="Salgsmuligheter" icon={<TrendingUp />} />
                    <Tab label="Automatiseringsregler" icon={<Settings />} />
                </Tabs>
            </Paper>

            {isLoading ? (
                <LinearProgress />
            ) : (
                <>
                    {tabValue === 0 && renderDashboard()}
                    {tabValue === 1 && renderOpportunities()}
                    {tabValue === 2 && renderAutomationRules()}
                </>
            )}

            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOpportunity(null);
                }}
                opportunity={selectedOpportunity}
                onSave={() => {
                    fetchData();
                    setIsModalOpen(false);
                    setSelectedOpportunity(null);
                }}
            />
        </Container>
    );
};

export default SalesAutomationNew;