import React from 'react';

/**
 * Color-coded badge for order/payment/refund statuses.
 */
const STATUS_CLASS = {
  Pending: 'badge-pending',
  Reserved: 'badge-reserved',
  Paid: 'badge-paid',
  Failed: 'badge-failed',
  Expired: 'badge-expired',
  Cancelled: 'badge-cancelled',
  Refunded: 'badge-refunded',
  Success: 'badge-paid',
  Timeout: 'badge-failed',
};

const OrderStatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_CLASS[status] || 'badge-pending'}`}>{status}</span>
);

export default OrderStatusBadge;
