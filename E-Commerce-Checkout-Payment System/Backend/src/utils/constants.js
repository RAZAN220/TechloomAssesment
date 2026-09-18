/**
 * Central application constants.
 * Single source of truth for roles, statuses and the order state machine.
 */

const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

// ---- Order lifecycle -------------------------------------------------------
const ORDER_STATUS = {
  PENDING: 'Pending',
  RESERVED: 'Reserved',
  PAID: 'Paid',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

/**
 * Allowed transitions (enforced by orderService/checkout logic).
 *
 * Pending  -> Reserved | Failed | Expired | Cancelled
 * Reserved -> Paid | Failed | Expired | Cancelled
 * Paid     -> Cancelled | Refunded
 * Cancelled-> Refunded
 * Failed | Expired | Refunded -> (terminal)
 */
const ORDER_STATUS_TRANSITIONS = {
  Pending: ['Reserved', 'Failed', 'Expired', 'Cancelled'],
  Reserved: ['Paid', 'Failed', 'Expired', 'Cancelled'],
  Paid: ['Cancelled', 'Refunded'],
  Cancelled: ['Refunded'],
  Failed: [],
  Expired: [],
  Refunded: [],
};

// ---- Payment lifecycle -----------------------------------------------------
const PAYMENT_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  TIMEOUT: 'Timeout',
};

// ---- Refund lifecycle ------------------------------------------------------
const REFUND_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
};

// ---- Cart limits -----------------------------------------------------------
const CART_LIMITS = {
  MAX_DISTINCT_ITEMS: 50,
  MAX_QTY_PER_ITEM: 99,
};

// ---- Reservation policy ----------------------------------------------------
const RESERVATION_EXPIRY_MINUTES = parseInt(
  process.env.RESERVATION_EXPIRY_MINUTES || '5',
  10
);

// ---- Mock payment gateway ---------------------------------------------------
const PAYMENT_TIMEOUT_SECONDS = parseInt(
  process.env.PAYMENT_TIMEOUT_SECONDS || '6',
  10
);

const CURRENCY = 'USD'; // amounts are stored in integer minor units (cents)

module.exports = {
  ROLES,
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS,
  REFUND_STATUS,
  CART_LIMITS,
  RESERVATION_EXPIRY_MINUTES,
  PAYMENT_TIMEOUT_SECONDS,
  CURRENCY,
};
