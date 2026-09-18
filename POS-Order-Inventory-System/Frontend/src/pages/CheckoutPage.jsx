import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getRemainingSeconds(order) {
  if (!order?.reservationExpiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(order.reservationExpiresAt).getTime() - Date.now()) / 1000));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function CheckoutPage() {
  const location = useLocation();
  const transferredOrder = location.state?.order;
  const [currentOrder, setCurrentOrder] = useState(transferredOrder || null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(!transferredOrder);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (transferredOrder) return;

    async function findReservedOrder() {
      try {
        const response = await api.get('/orders');
        const reservedOrder = (response.data?.data || []).find((order) => order.status === 'Reserved');
        setCurrentOrder(reservedOrder || null);
      } catch (loadError) {
        setError(loadError.message || 'Unable to find an order for checkout');
      } finally {
        setLoading(false);
      }
    }

    findReservedOrder();
  }, [transferredOrder]);

  useEffect(() => {
    if (!currentOrder?.reservationExpiresAt) return undefined;

    const updateTimer = () => setTimer(getRemainingSeconds(currentOrder));
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [currentOrder?._id, currentOrder?.reservationExpiresAt]);

  const formatTimer = useMemo(() => formatTime(timer), [timer]);

  async function simulatePayment(outcome) {
    if (!currentOrder?._id || saving) return;
    setSaving(outcome);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/payments', { orderId: currentOrder._id, outcome });
      setCurrentOrder(response.data?.data || currentOrder);
      const labels = { success: 'Payment completed successfully.', failure: 'Payment failed. Inventory has been released.', timeout: 'Payment timed out. Inventory has been released.' };
      setMessage(labels[outcome]);
    } catch (paymentError) {
      setError(paymentError.message || 'Unable to process payment');
    } finally {
      setSaving('');
    }
  }

  if (loading) {
    return <section className="page-state"><div className="spinner" /> <p>Preparing checkout...</p></section>;
  }

  if (!currentOrder) {
    return (
      <section className="checkout-page">
        <div className="panel">
          <div className="empty-state large">
            <span className="empty-icon">CO</span>
            <strong>No order is ready for payment</strong>
            <p>Build a cart and complete checkout to reserve inventory.</p>
            <Link className="button primary-button" to="/cart">Open cart</Link>
          </div>
        </div>
      </section>
    );
  }

  const isReserved = currentOrder.status === 'Reserved';

  return (
    <section className="checkout-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Secure payment</p>
          <h2>Checkout</h2>
          <p>Complete payment before the inventory reservation expires.</p>
        </div>
        <span className={`status-badge status-${currentOrder.status.toLowerCase()}`}>{currentOrder.status}</span>
      </div>

      {(error || message) && (
        <div className={`notice ${error ? 'error-notice' : 'success-notice'}`} role="status" aria-live="polite">
          {error || message}
        </div>
      )}

      <div className="checkout-layout">
        <section className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Order {currentOrder.orderNumber}</p>
              <h3>Payment details</h3>
            </div>
            <span className="secure-label">Mock payment</span>
          </div>

          <div className={`reservation-timer ${timer < 60 ? 'is-urgent' : ''}`}>
            <span>Reservation expires in</span>
            <strong>{isReserved ? formatTimer : 'Completed'}</strong>
            <small>{isReserved ? 'Inventory is held for this order' : `Order is now ${currentOrder.status.toLowerCase()}`}</small>
          </div>

          <div className="table-scroll">
            <table className="data-table checkout-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="align-right">Qty</th>
                  <th className="align-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(currentOrder.items || []).map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="product-cell">
                        <span className="product-thumb" aria-hidden="true">{item.name.trim().charAt(0).toUpperCase()}</span>
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="amount-text align-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="payment-options">
            <p className="options-label">Simulate payment outcome</p>
            <div className="payment-option-grid">
              <button className={`payment-option success-option ${saving === 'success' ? 'is-loading' : ''}`} type="button" onClick={() => simulatePayment('success')} disabled={!isReserved || Boolean(saving)}>
                <span className="option-icon">✓</span>
                <span><strong>Success</strong><small>Mark payment as paid</small></span>
              </button>
              <button className={`payment-option warning-option ${saving === 'failure' ? 'is-loading' : ''}`} type="button" onClick={() => simulatePayment('failure')} disabled={!isReserved || Boolean(saving)}>
                <span className="option-icon">!</span>
                <span><strong>Failure</strong><small>Release reserved stock</small></span>
              </button>
              <button className={`payment-option danger-option ${saving === 'timeout' ? 'is-loading' : ''}`} type="button" onClick={() => simulatePayment('timeout')} disabled={!isReserved || Boolean(saving)}>
                <span className="option-icon">↻</span>
                <span><strong>Timeout</strong><small>Expire the reservation</small></span>
              </button>
            </div>
          </div>
        </section>

        <aside className="order-summary checkout-summary">
          <div className="summary-heading">
            <p className="section-kicker">Order summary</p>
            <h3>Payment total</h3>
          </div>
          <div className="summary-line"><span>Items</span><strong>{currentOrder.items?.length || 0}</strong></div>
          <div className="summary-line"><span>Order number</span><strong>{currentOrder.orderNumber}</strong></div>
          <div className="summary-line"><span>Payment status</span><span className={`status-badge status-payment-${currentOrder.paymentStatus}`}>{currentOrder.paymentStatus}</span></div>
          <div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(currentOrder.totalAmount)}</strong></div>
          <p className="summary-note">This demo uses simulated payment outcomes to test the order lifecycle.</p>
          <Link className="button secondary-button summary-button" to="/orders">View all orders</Link>
        </aside>
      </div>
    </section>
  );
}
