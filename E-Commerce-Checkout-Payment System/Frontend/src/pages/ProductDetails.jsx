import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useDocumentTitle(product ? product.name : 'Product');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProduct(null);
    setQty(1);
    setImageFailed(false);
    getProduct(id)
      .then((p) => active && setProduct(p))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner full label="Loading product…" />;

  if (error) {
    return (
      <div className="state state-error" role="alert">
        <span className="state-icon">
          <Icon name="alert" size={26} />
        </span>
        <p>{error.message}</p>
        <Link className="btn btn-outline" to="/">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const outOfStock = product.stock === 0;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add(product._id, qty);
      navigate('/cart');
    } catch {
      /* toast already surfaced by the cart context */
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Shop</Link> <span aria-hidden="true">/</span> <span>{product.name}</span>
      </nav>

      <div className="product-details card">
        <div className="product-details-image">
          {product.image && !imageFailed ? (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="product-image-fallback big" aria-hidden="true">
              <Icon name="image" size={88} />
            </span>
          )}
        </div>

        <div className="product-details-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price big">{formatCurrency(product.price)}</p>
          <p className="muted">{product.description}</p>
          <p className={product.stock > 0 ? 'product-stock in' : 'product-stock out'}>
            {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
          </p>

          <div className="product-actions">
            <div className="qty-controls">
              <button
                type="button"
                className="btn btn-outline"
                disabled={outOfStock || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-value" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                disabled={outOfStock || qty >= product.stock}
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={outOfStock || adding}
              onClick={handleAdd}
            >
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
          </div>

          <p className="muted small">
            Last updated {new Date(product.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
