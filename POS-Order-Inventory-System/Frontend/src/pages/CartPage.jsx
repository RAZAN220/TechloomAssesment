import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { clearStoredCartId, getCartId, withCartRecovery } from '../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartId, setCartId] = useState(localStorage.getItem('cartId'));
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCart = useCallback(async () => {
    try {
      // Recovers automatically when the stored cart no longer exists on the
      // server: a fresh cart is created and loaded instead of showing an error.
      const { cartId: activeCartId, response } = await withCartRecovery((id) => api.get(`/carts/${id}`));
      setCartId(activeCartId);
      setCart(response.data?.data || { items: [], totalAmount: 0 });
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load cart');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function updateQuantity(productId, quantity) {
    if (!cartId || quantity < 1) return;
    setSaving(true);
    setError('');
    try {
      await withCartRecovery((activeCartId) => api.put(`/carts/${activeCartId}/items/${productId}`, { quantity }));
      await loadCart();
    } catch (updateError) {
      setError(updateError.message || 'Unable to update quantity');
      setSaving(false);
    }
  }

  async function removeItem(productId) {
    if (!cartId) return;
    setSaving(true);
    setError('');
    try {
      await withCartRecovery((activeCartId) => api.delete(`/carts/${activeCartId}/items/${productId}`));
      await loadCart();
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove item');
      setSaving(false);
    }
  }

  async function clearCart() {
    if (!cartId || !window.confirm('Clear all items from the cart?')) return;
    setSaving(true);
    setError('');
    try {
      try {
        await api.delete(`/carts/${cartId}`);
      } catch (deleteError) {
        // A 404 means the cart was already removed on the server; clearing
        // the local state is still the correct recovery.
        if (deleteError.status !== 404) throw deleteError;
      }
      setCart({ items: [], totalAmount: 0 });
      // The cart document no longer exists, so discard the stored id and
      // prepare a fresh cart. Keeping the old id here is what caused
      // "Cart not found" on the next "Add to cart" click.
      clearStoredCartId();
      const freshCartId = await getCartId();
      setCartId(freshCartId);
    } catch (clearError) {
      setError(clearError.message || 'Unable to clear cart');
    } finally {
      setSaving(false);
    }
  }

  async function checkout() {
    if (!cartId || !cart?.items?.length) return;
    if (cart.status !== 'active') {
      setSaving(false);
      // The stored cart was already submitted for checkout. Reset it so the
      // user can start a new sale instead of being stuck on this cart.
      clearStoredCartId();
      setCartId(null);
      setCart({ items: [], totalAmount: 0 });
      setError('That cart was already checked out. A fresh cart has been started — add products again.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('Preparing checkout...');
    try {
      const response = await api.post('/orders/checkout', { cartId });
      setMessage('');
      setCart(null);
      clearStoredCartId();
      navigate('/checkout', { state: { order: response.data?.data } });
    } catch (checkoutError) {
      setError(checkoutError.message || 'Unable to start checkout');
      setMessage('');
      setSaving(false);
    }
  }

  const itemCount = cart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  const shortCartId = cartId ? `${cartId.slice(0, 8)}...${cartId.slice(-4)}` : 'Not available';

  if (loading) {
    return <section className="page-state"><div className="spinner" /> <p>Loading your cart...</p></section>;
  }

  return (
    <section className="cart-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Current sale</p>
          <h2>Shopping cart</h2>
          <p>Review items and quantities before starting checkout.</p>
        </div>
        <div className="cart-reference">Cart <strong>{shortCartId}</strong></div>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {message && <div className="notice success-notice" role="status">{message}</div>}

      {!cart || cart.items.length === 0 ? (
        <div className="panel empty-cart-panel">
          <div className="empty-state large">
            <span className="empty-icon">CT</span>
            <strong>Your cart is empty</strong>
            <p>Add products from the inventory catalog to begin a new sale.</p>
            <Link className="button primary-button" to="/products">Browse products</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="panel cart-items-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                <h3>Cart items</h3>
              </div>
              <button className="button text-button" type="button" onClick={clearCart} disabled={saving}>Clear cart</button>
            </div>
            <div className="table-scroll">
              <table className="data-table cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th className="align-right">Subtotal</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <div className="product-cell">
                          <span className="product-thumb" aria-hidden="true">{item.name.trim().charAt(0).toUpperCase()}</span>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td className="amount-text">{formatCurrency(item.price)}</td>
                      <td>
                        <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={saving || item.quantity <= 1} aria-label="Decrease quantity">−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={saving} aria-label="Increase quantity">+</button>
                        </div>
                      </td>
                      <td className="amount-text subtotal-text">{formatCurrency(item.subtotal)}</td>
                      <td className="align-right">
                        <button className="remove-button" type="button" onClick={() => removeItem(item.productId)} disabled={saving}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="order-summary">
            <div className="summary-heading">
              <p className="section-kicker">Order summary</p>
              <h3>Ready to checkout</h3>
            </div>
            <div className="summary-line"><span>Items</span><strong>{itemCount}</strong></div>
            <div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(cart.totalAmount)}</strong></div>
            <p className="summary-note">Taxes and discounts can be added after payment integration.</p>
            <button className="button primary-button checkout-button" type="button" onClick={checkout} disabled={saving || !cartId}>
              {saving ? 'Starting checkout...' : 'Continue to checkout'}
            </button>
            <Link className="summary-link" to="/products">Continue shopping</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
