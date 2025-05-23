import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import AddAssignmentModal from './AddAssignmentModal'; // Importer modal for oppdrag

const OrderDetailView = () => {
    const { orderId } = useParams(); // Henter orderId fra URL
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // State for redigering av ordre (f.eks. status, notater)
    const [editableOrderData, setEditableOrderData] = useState({ 
        status: '', 
        notes: '' 
    });
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    // TODO: Statiske statusvalg for ordre basert på modellen
    const orderStatusOptions = [
        { value: 'pending', label: 'Avventer Behandling'},
        { value: 'processing', label: 'Under Behandling'},
        { value: 'shipped', label: 'Sendt/Levert'},
        { value: 'invoiced', label: 'Fakturert'},
        { value: 'completed', label: 'Fullført'},
        { value: 'cancelled', label: 'Kansellert'},
    ];

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    // Oppdater redigerbar state når ordre-data lastes
     useEffect(() => {
        if (order) {
            setEditableOrderData({
                status: order.status || '',
                notes: order.notes || '',
            });
        }
    }, [order]);

    const fetchOrderDetails = async (showLoading = true) => {
        if (showLoading && !isLoading) setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/api/orders/${orderId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            setOrder(response.data);
        } catch (err) {
            console.error('Feil ved henting av ordredetaljer:', err.response || err.message);
            setError('Kunne ikke hente ordredetaljer.');
            setOrder(null);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Håndterer endringer i input-feltene for ordren
    const handleOrderInputChange = (e) => {
        const { name, value } = e.target;
        setEditableOrderData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Lagrer endringer i ordren (status, notater)
    const handleSaveOrderDetails = async () => {
        setIsSavingOrder(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const dataToSave = {
                status: editableOrderData.status,
                notes: editableOrderData.notes,
            };
            await axios.patch(`http://localhost:8000/api/orders/${orderId}/`, dataToSave, {
                headers: { 'Authorization': `Token ${token}` }
            });
            fetchOrderDetails(false); 
            alert('Ordredetaljer lagret!'); 
        } catch (err) {
            console.error('Feil ved lagring av ordredetaljer:', err.response || err.message);
            setError('Kunne ikke lagre ordredetaljer.');
        } finally {
            setIsSavingOrder(false);
        }
    };

    // Åpne modal for å legge til nytt oppdrag basert på ordre
    const handleOpenCreateAssignmentModal = () => {
        setIsAssignmentModalOpen(true);
    };

    // Lukk oppdragsmodalen
    const handleCloseAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
    };

    // Håndterer lagring fra oppdragsmodal (trenger kanskje ikke refetch her,
    // men kan være greit å ha for konsistens eller hvis modalen lukkes)
    const handleAssignmentSaved = () => {
        handleCloseAssignmentModal();
        // Kan evt. hente ordredetaljer på nytt hvis vi vil vise noe relatert til oppdraget
        fetchOrderDetails(false); 
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    }

    if (isLoading && !order) { 
        return <p>Laster ordredetaljer...</p>;
    }
    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }
    if (!order) {
        return <p>Fant ikke ordren.</p>;
    }

    return (
        <div className="container mt-4">
            <h1>Ordre ID: {order.id}</h1>
            
            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    Detaljer
                    <button 
                        className="btn btn-sm btn-primary" 
                        onClick={handleSaveOrderDetails}
                        disabled={isSavingOrder}
                    >
                        {isSavingOrder ? 'Lagrer...' : 'Lagre Endringer'}
                    </button>
                </div>
                <div className="card-body">
                    <div className="row mb-2">
                        <label htmlFor="status" className="col-md-3 col-form-label"><strong>Status:</strong></label>
                        <div className="col-md-9">
                            <select 
                                className="form-select" 
                                id="status" 
                                name="status"
                                value={editableOrderData.status}
                                onChange={handleOrderInputChange}
                            >
                                {orderStatusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Kunde:</strong></div>
                        <div className="col-md-9">{order.customer_name || '-'}</div>
                    </div>
                     <div className="row mb-2">
                        <div className="col-md-3"><strong>Basert på Tilbud:</strong></div>
                        <div className="col-md-9">
                            {order.quote_number ? 
                                <Link to={`/quotes/${order.quote}`}>{order.quote_number}</Link> 
                                : '-'}
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Ordredato:</strong></div>
                        <div className="col-md-9">{formatDate(order.order_date)}</div>
                    </div>
                     <div className="row mb-3">
                        <label htmlFor="notes" className="col-md-3 col-form-label"><strong>Notater (intern):</strong></label>
                        <div className="col-md-9">
                            <textarea 
                                className="form-control" 
                                id="notes" 
                                name="notes" 
                                rows="3" 
                                value={editableOrderData.notes}
                                onChange={handleOrderInputChange}
                            ></textarea>
                        </div>
                    </div>
                    {/* Kan legge til flere felter her */} 
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header">Ordrelinjer</div>
                <div className="card-body">
                    {order.line_items && order.line_items.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Heistype</th>
                                    <th>Antall</th>
                                    <th>Pris ved bestilling (kr)</th>
                                    <th>Linjesum (kr)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.line_items.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.elevator_type_details?.name || '-'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit_price_at_order ? `${item.unit_price_at_order} kr` : '-'}</td>
                                        <td>{item.line_total ? `${item.line_total} kr` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Ingen ordrelinjer.</p>
                    )}
                </div>
                 <div className="card-footer d-flex justify-content-between align-items-center">
                    <strong>Totalsum: {order.total_amount} kr</strong>
                    {/* Knapp for å opprette oppdrag */} 
                    {!order.assignment_ids || order.assignment_ids.length === 0 ? (
                        <button 
                            className="btn btn-success"
                            onClick={handleOpenCreateAssignmentModal}
                            disabled={isSavingOrder} // Deaktiver hvis ordre lagres
                        >
                           <i className="fas fa-plus me-1"></i> Opprett Oppdrag
                        </button>
                    ) : (
                        <span className="text-muted">
                           Oppdrag opprettet ({/* Kan vise lenker til oppdrag her */}
                            {order.assignment_ids.map((id, index) => (
                                <React.Fragment key={id}>
                                    {index > 0 && ', '}
                                    <Link to={`/assignments/${id}`}>#{id}</Link>
                                </React.Fragment>
                            ))})
                        </span>
                    )}
                </div>
            </div>

            {/* Modal for å legge til oppdrag */}
            <AddAssignmentModal 
                isOpen={isAssignmentModalOpen}
                onClose={handleCloseAssignmentModal}
                onAssignmentSaved={handleAssignmentSaved}
                // Sender med relevant info for å forhåndsutfylle
                initialData={{
                    order: order.id, // Kobler oppdraget til ordren!
                    customer: order.customer, // Bruker kunde-ID fra ordren
                    title: `Oppdrag for Ordre ${order.id}`, // Forslag til tittel
                    // Legger til en standard beskrivelse
                    description: `Utføre arbeid relatert til ordre ${order.id} (${order.customer_name}). Detaljer: ${order.notes || 'Ingen ordrenotater.'}`, 
                    assignment_type: 'installation' // Antar installasjon som default
                }}
            />
        </div>
    );
};

export default OrderDetailView; 