import React from 'react';

/**
 * Search / category / price-range / availability / sort controls.
 * Controlled by the parent page via `filters` + `onChange`.
 */
const ProductFilters = ({ filters, onChange, categories = [] }) => {
  const set = (patch) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <aside className="filters card" aria-label="Product filters">
      <h2 className="filters-title">Filters</h2>

      <label className="filter-field">
        <span>Search</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search products…"
        />
      </label>

      <label className="filter-field">
        <span>Category</span>
        <select value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <div className="filter-row">
        <label className="filter-field">
          <span>Min price ($)</span>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => set({ minPrice: e.target.value })}
            placeholder="0"
          />
        </label>
        <label className="filter-field">
          <span>Max price ($)</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => set({ maxPrice: e.target.value })}
            placeholder="Any"
          />
        </label>
      </div>

      <label className="filter-check">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => set({ inStock: e.target.checked })}
        />
        <span>In stock only</span>
      </label>

      <label className="filter-field">
        <span>Sort by</span>
        <select value={filters.sortBy} onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() =>
          onChange({
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            inStock: false,
            sortBy: 'newest',
            page: 1,
          })
        }
      >
        Reset filters
      </button>
    </aside>
  );
};

export default ProductFilters;
