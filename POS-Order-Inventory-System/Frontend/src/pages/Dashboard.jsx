import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const metricDefinitions = [
  { label: 'Total products', value: 'products', suffix: '', icon: 'PR', tone: 'violet' },
  { label: 'Available stock', value: 'stock', suffix: '', icon: 'ST', tone: 'green' },
  { label: 'Total orders', value: 'orders', suffix: '', icon: 'OR', tone: 'blue' },
  { label: 'Paid revenue', value: 'revenue', prefix: '$', icon: 'RV', tone: 'amber' },
  { label: 'Reserved orders', value: 'reserved', suffix: '', icon: 'RS', tone: 'rose' },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    stock: 0,
    orders: 0,
    revenue: 0,
    reserved: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get('/products'),
          api.get('/orders'),
        ]);

        const products = productsRes.data?.data || [];
        const allOrders = ordersRes.data?.data || [];
        const paidOrders = allOrders.filter((order) => order.status === 'Paid');

        setOrders(allOrders);
        setStats({
          products: products.length,
          stock: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
          orders: allOrders.length,
          revenue: paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
          reserved: allOrders.filter((order) => order.status === 'Reserved').length,
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="dashboard-page" aria-busy={loading}>
      <div className="page-heading">
        <div>
          <p className="page-kicker">Store overview</p>
          <h2>Dashboard</h2>
          <p>Track inventory, sales, and order activity from one place.</p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary-button" to="/orders">View orders</Link>
          <Link className="button primary-button" to="/products">Manage products</Link>
        </div>
      </div>

      {error && <div className="notice error-notice" role="alert">{error}</div>}

      <div className="metric-grid">
        {metricDefinitions.map((metric) => (
          <article className="metric-card" key={metric.value}>
            <div className={`metric-icon ${metric.tone}`}>{metric.icon}</div>
            <div className="metric-content">
              <span>{metric.label}</span>
              <strong>
                {loading ? '—' : metric.prefix}{loading ? '—' : stats[metric.value]}{loading ? '' : metric.suffix}
              </strong>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel recent-orders-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Activity</p>
              <h3>Recent orders</h3>
            </div>
            <Link className="text-link" to="/orders">View all</Link>
          </div>
          {loading ? (
            <div className="loading-row">Loading recent orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state compact">
              <span className="empty-icon">OR</span>
              <strong>No orders yet</strong>
              <p>Orders created at checkout will appear here.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th className="align-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order._id}>
                      <td><Link className="table-link" to={`/orders/${order._id}`}>{order.orderNumber}</Link></td>
                      <td className="muted-text">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                      <td className="align-right amount-text">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel workflow-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Quick start</p>
              <h3>Sales workflow</h3>
            </div>
          </div>
          <ol className="workflow-list">
            <li>
              <span className="workflow-number">1</span>
              <div><strong>Add products</strong><p>Create inventory and keep stock current.</p></div>
              <Link className="arrow-link" to="/products" aria-label="Open products">→</Link>
            </li>
            <li>
              <span className="workflow-number">2</span>
              <div><strong>Build a cart</strong><p>Select products and adjust quantities.</p></div>
              <Link className="arrow-link" to="/products" aria-label="Open products">→</Link>
            </li>
            <li>
              <span className="workflow-number">3</span>
              <div><strong>Complete checkout</strong><p>Reserve stock and simulate payment.</p></div>
              <Link className="arrow-link" to="/cart" aria-label="Open cart">→</Link>
            </li>
          </ol>
          <div className="workflow-note">
            <span className="note-icon">i</span>
            <p>Stock is reserved for five minutes while payment is processed.</p>
          </div>
        </section>
      </div>
    </section>
  );
}
