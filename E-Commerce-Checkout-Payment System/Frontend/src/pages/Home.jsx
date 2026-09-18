import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, listProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sortBy: 'newest',
  page: 1,
  limit: 12,
};

const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'];

/** URL query string -> filter state (the URL is the single source of truth). */
const parseFilters = (params) => ({
  search: params.get('search') || '',
  category: params.get('category') || '',
  minPrice: params.get('minPrice') || '',
  maxPrice: params.get('maxPrice') || '',
  inStock: params.get('inStock') === 'true',
  sortBy: SORT_OPTIONS.includes(params.get('sortBy')) ? params.get('sortBy') : 'newest',
  page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
  limit: DEFAULT_FILTERS.limit,
});

/** Filter state -> query string, omitting defaults so URLs stay readable. */
const toSearchParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.sortBy && filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    params.set('sortBy', filters.sortBy);
  }
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
};

const Home = () => {
  useDocumentTitle('Shop');

  // Search, filters and pagination live in the URL, so back/forward, refresh
  // and shared links all restore exactly the same view.
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(queryString)), [queryString]);

  const [data, setData] = useState({ products: [], pagination: null });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumped by "Try again" to force a refetch without touching the URL
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { ...filters };
        Object.keys(params).forEach((key) => {
          if (params[key] === '' || params[key] === false || params[key] == null) {
            delete params[key];
          }
        });
        const result = await listProducts(params);
        if (active) setData(result);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    const timer = setTimeout(load, 250); // debounce rapid typing / filter changes
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, reloadToken]);

  const updateFilters = (next, { replace = true } = {}) =>
    setSearchParams(toSearchParams(next), { replace });

  /**
   * Typing (search / price) replaces the current history entry so the back
   * button is not flooded with one entry per keystroke. Deliberate changes
   * (category, availability, sort, paging) push an entry so that "back"
   * returns to the previous view.
   */
  const handleFilterChange = (next) => {
    const isTyping =
      next.search !== filters.search ||
      next.minPrice !== filters.minPrice ||
      next.maxPrice !== filters.maxPrice;
    updateFilters(next, { replace: isTyping });
  };

  const goToPage = (page) => updateFilters({ ...filters, page }, { replace: false });
  const resetFilters = () => updateFilters(DEFAULT_FILTERS, { replace: false });

  const { products, pagination } = data;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Discover products</h1>
        <p className="muted">Search, filter and find your next favorite gadget.</p>
      </div>

      <div className="shop-layout">
        <ProductFilters filters={filters} onChange={handleFilterChange} categories={categories} />

        <section className="shop-results" aria-label="Product results">
          {loading && <ProductGridSkeleton count={6} />}

          {!loading && error && (
            <div className="state state-error" role="alert">
              <span className="state-icon">
                <Icon name="alert" size={26} />
              </span>
              <p>{error.message}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setReloadToken((token) => token + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="state state-empty">
              <span className="state-icon">
                <Icon name="search" size={26} />
              </span>
              <p>No products match your filters.</p>
              <button type="button" className="btn btn-outline" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              {/* Result count announced politely instead of refocusing the grid */}
              <p className="sr-only" role="status">
                {pagination
                  ? `${pagination.total} product${pagination.total === 1 ? '' : 's'} found`
                  : ''}
              </p>

              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    <Icon name="chevronLeft" size={15} />
                    Prev
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} products
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={!pagination.hasNext}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    Next
                    <Icon name="chevronRight" size={15} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
