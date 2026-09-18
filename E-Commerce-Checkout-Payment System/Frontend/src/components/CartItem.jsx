import React from 'react';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * A single cart line with quantity controls, live validation warnings
 * (price drift / stock limits / availability) and a remove action.
 */
const CartItem = ({ item, onQty, onRemove, busy = false }) => {
  const { live } = item;

  const problems = [];
  if (!live.exists) problems.push('No longer available');
  if (live.exists && !live.inStock) problems.push('Out of stock');
  if (live.exists && live.inStock && live.qtyExceedsStock) {
    problems.push(`Only ${live.availableStock} in stock`);
  }
  if (live.exists && live.priceChanged) {
    problems.push(`Price changed to ${formatCurrency(live.currentPrice)}`);
  }

  return (
    <div className="cart-item">
      <div className="cart-item-main">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-price">{formatCurrency(item.price)} each</p>
        <div className="qty-controls">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => onQty(item.product, item.qty - 1)}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span className="qty-value" aria-label={`Quantity: ${item.qty}`}>
            {item.qty}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy || (live.exists && item.qty >= live.availableStock)}
            onClick={() => onQty(item.product, item.qty + 1)}
            aria-label={`Increase quantity of ${item.name}`}
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => onRemove(item.product)}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="cart-item-side">
        <span className="cart-item-total">{formatCurrency(item.price * item.qty)}</span>
        {problems.length > 0 && (
          <ul className="cart-item-warnings">
            {problems.map((problem) => (
              <li key={problem}>
                <Icon name="alert" size={14} />
                {problem}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CartItem;
