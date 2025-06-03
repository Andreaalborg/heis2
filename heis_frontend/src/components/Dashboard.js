import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        
        let currentUserInfo = null;
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                currentUserInfo = JSON.parse(userString);
                setUserInfo(currentUserInfo);
            }
            
            const [customerRes, userRes, assignmentRes] = await Promise.all([
                apiClient.get('/api/customers/'),
                apiClient.get('/api/users/'),
                apiClient.get('/api/assignments/?ordering=scheduled_date,scheduled_time')
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
        fetchDashboardData();
    }, []);

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

    const dueSoonAssignmentsForTable = useMemo(() => {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return allAssignments
            .filter(a => {
                const isCompleted = a.status === 'ferdig' || a.status === 'fakturert';
                if (isCompleted) return false;

                const deadline = a.deadline_date ? new Date(a.deadline_date) : null;
                const scheduled = a.scheduled_date ? new Date(a.scheduled_date) : null;
                
                const relevantDate = deadline || scheduled;

                if (!relevantDate) return false;

                // Check if the date string is valid before creating a new Date object from it for comparison
                const relevantDateObj = new Date(relevantDate);
                if (isNaN(relevantDateObj.getTime())) return false;


                return relevantDateObj >= now && relevantDateObj <= oneWeekFromNow;
            })
            .sort((a, b) => {
                const dateA = new Date(a.deadline_date || a.scheduled_date);
                const dateB = new Date(b.deadline_date || b.scheduled_date);
                return dateA - dateB;
            })
            .slice(0, 5); // Viser de 5 første oppdragene som er nær frist
    }, [allAssignments]);

    // Oppdatert statCards med flatere design og lik størrelse
    const statCards = [
        {
            label: 'Aktive Oppdrag',
            value: stats.activeTotal,
            icon: <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            bgcolor: 'white',
            color: 'primary.main',
            border: '2px solid',
            borderColor: 'primary.light',
        },
        {
            label: 'Mine Aktive',
            value: stats.assignedToMe,
            icon: <PersonIcon sx={{ fontSize: 40, color: 'info.main' }} />,
            bgcolor: 'white',
            color: 'info.main',
            border: '2px solid',
            borderColor: 'info.light',
        },
        {
            label: 'Nye Oppdrag',
            value: stats.statusNew,
            icon: <NewReleasesIcon sx={{ fontSize: 40, color: 'success.main' }} />,
            bgcolor: 'white',
            color: 'success.main',
            border: '2px solid',
            borderColor: 'success.light',
        },
        {
            label: 'Pågående',
            value: stats.statusInProgress,
            icon: <PlayCircleFilledWhiteIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
            bgcolor: 'white',
            color: 'warning.main',
            border: '2px solid',
            borderColor: 'warning.light',
        },
        {
            label: 'Nær Frist (7 dager)',
            value: stats.dueSoon,
            icon: <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main' }} />,
            bgcolor: 'white',
            color: 'error.main',
            border: '2px solid',
            borderColor: 'error.main',
        },
    ];

    // Funksjon for å bestemme farge på status-badge
    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'ny':
                return { bgcolor: 'info.light', color: 'info.dark' };
            case 'tildelt':
                return { bgcolor: 'secondary.light', color: 'secondary.dark' };
            case 'påbegynt':
            case 'in_progress':
                return { bgcolor: 'warning.light', color: 'warning.dark' };
            case 'ferdig':
            case 'completed':
                return { bgcolor: 'success.light', color: 'success.dark' };
            case 'fakturert':
                return { bgcolor: 'success.main', color: 'white' };
            case 'pending':
                return { bgcolor: 'grey.300', color: 'grey.800' };
            default:
                return { bgcolor: 'grey.200', color: 'text.primary' };
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}><Typography>Laster dashboard...</Typography></Box>;
    }
    
    if (error) {
        return <Box sx={{ color: 'error.main', p: 2 }}>{error}</Box>;
    }
    
    return (
        <Box sx={{ mt: 4, mb: 2 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md={8}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Velkommen {userInfo?.first_name || userInfo?.username}!
                    </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchDashboardData}
                        disabled={isLoading}
                        sx={{ mb: { xs: 2, md: 0 } }}
                    >
                    {isLoading ? 'Oppdaterer...' : 'Oppdater'}
                    </Button>
                </Grid>
            </Grid>

            {/* Statistikk kort */}
            <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                {statCards.map((card) => (
                    <Grid item xs={12} sm={6} md={2.4} key={card.label}>
                        <Card
                            sx={{
                                bgcolor: card.bgcolor,
                                color: card.color,
                                border: card.border,
                                borderColor: card.borderColor,
                                boxShadow: 3,
                                borderRadius: 1,
                                minHeight: 130,
                                minWidth: 180,
                                maxWidth: 220,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                m: 'auto',
                                transition: 'transform 0.15s',
                                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
                            }}
                        >
                            <Box sx={{ mb: 1 }}>{card.icon}</Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{card.value}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, textAlign: 'center', px: 1 }}>{card.label}</Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Kommende oppdrag */}
            <Card sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
                <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Kommende Oppdrag</Typography>}
                    action={
                        <Button component={Link} to="/assignments" variant="text" size="small">
                            Se alle
                        </Button>
                    }
                />
                <CardContent>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Søk i tittel/kunde"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            sx={{ width: { xs: '100%', sm: '300px' } }}
                        />
                    </Box>
                    {filteredAndLimitedAssignments.length === 0 ? (
                        <Typography color="text.secondary">
                            {searchTerm ? 'Ingen treff på søket.' : 'Ingen aktive kommende oppdrag funnet.'}
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Dato</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Tid</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Tittel</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Kunde</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Tildelt</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Frist</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAndLimitedAssignments.map((assignment) => {
                                        const badgeStyle = getStatusBadgeStyle(assignment.status);
                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell>{formatDate(assignment.scheduled_date)}</TableCell>
                                                <TableCell>{formatTime(assignment.scheduled_date)}</TableCell>
                                                <TableCell>{assignment.title}</TableCell>
                                                <TableCell>{customers[assignment.customer] || '-'}</TableCell>
                                                <TableCell>{users[assignment.assigned_to] || '-'}</TableCell>
                                                <TableCell>
                                                    <Box component="span" sx={{
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 2,
                                                        bgcolor: badgeStyle.bgcolor,
                                                        color: badgeStyle.color,
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        boxShadow: 1,
                                                        textTransform: 'capitalize',
                                                    }}>
                                                {getStatusLabel(assignment.status)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{formatDate(assignment.deadline_date)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Oppdrag Nær Frist (Neste 7 Dager) */}
            <Card sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
                <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Oppdrag Nær Frist (Neste 7 Dager)</Typography>}
                />
                <CardContent>
                    {dueSoonAssignmentsForTable.length === 0 ? (
                        <Typography color="text.secondary">
                            Ingen oppdrag med frist innen 7 dager.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Tittel</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Kunde</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Tildelt</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Planlagt</TableCell>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Frist</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dueSoonAssignmentsForTable.map((assignment) => {
                                        const badgeStyle = getStatusBadgeStyle(assignment.status);
                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell>{assignment.title}</TableCell>
                                                <TableCell>{customers[assignment.customer] || '-'}</TableCell>
                                                <TableCell>{users[assignment.assigned_to] || '-'}</TableCell>
                                                <TableCell>
                                                    <Box component="span" sx={{
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 2,
                                                        bgcolor: badgeStyle.bgcolor,
                                                        color: badgeStyle.color,
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        boxShadow: 1,
                                                        textTransform: 'capitalize',
                                                    }}>
                                                        {getStatusLabel(assignment.status)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{formatDate(assignment.scheduled_date)}</TableCell>
                                                <TableCell>{formatDate(assignment.deadline_date)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default Dashboard; 