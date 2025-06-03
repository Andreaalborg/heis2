import React, { useState, useEffect } from 'react';
import SalesPipelineBoard from '../SalesPipelineBoard';
import AddEditOpportunityModal from '../AddEditOpportunityModal';
import ProjectSummaryTable from '../ProjectSummaryTable';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SelgerDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [dashboardStats, setDashboardStats] = useState({
        totalOpportunities: 0,
        wonThisMonth: 0,
        totalValue: 0,
        activeQuotes: 0,
        recentCustomers: []
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [preselectedCustomerId, setPreselectedCustomerId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardStats();
    }, [refreshKey]);

    const fetchDashboardStats = async () => {
        setIsLoadingStats(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // Hent salgsmuligheter
            const opportunitiesRes = await axios.get(`${API_BASE_URL}/api/sales-opportunities/`, { headers });
            const opportunities = opportunitiesRes.data.results || opportunitiesRes.data;

            // Hent kunder
            const customersRes = await axios.get(`${API_BASE_URL}/api/customers/`, { headers });
            const customers = customersRes.data.results || customersRes.data;

            // Hent tilbud
            const quotesRes = await axios.get(`${API_BASE_URL}/api/quotes/`, { headers });
            const quotes = quotesRes.data.results || quotesRes.data;

            // Beregn statistikk
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const wonThisMonth = opportunities.filter(opp => {
                const createdDate = new Date(opp.created_at);
                return opp.status === 'won' && 
                       createdDate.getMonth() === thisMonth && 
                       createdDate.getFullYear() === thisYear;
            }).length;

            const totalValue = opportunities
                .filter(opp => opp.status !== 'lost')
                .reduce((sum, opp) => sum + (parseFloat(opp.estimated_value) || 0), 0);

            const activeQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length;

            // Siste 5 kunder
            const recentCustomers = customers.slice(0, 5);

            setDashboardStats({
                totalOpportunities: opportunities.length,
                wonThisMonth,
                totalValue,
                activeQuotes,
                recentCustomers
            });
        } catch (error) {
            console.error('Feil ved henting av dashboard-statistikk:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreselectedCustomerId(null);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setRefreshKey(prevKey => prevKey + 1);
    };

    const handleQuickAddOpportunity = (customerId) => {
        // Åpne modal med forhåndsvalgt kunde
        setPreselectedCustomerId(customerId);
        setIsModalOpen(true);
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Selger Dashboard</h1>
                <div>
                    <button className="btn btn-outline-primary me-2" onClick={() => navigate('/customers')}>
                        <i className="fas fa-users me-2"></i>Se alle kunder
                    </button>
                    <button className="btn btn-success" onClick={handleOpenAddModal}>
                        <i className="fas fa-plus me-2"></i>Ny Salgsmulighet
                    </button>
                </div>
            </div>

            {/* Statistikk-kort */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h5 className="card-title">Aktive salgsmuligheter</h5>
                            <h2 className="mb-0">{dashboardStats.totalOpportunities}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <h5 className="card-title">Vunnet denne måneden</h5>
                            <h2 className="mb-0">{dashboardStats.wonThisMonth}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h5 className="card-title">Total potensiell verdi</h5>
                            <h2 className="mb-0">{dashboardStats.totalValue.toLocaleString()} kr</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-dark">
                        <div className="card-body">
                            <h5 className="card-title">Aktive tilbud</h5>
                            <h2 className="mb-0">{dashboardStats.activeQuotes}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hurtigtilgang til kunder */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Siste kunder</h5>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/customers')}>
                                Se alle
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {dashboardStats.recentCustomers.map(customer => (
                                    <div key={customer.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1">{customer.name}</h6>
                                            <small className="text-muted">{customer.city} - {customer.email}</small>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleQuickAddOpportunity(customer.id)}
                                        >
                                            <i className="fas fa-plus me-1"></i>Ny mulighet
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Salgspipeline */}
            <SalesPipelineBoard key={refreshKey} />

            {/* Prosjektsammendrag */}
            <div className="mt-5">
                <ProjectSummaryTable />
            </div>

            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                opportunityToEdit={null}
                preselectedCustomerId={preselectedCustomerId}
            />
        </div>
    );
};

export default SelgerDashboard; 