import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AddEditQuoteLineModal from './AddEditQuoteLineModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const QuoteDetailView = () => {
    const { quoteId } = useParams(); // Henter quoteId fra URL
    const [quote, setQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLineModalOpen, setIsLineModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const navigate = useNavigate(); // Hent navigate

    // State for redigering av selve tilbudet
    const [editableQuoteData, setEditableQuoteData] = useState({ 
        expiry_date: '', 
        notes: '', 
        customer_notes: '' 
    });
    const [isSavingQuote, setIsSavingQuote] = useState(false);

    useEffect(() => {
        if (quoteId) {
            fetchQuoteDetails();
        }
    }, [quoteId]); // Kjør når quoteId endres

    // Oppdater editerbar state når quote-data lastes
    useEffect(() => {
        if (quote) {
            setEditableQuoteData({
                // Håndterer null-verdier fra API for dato
                expiry_date: quote.expiry_date || '',
                notes: quote.notes || '',
                customer_notes: quote.customer_notes || ''
            });
        }
    }, [quote]);

    const fetchQuoteDetails = async (showLoading = true) => {
        if (showLoading && !isLoading) setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/quotes/${quoteId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            setQuote(response.data);
        } catch (err) {
            console.error('Feil ved henting av tilbudsdetaljer:', err.response || err.message);
            setError('Kunne ikke hente tilbudsdetaljer.');
            setQuote(null);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const handleOpenAddLineModal = () => {
        setEditingLine(null);
        setIsLineModalOpen(true);
    };

    const handleCloseLineModal = () => {
        setIsLineModalOpen(false);
        setEditingLine(null);
    };

    const handleLineSave = () => {
        handleCloseLineModal();
        fetchQuoteDetails();
    };

    // Åpne modal for å REDIGERE eksisterende linje
    const handleOpenEditLineModal = (line) => {
        setEditingLine(line); // Sett linjen som skal redigeres
        setIsLineModalOpen(true);
    };

    // Slett linjeelement
    const handleDeleteLineItem = async (lineItemId) => {
        if (window.confirm('Er du sikker på at du vil slette denne linjen?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/quote-line-items/${lineItemId}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                fetchQuoteDetails(); // Refresh quote details
            } catch (err) {
                console.error('Feil ved sletting av tilbudslinje:', err.response || err.message);
                setError('Kunne ikke slette tilbudslinjen.');
            }
        }
    };

    // Håndterer endringer i input-feltene for tilbudet
    const handleQuoteInputChange = (e) => {
        const { name, value } = e.target;
        setEditableQuoteData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Lagrer endringer i tilbudshodet
    const handleSaveQuoteDetails = async () => {
        setIsSavingQuote(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            // Sender kun feltene som kan redigeres
            const dataToSave = {
                expiry_date: editableQuoteData.expiry_date || null, // Send null hvis tom dato
                notes: editableQuoteData.notes,
                customer_notes: editableQuoteData.customer_notes
            };
            await axios.patch(`${API_BASE_URL}/api/quotes/${quoteId}/`, dataToSave, {
                headers: { 'Authorization': `Token ${token}` }
            });
            // Hent oppdaterte data etter lagring (uten full loading-skjerm)
            fetchQuoteDetails(false); 
            alert('Tilbudsdetaljer lagret!'); // Enkel bekreftelse
        } catch (err) {
            console.error('Feil ved lagring av tilbudsdetaljer:', err.response || err.message);
            setError('Kunne ikke lagre tilbudsdetaljer.');
        } finally {
            setIsSavingQuote(false);
        }
    };

    // Oppdaterer status for tilbudet
    const handleUpdateStatus = async (newStatus) => {
        // Bekreftelse kan legges til her om ønskelig
        // if (!window.confirm(`Er du sikker på at du vil merke tilbudet som ${newStatus}?`)) return;
        
        // Bruker isSavingQuote for å deaktivere knapper under lagring
        setIsSavingQuote(true); 
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/quotes/${quoteId}/`, 
                { status: newStatus }, // Send kun den nye statusen
                { headers: { 'Authorization': `Token ${token}` } }
            );
            // Hent oppdaterte data etter lagring
            fetchQuoteDetails(false); 
            alert(`Tilbudsstatus oppdatert til: ${newStatus}`); // Enkel bekreftelse
        } catch (err) {
            console.error(`Feil ved oppdatering av status til ${newStatus}:`, err.response || err.message);
            setError('Kunne ikke oppdatere tilbudsstatus.');
        } finally {
            setIsSavingQuote(false);
        }
    };

    // Oppretter ordre fra tilbud
    const handleCreateOrder = async () => {
        if (!quote || quote.status !== 'accepted') return;
        if (quote.order) { // Sjekk om quote.order (ID) finnes
            alert('Det finnes allerede en ordre for dette tilbudet.');
            // Kan evt. navigere til ordren: navigate(`/orders/${quote.order}`);
            return;
        }

        setIsCreatingOrder(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            // Kaller det nye custom action-endepunktet
            const response = await axios.post(`${API_BASE_URL}/api/quotes/${quoteId}/create-order/`, 
                {}, // Ingen data trengs i body
                { headers: { 'Authorization': `Token ${token}` } }
            );

            if (response.status === 201 && response.data.id) {
                const newOrderId = response.data.id;
                alert(`Ordre ${newOrderId} opprettet!`);
                // Naviger til den nye ordresiden (når den finnes)
                // navigate(`/orders/${newOrderId}`);
                // Eller oppdater tilbudsdata for å vise at ordre er koblet
                fetchQuoteDetails(false); 
            } else {
                 setError('Kunne ikke opprette ordre.');
                 // Hent på nytt for å vise evt. eksisterende ordre hvis feil 
                 // skyldes noe annet enn duplikat
                 fetchQuoteDetails(false); 
            }
        } catch (err) {
            console.error('Feil ved oppretting av ordre:', err.response || err.message);
            setError(`Kunne ikke opprette ordre: ${err.response?.data?.detail || err.message}`);
            // Hent på nytt uansett for å vise korrekt status/lenke
            fetchQuoteDetails(false);
        } finally {
            setIsCreatingOrder(false);
        }
    };

    if (isLoading && !quote) {
        return <p>Laster tilbudsdetaljer...</p>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!quote) {
        return <p>Laster...</p>;
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                 <h1>Tilbud: {quote.quote_number || `ID ${quote.id}`}</h1>
                 {/* PDF-knapp */} 
                 <a 
                    href={`${API_BASE_URL}/api/quotes/${quoteId}/pdf/`} 
                    className="btn btn-secondary"
                    target="_blank" // Åpner i ny fane/trigger nedlasting
                    rel="noopener noreferrer"
                 >
                    <i className="fas fa-file-pdf me-2"></i>Last ned PDF
                 </a>
            </div>
            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    Detaljer
                    <button 
                        className="btn btn-sm btn-primary" 
                        onClick={handleSaveQuoteDetails}
                        disabled={isSavingQuote}
                    >
                        {isSavingQuote ? 'Lagrer...' : 'Lagre Endringer'}
                    </button>
                </div>
                <div className="card-body">
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Status:</strong></div>
                        <div className="col-md-9">{quote.status_display}</div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Salgsmulighet:</strong></div>
                        <div className="col-md-9">
                            {quote.opportunity_details?.name || '-'}
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Kunde:</strong></div>
                        <div className="col-md-9">{quote.opportunity_details?.customer_name || '-'}</div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-3"><strong>Utstedt dato:</strong></div>
                        <div className="col-md-9">{formatDate(quote.issue_date)}</div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="expiry_date" className="col-md-3 col-form-label"><strong>Gyldig til:</strong></label>
                        <div className="col-md-9">
                            <input 
                                type="date" 
                                className="form-control" 
                                id="expiry_date" 
                                name="expiry_date" 
                                value={editableQuoteData.expiry_date}
                                onChange={handleQuoteInputChange}
                            />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="notes" className="col-md-3 col-form-label"><strong>Notater (intern):</strong></label>
                        <div className="col-md-9">
                            <textarea 
                                className="form-control" 
                                id="notes" 
                                name="notes" 
                                rows="3" 
                                value={editableQuoteData.notes}
                                onChange={handleQuoteInputChange}
                            ></textarea>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="customer_notes" className="col-md-3 col-form-label"><strong>Notater (kunde):</strong></label>
                        <div className="col-md-9">
                             <textarea 
                                className="form-control" 
                                id="customer_notes" 
                                name="customer_notes" 
                                rows="3" 
                                value={editableQuoteData.customer_notes}
                                onChange={handleQuoteInputChange}
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* Knapper for statusendring */} 
            <div className="mb-4 d-flex justify-content-end gap-2">
                {quote.status === 'draft' && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => handleUpdateStatus('sent')}
                        disabled={isSavingQuote}
                    >
                        Merk som Sendt
                    </button>
                )}
                {quote.status === 'sent' && (
                    <>
                        <button 
                            className="btn btn-success" 
                            onClick={() => handleUpdateStatus('accepted')}
                            disabled={isSavingQuote}
                        >
                            Merk som Akseptert
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={() => handleUpdateStatus('rejected')}
                            disabled={isSavingQuote}
                        >
                            Merk som Avslått
                        </button>
                    </>
                )}
                {(quote.status === 'accepted' || quote.status === 'rejected') && (
                     <button 
                        className="btn btn-secondary" 
                        onClick={() => handleUpdateStatus('draft')}
                        disabled={isSavingQuote}
                        title="Tilbakestill til utkast for redigering"
                    >
                        Gjør om til Utkast
                    </button>
                )}
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-center">
                {/* Create Order Button */} 
                <div>
                    {quote.status === 'accepted' && !quote.order && ( // Vis kun hvis akseptert OG ingen ordre finnes
                         <button 
                            className="btn btn-success" 
                            onClick={handleCreateOrder}
                            disabled={isCreatingOrder || isSavingQuote}
                        >
                            {isCreatingOrder ? 'Oppretter Ordre...' : 'Opprett Ordre'}
                        </button>
                    )}
                    {quote.order && ( // Vis lenke til ordren hvis den finnes
                        <Link to={`/orders/${quote.order}`} className="btn btn-outline-primary">
                            Vis Ordre ({quote.order})
                        </Link>
                    )}
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    Linjeelementer
                    <button className="btn btn-sm btn-success" onClick={handleOpenAddLineModal}>
                        <i className="fas fa-plus me-1"></i> Legg til linje
                    </button>
                </div>
                <div className="card-body">
                    {quote.line_items && quote.line_items.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Beskrivelse</th>
                                    <th>Antall</th>
                                    <th>Enhetspris</th>
                                    <th>Linjesum</th>
                                    <th>Handlinger</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.line_items.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.elevator_type_details?.name || 'Ukjent heistype'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.elevator_type_details?.price ? `${item.elevator_type_details.price} kr` : '-'}</td>
                                        <td>{item.line_total ? `${item.line_total} kr` : '-'}</td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-warning me-1" 
                                                onClick={() => handleOpenEditLineModal(item)}
                                            >
                                                Rediger
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger" 
                                                onClick={() => handleDeleteLineItem(item.id)}
                                            >
                                                Slett
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Ingen linjeelementer lagt til enda.</p>
                    )}
                </div>
                <div className="card-footer text-end">
                    <strong>Totalsum: {quote.total_amount} kr</strong>
                </div>
            </div>

            <AddEditQuoteLineModal
                isOpen={isLineModalOpen}
                onClose={handleCloseLineModal}
                onSave={handleLineSave}
                quoteId={quoteId}
                lineToEdit={editingLine}
            />
        </div>
    );
};

export default QuoteDetailView; 