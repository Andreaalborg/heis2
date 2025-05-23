import React, { useState } from 'react';
import SalesPipelineBoard from '../SalesPipelineBoard';
import AddEditOpportunityModal from '../AddEditOpportunityModal';
import ProjectSummaryTable from '../ProjectSummaryTable';

const SelgerDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleOpenAddModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setRefreshKey(prevKey => prevKey + 1);
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Selger Dashboard</h1>
                <button className="btn btn-success" onClick={handleOpenAddModal}>
                    <i className="fas fa-plus me-2"></i>Ny Salgsmulighet
                </button>
            </div>
            
            <SalesPipelineBoard key={refreshKey} />

            <div className="mt-5">
                <ProjectSummaryTable />
            </div>

            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                opportunityToEdit={null}
            />
        </div>
    );
};

export default SelgerDashboard; 