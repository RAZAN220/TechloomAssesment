import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createCheckout } from '../services/checkoutService';
import CartItem from '../components/CartItem';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

const Cart = () => {
  const { cart, updateQty, remove, clear, refresh, loading } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useDocumentTitle('Your cart');

  const handleQty = async (productId, qty) => {
    setBusy(true);
    try {
      await updateQty(productId, qty);
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (productId) => {
    setBusy(true);
    try {
      await remove(productId);
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await clear();
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const session = await createCheckout();
      await refresh(); // cart is now empty server-side
      toast.success('Stock reserved for 5 minutes — complete your payment');
      navigate(`/checkout/${session.checkoutSessionId}`);
    } catch (error) {
      toast.error(error.message);
      await refresh(); // sync any server-side adjustments
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Your cart</h1>
        </div>
        <div className="state state-empty">
          <span className="state-icon">
            <Icon name="cart" size={26} />
          </span>
          <p>Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Your cart</h1>
        <p className="muted">
          {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} · prices are revalidated at
          checkout
        </p>
      </div>

      <div className="cart-layout">
        <section className="card" aria-label="Cart items">
          {cart.items.map((item) => (
            <CartItem
              key={String(item.product)}
              item={item}
              busy={busy || loading}
              onQty={handleQty}
              onRemove={handleRemove}
            />
          ))}
          <div className="cart-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClear} disabled={busy}>
              Clear cart
            </button>
            <Link to="/" className="btn btn-outline btn-sm">
              Continue shopping
            </Link>
          </div>
        </section>

        <aside className="card cart-summary" aria-label="Order summary">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(cart.total)}</strong>
          </div>
          <div className="summary-row muted">
            <span>Items</span>
            <span>{cart.itemCount}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(cart.total)}</strong>
          </div>

          {cart.hasIssues && (
            <p className="alert alert-warning alert-with-icon" role="alert">
              <Icon name="alert" size={16} />
              <span>
                Some items need attention (price/stock changes). They are revalidated on the
              server before payment.
              </span>
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleCheckout}
            disabled={checkingOut || cart.items.length === 0}
          >
            {checkingOut ? 'Reserving stock…' : 'Proceed to checkout'}
          </button>
          <p className="muted small">
            Checkout reserves stock for 5 minutes. Payment completes the reservation.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
