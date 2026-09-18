import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelOrder, listOrders } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

const OrderHistory = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState(null);

  useDocumentTitle('Order history');

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await listOrders({ page, limit: 10 }));
    } catch (e) {
      setError(e);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      const result = await cancelOrder(orderId, 'Cancelled by customer');
      toast.success(
        result.order.status === 'Refunded'
          ? 'Order cancelled and refunded'
          : 'Order cancelled — reserved stock released'
      );
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <span className="state-icon">
          <Icon name="alert" size={26} />
        </span>
        <p>{error.message}</p>
        <button type="button" className="btn btn-primary" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) return <LoadingSpinner full label="Loading your orders…" />;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Order history</h1>
        <p className="muted">Track reservations, payments, cancellations and refunds.</p>
      </div>

      {data.orders.length === 0 ? (
        <div className="state state-empty">
          <span className="state-icon">
            <Icon name="package" size={26} />
          </span>
          <p>You have no orders yet.</p>
          <Link to="/" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link to={`/orders/${order.id}`} className="order-link">
                        #{String(order.id).slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td data-label="Date">{new Date(order.createdAt).toLocaleString()}</td>
                    <td data-label="Items">
                      {order.items.reduce((sum, i) => sum + i.qty, 0)}
                    </td>
                    <td data-label="Total">{formatCurrency(order.total)}</td>
                    <td data-label="Status">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td data-label="Actions" className="table-actions">
                      {order.canCancel && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancel(order.id)}
                        >
                          {cancellingId === order.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                      <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={!data.pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span className="pagination-info">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={!data.pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;
