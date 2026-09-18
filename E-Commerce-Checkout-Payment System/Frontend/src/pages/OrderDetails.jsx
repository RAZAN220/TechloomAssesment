import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelOrder, getOrder } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

const OrderDetails = () => {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useDocumentTitle(
    data
      ? `Order #${String(data.order._id || data.order.id || '').slice(-8).toUpperCase()}`
      : 'Order'
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getOrder(id));
    } catch (e) {
      setError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelOrder(id, 'Cancelled from order details');
      toast.success(
        result.order.status === 'Refunded'
          ? 'Order cancelled and refunded'
          : 'Order cancelled — reserved stock released'
      );
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <span className="state-icon">
          <Icon name="alert" size={26} />
        </span>
        <p>{error.message}</p>
        <Link className="btn btn-outline" to="/orders">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!data) return <LoadingSpinner full label="Loading order…" />;

  const { order, payments, refunds } = data;
  // Lean backend documents expose `_id`; the list endpoint maps it to `id`
  const orderNumber = String(order._id || order.id || '').slice(-8).toUpperCase();

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/orders">Orders</Link> <span aria-hidden="true">/</span>{' '}
        <span>#{orderNumber}</span>
      </nav>

      <div className="page-head order-head">
        <div>
          <h1>Order #{orderNumber}</h1>
          <p className="muted">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="order-head-actions">
          <OrderStatusBadge status={order.status} />
          {order.canCancel && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>

      <div className="order-grid">
        <section className="card" aria-label="Order items">
          <h2>Items</h2>
          {order.items.map((item) => (
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
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </section>

        <aside className="order-side">
          <section className="card" aria-label="Payments">
            <h2>Payments</h2>
            {payments.length === 0 ? (
              <p className="muted">No payment attempts yet.</p>
            ) : (
              payments.map((payment) => (
                <div className="record-row" key={payment._id}>
                  <OrderStatusBadge status={payment.status} />
                  <p className="muted small">
                    {formatCurrency(payment.amount)} · {new Date(payment.createdAt).toLocaleString()}
                  </p>
                  {payment.transactionReference && (
                    <p className="muted small mono">Ref {payment.transactionReference}</p>
                  )}
                  {payment.failureReason && (
                    <p className="muted small">Reason: {payment.failureReason}</p>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="card" aria-label="Refunds">
            <h2>Refunds</h2>
            {refunds.length === 0 ? (
              <p className="muted">No refunds on this order.</p>
            ) : (
              refunds.map((refund) => (
                <div className="record-row" key={refund._id}>
                  <OrderStatusBadge status={refund.status} />
                  <p className="muted small">
                    {formatCurrency(refund.amount)} · {new Date(refund.createdAt).toLocaleString()}
                  </p>
                  {refund.refundReference && (
                    <p className="muted small mono">Ref {refund.refundReference}</p>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="card" aria-label="Timeline">
            <h2>Timeline</h2>
            <ul className="timeline">
              <li>Created: {new Date(order.createdAt).toLocaleString()}</li>
              {order.paidAt && <li>Paid: {new Date(order.paidAt).toLocaleString()}</li>}
              {order.cancelledAt && <li>Cancelled: {new Date(order.cancelledAt).toLocaleString()}</li>}
              {order.refundedAt && <li>Refunded: {new Date(order.refundedAt).toLocaleString()}</li>}
              {order.reservationExpiresAt && order.status === 'Expired' && (
                <li>
                  Reservation expired: {new Date(order.reservationExpiresAt).toLocaleString()}
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetails;
