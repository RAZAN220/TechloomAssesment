import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatCurrency';

const ProductImage = ({ product, className }) => {
  const [failed, setFailed] = useState(false);
  if (product.image && !failed) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="product-image-fallback" aria-hidden="true">
      <Icon name="image" size={44} />
    </span>
  );
};

const ProductCard = ({ product }) => (
  <article className="product-card card">
    <Link to={`/products/${product._id}`} className="product-card-link">
      <div className="product-image">
        <ProductImage product={product} />
        {product.stock === 0 && <span className="product-flag">Out of stock</span>}
      </div>
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-meta">
          <span className="product-price">{formatCurrency(product.price)}</span>
          <span className={product.stock > 0 ? 'product-stock in' : 'product-stock out'}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  </article>
);

export default ProductCard;
