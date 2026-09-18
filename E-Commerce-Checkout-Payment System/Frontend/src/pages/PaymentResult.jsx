import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCheckoutSession } from '../services/checkoutService';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Authoritative payment result — re-reads the checkout session from the
 * backend (never trusts local state) and renders the corresponding outcome.
 */
const PaymentResult = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useDocumentTitle('Payment result');

  useEffect(() => {
    let active = true;
    getCheckoutSession(sessionId)
      .then((s) => active && setSession(s))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <span className="state-icon">
          <Icon name="alert" size={26} />
        </span>
        <p>{error.message}</p>
        <Link className="btn btn-outline" to="/orders">
          Order history
        </Link>
      </div>
    );
  }

  if (!session) return <LoadingSpinner full label="Confirming payment result…" />;

  const paymentStatus = session.payment ? session.payment.status : null;

  let panel;
  if (session.status === 'Paid' && paymentStatus === 'Success') {
    panel = (
      <div className="result-panel result-success">
        <span className="result-icon" aria-hidden="true">
          <Icon name="check" size={40} strokeWidth={2.4} />
        </span>
        <h1>Payment successful</h1>
        <p>
          {formatCurrency(session.total)} paid. Your order is confirmed and the reserved stock
          has been converted into a purchase.
        </p>
        <div className="result-actions">
          <Link className="btn btn-primary" to={`/orders/${session.orderId}`}>
            View order details
          </Link>
          <Link className="btn btn-outline" to="/orders">
            Order history
          </Link>
          <Link className="btn btn-ghost" to="/">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  } else if (paymentStatus === 'Timeout' || session.status === 'Expired') {
    panel = (
      <div className="result-panel result-warning">
        <span className="result-icon" aria-hidden="true">
          <Icon name="clock" size={40} />
        </span>
        <h1>Payment timed out</h1>
        <p>
          The gateway did not respond in time. The reservation was finalized as unsuccessful and
          the stock was released — nothing was charged. Please start a new checkout.
        </p>
        <div className="result-actions">
          <Link className="btn btn-primary" to="/cart">
            Start a new checkout
          </Link>
          <Link className="btn btn-outline" to="/orders">
            Order history
          </Link>
        </div>
      </div>
    );
  } else {
    panel = (
      <div className="result-panel result-danger">
        <span className="result-icon" aria-hidden="true">
          <Icon name="close" size={40} strokeWidth={2.4} />
        </span>
        <h1>Payment failed</h1>
        <p>
          The mock gateway declined the payment. The reserved stock was released and nothing was
          charged. You can safely try again with a new checkout.
        </p>
        <div className="result-actions">
          <Link className="btn btn-primary" to="/cart">
            Start a new checkout
          </Link>
          <Link className="btn btn-outline" to="/orders">
            Order history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      {panel}
      <p className="muted small center">
        Session <code>{sessionId}</code> · status <OrderStatusBadge status={session.status} />
      </p>
    </div>
  );
};

export default PaymentResult;
