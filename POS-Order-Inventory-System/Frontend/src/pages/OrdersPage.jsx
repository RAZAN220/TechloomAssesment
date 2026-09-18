import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data?.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function cancelOrder(orderId) {
    if (!window.confirm('Cancel this reserved order and release its stock?')) return;
    setSaving(orderId);
    setError('');
    try {
      await api.post(`/orders/${orderId}/cancel`);
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, status: 'Cancelled', paymentStatus: 'pending' } : order));
    } catch (cancelError) {
      setError(cancelError.message || 'Unable to cancel order');
    } finally {
      setSaving('');
    }
  }

  const filteredOrders = orders.filter((order) => {
    const queryValue = query.toLowerCase();
    const matchesQuery = order.orderNumber.toLowerCase().includes(queryValue)
      || order.paymentStatus.toLowerCase().includes(queryValue);
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="orders-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Sales history</p>
          <h2>Orders</h2>
          <p>Monitor order status, payment state, and inventory reservations.</p>
        </div>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}</div>}

      <section className="panel orders-panel">
        <div className="panel-heading orders-heading">
          <div>
            <p className="section-kicker">Order book</p>
            <h3>All orders</h3>
            <span className="record-count">{filteredOrders.length} of {orders.length} orders</span>
          </div>
          <div className="inventory-filters">
            <label className="search-field">
              <span className="search-icon" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or payment" aria-label="Search orders" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by order status">
              <option value="all">All statuses</option>
              <option value="reserved">Reserved</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-row">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">OR</span>
            <strong>{orders.length === 0 ? 'No orders yet' : 'No matching orders'}</strong>
            <p>{orders.length === 0 ? 'Completed checkouts will appear in this list.' : 'Try a different search or status filter.'}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Created</th>
                  <th>Order status</th>
                  <th>Payment</th>
                  <th className="align-right">Total</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td><Link className="table-link" to={`/orders/${order._id}`}>{order.orderNumber}</Link></td>
                    <td className="muted-text">{formatDate(order.createdAt)}</td>
                    <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                    <td><span className={`payment-badge payment-${order.paymentStatus}`}>{order.paymentStatus}</span></td>
                    <td className="amount-text align-right">{formatCurrency(order.totalAmount)}</td>
                    <td className="align-right">
                      {order.status === 'Reserved' ? (
                        <button className="button small danger-button" type="button" onClick={() => cancelOrder(order._id)} disabled={saving === order._id}>{saving === order._id ? 'Cancelling...' : 'Cancel'}</button>
                      ) : (
                        <Link className="text-link" to={`/orders/${order._id}`}>Details</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
