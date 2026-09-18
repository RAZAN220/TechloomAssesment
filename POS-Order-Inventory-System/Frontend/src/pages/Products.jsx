import { useCallback, useEffect, useState } from 'react';
import api, { addCartItem } from '../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStockLabel(stock) {
  if (Number(stock) === 0) return { label: 'Out of stock', tone: 'danger' };
  if (Number(stock) < 5) return { label: 'Low stock', tone: 'warning' };
  return { label: 'In stock', tone: 'success' };
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data?.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setSuccess('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        setSuccess('Product added to inventory.');
      }

      setForm({ name: '', price: '', stock: '' });
      setEditingId(null);
      await fetchProducts();
    } catch (submitError) {
      setError(submitError.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product) {
    setEditingId(product._id);
    setForm({ name: product.name, price: product.price, stock: product.stock });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await api.delete(`/products/${productId}`);
      await fetchProducts();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete product');
    }
  }

  async function addToCart(product) {
    setError('');
    setSuccess('');
    try {
      // Recovers automatically if the stored cart no longer exists on the
      // server (e.g. it was cleared or the database was reset).
      await addCartItem({ productId: product._id, quantity: 1 });
      setSuccess(`${product.name} added to cart.`);
    } catch (cartError) {
      setError(cartError.message || 'Unable to add product to cart');
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const stock = Number(product.stock || 0);
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'available' && stock > 0)
      || (stockFilter === 'low' && stock > 0 && stock < 5)
      || (stockFilter === 'out' && stock === 0);
    return matchesQuery && matchesStock;
  });

  return (
    <section className="products-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Inventory management</p>
          <h2>Products</h2>
          <p>Create products, monitor stock, and add items directly to the sales cart.</p>
        </div>
      </div>

      <div className="panel form-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{editingId ? 'Update record' : 'New record'}</p>
            <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
          </div>
          <span className={`form-state ${editingId ? 'editing' : ''}`}>{editingId ? 'Editing' : 'Create mode'}</span>
        </div>

        {(error || success) && (
          <div className={`notice ${error ? 'error-notice' : 'success-notice'}`} role="status" aria-live="polite">
            {error || success}
          </div>
        )}

        <form onSubmit={submitProduct}>
          <div className="form-grid">
            <label className="field">
              <span>Product name</span>
              <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="e.g. Wireless keyboard" required />
            </label>
            <label className="field">
              <span>Price</span>
              <div className="input-prefix">$<input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="0.00" required /></div>
            </label>
            <label className="field">
              <span>Stock quantity</span>
              <input type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={(event) => updateForm('stock', event.target.value)} placeholder="0" required />
            </label>
          </div>
          <div className="form-actions">
            <button className="button primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'}</button>
            {editingId && <button className="button secondary-button" type="button" onClick={() => { setEditingId(null); setForm({ name: '', price: '', stock: '' }); setError(''); }}>Cancel editing</button>}
          </div>
        </form>
      </div>

      <section className="panel inventory-panel">
        <div className="panel-heading inventory-heading">
          <div>
            <p className="section-kicker">Catalog</p>
            <h3>Inventory list</h3>
            <span className="record-count">{filteredProducts.length} of {products.length} products</span>
          </div>
          <div className="inventory-filters">
            <label className="search-field">
              <span className="search-icon" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" />
            </label>
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filter by stock">
              <option value="all">All stock</option>
              <option value="available">Available</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-row">Loading inventory...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">PR</span>
            <strong>{products.length === 0 ? 'No products yet' : 'No matching products'}</strong>
            <p>{products.length === 0 ? 'Add your first product to start building the catalog.' : 'Try a different search or stock filter.'}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Availability</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = getStockLabel(product.stock);
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <span className="product-thumb" aria-hidden="true">{product.name.trim().charAt(0).toUpperCase()}</span>
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td className="amount-text">{formatCurrency(product.price)}</td>
                      <td><span className="stock-value">{product.stock}</span></td>
                      <td><span className={`stock-badge ${stock.tone}`}>{stock.label}</span></td>
                      <td>
                        <div className="table-actions align-right">
                          <button
                            className="icon-button-add"
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={Number(product.stock) === 0}
                            title={Number(product.stock) === 0 ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
                            aria-label={Number(product.stock) === 0 ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                          </button>
                          <button className="icon-button" type="button" onClick={() => handleEdit(product)} title={`Edit ${product.name}`} aria-label={`Edit ${product.name}`}>Edit</button>
                          <button className="icon-button danger-text" type="button" onClick={() => deleteProduct(product._id)} title={`Delete ${product.name}`} aria-label={`Delete ${product.name}`}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
