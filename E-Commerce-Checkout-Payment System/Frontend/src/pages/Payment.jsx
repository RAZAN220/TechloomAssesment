import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCheckoutSession } from '../services/checkoutService';
import { processPayment } from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

const PAYMENT_OPTIONS = [
  {
    key: 'success',
    label: 'Simulate Success',
    description: 'The mock gateway approves this payment.',
    className: 'btn-success',
  },
  {
    key: 'failure',
    label: 'Simulate Failure',
    description: 'The mock gateway declines the card — reserved stock is released.',
    className: 'btn-danger',
  },
  {
    key: 'timeout',
    label: 'Simulate Timeout',
    description: 'The gateway stalls ~6s, then resolves as a timeout — stock is released.',
    className: 'btn-warning',
  },
];

const Payment = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  // Disables ALL payment buttons while any request is in flight
  const [pendingOption, setPendingOption] = useState(null);

  useDocumentTitle('Payment');

  useEffect(() => {
    let active = true;
    getCheckoutSession(sessionId)
      .then((s) => active && setSession(s))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [sessionId]);

  const handlePay = async (simulate) => {
    setPendingOption(simulate);
    try {
      const result = await processPayment({ checkoutSessionId: sessionId, simulate });
      toast.info(`Payment ${result.payment.status}`);
      navigate(`/payment/result/${sessionId}`);
    } catch (e) {
      toast.error(e.message);
      // Re-sync the session state (it may have been finalized server-side)
      getCheckoutSession(sessionId).then(setSession).catch(() => {});
    } finally {
      setPendingOption(null);
    }
  };

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

  if (!session) return <LoadingSpinner full label="Loading payment…" />;

  const payable = session.status === 'Reserved';

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Payment</h1>
        <p className="muted">
          This is a <strong>mock payment gateway</strong> — choose a simulated outcome. No real
          money moves.
        </p>
      </div>

      <div className="card payment-card">
        <div className="checkout-status">
          <span className="muted">Amount due</span>
          <span className="product-price big">{formatCurrency(session.total)}</span>
        </div>
        <div className="checkout-status">
          <span className="muted">Session</span>
          <OrderStatusBadge status={session.status} />
        </div>

        {session.payment && (
          <p className="muted small">
            Latest attempt: <OrderStatusBadge status={session.payment.status} />
          </p>
        )}

        {payable ? (
          <>
            <div className="payment-options">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`btn ${option.className} btn-block payment-option`}
                  disabled={pendingOption !== null}
                  onClick={() => handlePay(option.key)}
                >
                  {pendingOption === option.key ? 'Processing…' : option.label}
                </button>
              ))}
            </div>
            <p className="muted small">
              Buttons are disabled while a payment is in progress. The backend enforces
              idempotency — even a double-click cannot charge twice.
            </p>
          </>
        ) : (
          <div className="alert alert-warning" role="alert">
            This checkout session is <strong>{session.status}</strong> and can no longer be paid.
            {session.status === 'Expired' && (
              <>
                {' '}
                <Link to="/cart">Start a new checkout</Link> to reserve stock again.
              </>
            )}
            {session.status === 'Paid' && (
              <>
                {' '}
                <Link to={`/payment/result/${sessionId}`}>View the payment result</Link>.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
