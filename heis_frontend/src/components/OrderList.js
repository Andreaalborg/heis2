import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/orders/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const orderData = response.data.results || response.data;
            setOrders(Array.isArray(orderData) ? orderData : []);
        } catch (err) {
            console.error('Feil ved henting av ordre:', err.response || err.message);
            setError('Kunne ikke hente ordrelisten.');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    }

    // Excel eksport funksjon
    const exportToExcel = () => {
        const exportData = orders.map(order => ({
            'Ordre ID': order.id,
            'Kunde': order.customer_name || '-',
            'Ordredato': formatDate(order.order_date),
            'Status': order.status_display,
            'Tilbudsnummer': order.quote_number || '-',
            'Totalsum': order.total_amount || 0,
            'Notater': order.notes || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ordrer');

        // Generer Excel fil
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `Ordrer_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Ordreoversikt</h1>
                <button 
                    className="btn btn-outline-success"
                    onClick={exportToExcel}
                >
                    <i className="fas fa-download me-2"></i>Excel
                </button>
            </div>
            {/* TODO: Filter/Sort UI */}

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Laster ordre...</p>}

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Ordre ID</th>
                        <th>Kunde</th>
                        <th>Ordredato</th>
                        <th>Status</th>
                        <th>Basert på Tilbud</th>
                        <th>Totalsum (kr)</th>
                        <th>Handlinger</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.customer_name || '-'}</td>
                            <td>{formatDate(order.order_date)}</td>
                            <td>{order.status_display}</td>
                            <td>{order.quote_number ? 
                                <Link to={`/quotes/${order.quote}`}>{order.quote_number}</Link> 
                                : '-'}</td>
                            <td>{order.total_amount ? `${order.total_amount} kr` : '-'}</td>
                            <td>
                                <Link 
                                    to={`/orders/${order.id}`} 
                                    className="btn btn-sm btn-info"
                                >
                                    Vis Detaljer
                                </Link>
                                {/* TODO: Andre handlinger? Slett? */} 
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && !isLoading && (
                        <tr><td colSpan="7">Ingen ordre funnet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default OrderList; 