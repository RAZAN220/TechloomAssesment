import React from 'react';

/**
 * Skeleton placeholder matching the product card layout.
 * Skeletons keep the grid from collapsing/jumping while the request is in
 * flight, which reads as noticeably faster than a lone spinner.
 */
const ProductCardSkeleton = () => (
  <article className="product-card card skeleton-card" aria-hidden="true">
    <div className="skeleton skeleton-image" />
    <div className="product-body">
      <div className="skeleton skeleton-line w-30" />
      <div className="skeleton skeleton-line w-80" />
      <div className="skeleton skeleton-line w-60" />
      <div className="product-meta">
        <div className="skeleton skeleton-line w-40" />
        <div className="skeleton skeleton-line w-30" />
      </div>
    </div>
  </article>
);

/**
 * Grid of placeholders announced once, politely, to assistive tech.
 */
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="product-grid" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading products…</span>
    {Array.from({ length: count }, (unused, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export default ProductCardSkeleton;
