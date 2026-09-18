import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data?.data || null);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Unable to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <section className="page-state"><div className="spinner" /> <p>Loading order details...</p></section>;
  }

  if (error && !order) {
    return <section className="panel"><div className="notice error-notice" role="alert">{error}</div><Link className="button secondary-button" to="/orders">Back to orders</Link></section>;
  }

  return (
    <section className="order-details-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Order record</p>
          <h2>Order details</h2>
          <p>Review the items, payment state, and inventory reservation for this sale.</p>
        </div>
        <Link className="button secondary-button" to="/orders">Back to orders</Link>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}</div>}

      <div className="details-grid">
        <section className="panel details-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Order {order.orderNumber}</p>
              <h3>Purchase summary</h3>
            </div>
            <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>

          <div className="detail-list">
            <div><span>Order number</span><strong>{order.orderNumber}</strong></div>
            <div><span>Created</span><strong>{formatDate(order.createdAt)}</strong></div>
            <div><span>Payment status</span><strong><span className={`payment-badge payment-${order.paymentStatus}`}>{order.paymentStatus}</span></strong></div>
            <div><span>Payment reference</span><strong>{order.paymentReference || 'Not assigned'}</strong></div>
            <div><span>Reservation expiry</span><strong>{formatDate(order.reservationExpiresAt)}</strong></div>
          </div>

          <div className="table-scroll">
            <table className="data-table details-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="align-right">Price</th>
                  <th className="align-right">Qty</th>
                  <th className="align-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="product-cell">
                        <span className="product-thumb" aria-hidden="true">{item.name.trim().charAt(0).toUpperCase()}</span>
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td className="amount-text align-right">{formatCurrency(item.price)}</td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="amount-text align-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="order-summary details-summary">
          <div className="summary-heading">
            <p className="section-kicker">Totals</p>
            <h3>Amount due</h3>
          </div>
          <div className="summary-line"><span>Line items</span><strong>{order.items?.length || 0}</strong></div>
          <div className="summary-line"><span>Quantity</span><strong>{order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</strong></div>
          <div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
          <p className="summary-note">Order totals are captured from the cart at checkout.</p>
        </aside>
      </div>
    </section>
  );
}
