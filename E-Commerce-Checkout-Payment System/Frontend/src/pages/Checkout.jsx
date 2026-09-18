import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCheckoutSession } from '../services/checkoutService';
import { useCart } from '../context/CartContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Checkout review page. Shows the reserved order snapshot and an
 * INFORMATIONAL countdown — the backend expiry job remains the source of
 * truth and the session status is re-verified at payment time.
 */
const Checkout = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useDocumentTitle('Checkout');

  useEffect(() => {
    let active = true;
    getCheckoutSession(sessionId)
      .then((s) => {
        if (active) {
          setSession(s);
          setSecondsLeft(s.secondsRemaining ?? 0);
          refresh();
        }
      })
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [sessionId, refresh]);

  useEffect(() => {
    if (secondsLeft == null || secondsLeft <= 0) return undefined;
    const timer = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <span className="state-icon">
          <Icon name="alert" size={26} />
        </span>
        <p>{error.message}</p>
        <Link className="btn btn-outline" to="/cart">
          Back to cart
        </Link>
      </div>
    );
  }

  if (!session) return <LoadingSpinner full label="Preparing checkout…" />;

  const mm = String(Math.floor((secondsLeft || 0) / 60)).padStart(2, '0');
  const ss = String((secondsLeft || 0) % 60).padStart(2, '0');

  return (
    <div className="page">
      <div className="page-head">
        <h1>Checkout</h1>
        <p className="muted">Review your reserved order before paying.</p>
      </div>

      <div className="cart-layout">
        <section className="card" aria-label="Reserved items">
          <div className="checkout-status">
            <span className="muted">Session:</span>
            <code className="session-id">{sessionId}</code>
            <OrderStatusBadge status={session.status} />
          </div>

          {session.items.map((item) => (
            <div className="cart-item" key={item.product}>
              <div className="cart-item-main">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">
                  {formatCurrency(item.price)} × {item.qty}
                </p>
              </div>
              <div className="cart-item-side">
                <span className="cart-item-total">{formatCurrency(item.price * item.qty)}</span>
              </div>
            </div>
          ))}

          {session.status !== 'Reserved' && (
            <div className="alert alert-warning" role="alert">
              This reservation is <strong>{session.status}</strong>. Stock was
              {session.status === 'Expired' ? ' released when the reservation expired' : ' finalized'}.
              {session.status === 'Expired' && (
                <>
                  {' '}
                  <Link to="/cart">Start a new checkout</Link> to try again.
                </>
              )}
            </div>
          )}
        </section>

        <aside className="card cart-summary" aria-label="Checkout summary">
          <h2>Order summary</h2>
          <div className="summary-row muted">
            <span>Items</span>
            <span>{session.items.reduce((sum, i) => sum + i.qty, 0)}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(session.subtotal)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(session.total)}</strong>
          </div>

          {session.status === 'Reserved' && (
            <>
              <div className="countdown" role="timer" aria-live="polite">
                <span className="countdown-label">Reservation expires in</span>
                <span className="countdown-value">
                  {mm}:{ss}
                </span>
              </div>
              <p className="muted small">
                The countdown is informational — the server releases stock automatically when
                the reservation expires.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => navigate(`/payment/${sessionId}`)}
              >
                Continue to payment
              </button>
            </>
          )}

          {session.status === 'Paid' && (
            <Link className="btn btn-primary btn-block" to={`/payment/result/${sessionId}`}>
              This session is already paid — view result
            </Link>
          )}

          {(session.status === 'Failed' || session.status === 'Cancelled') && (
            <Link className="btn btn-outline btn-block" to="/cart">
              Back to cart
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
