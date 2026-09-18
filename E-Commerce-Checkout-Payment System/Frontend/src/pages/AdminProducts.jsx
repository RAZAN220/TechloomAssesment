import React, { useCallback, useEffect, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../services/productService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/formatCurrency';

const EMPTY_FORM = { name: '', description: '', category: '', price: '', image: '', stock: '' };

const AdminProducts = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);

  useDocumentTitle('Product management');

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await listProducts({ page, limit: 10, sortBy: 'newest' }));
    } catch (e) {
      setError(e);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: (product.price / 100).toFixed(2),
      image: product.image || '',
      stock: String(product.stock),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        image: form.image || undefined,
        stock: Number(form.stock),
      };
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${product.name}"? This also removes it from every cart.`)) return;
    setDeletingId(product._id);
    try {
      await deleteProduct(product._id);
      toast.success('Product deleted');
      if (editingId === product._id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Product management</h1>
        <p className="muted">Create, update and remove catalog products (admin only).</p>
      </div>

      <div className="admin-layout">
        <section className="card" aria-label="Product form">
          <h2>{editingId ? 'Edit product' : 'New product'}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <label className="filter-field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="filter-field">
              <span>Description</span>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                required
              />
            </label>
            <label className="filter-field">
              <span>Category</span>
              <input name="category" value={form.category} onChange={handleChange} required />
            </label>
            <div className="filter-row">
              <label className="filter-field">
                <span>Price ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="filter-field">
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <label className="filter-field">
              <span>Image URL (optional)</span>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://…"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card table-card" aria-label="Catalog">
          <h2>Catalog</h2>
          {error && <p className="alert alert-error">{error.message}</p>}
          {!data && !error && <LoadingSpinner label="Loading catalog…" />}
          {data && data.products.length === 0 && <p className="muted">No products yet.</p>}
          {data && data.products.length > 0 && (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product._id}>
                      <td data-label="Name">{product.name}</td>
                      <td data-label="Category">{product.category}</td>
                      <td data-label="Price">{formatCurrency(product.price)}</td>
                      <td data-label="Stock">
                        <span
                          className={product.stock > 0 ? 'product-stock in' : 'product-stock out'}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td data-label="Actions" className="table-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={deletingId === product._id}
                          onClick={() => handleDelete(product)}
                        >
                          {deletingId === product._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.pagination.totalPages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={!data.pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={!data.pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
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

export default AdminProducts;
