import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

    return (
        <div className="container mt-4">
            <h1>Ordreoversikt</h1>
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