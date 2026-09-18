import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import heroImage from './assets/hero.png';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import { getCartId } from './services/api';
import SplashScreen from './components/SplashScreen';

const navigation = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Products', path: '/products', icon: 'products' },
  { label: 'Cart', path: '/cart', icon: 'cart' },
  { label: 'Checkout', path: '/checkout', icon: 'checkout' },
  { label: 'Orders', path: '/orders', icon: 'orders' },
];

const iconPaths = {
  dashboard: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  products: 'M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10',
  cart: 'M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 9H7M10 20a1 1 0 1 1-2 0M18 20a1 1 0 1 1-2 0',
  checkout: 'M4 6h16v12H4zM4 10h16M8 15h4',
  orders: 'M5 6h14M5 12h14M5 18h14M9 6h.01M9 12h.01M9 18h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
};

function Icon({ name, size = 20 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name]} />
    </svg>
  );
}

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const handleSplashDone = useCallback(() => setSplashVisible(false), []);
  const currentNavigation = navigation.find((item) => item.path === location.pathname)
    || (location.pathname.startsWith('/orders/') ? navigation.find((item) => item.path === '/orders') : navigation[0]);

  useEffect(() => {
    getCartId().catch((error) => console.error('Failed to create cart', error));
  }, []);

  return (
    <>
      {splashVisible && <SplashScreen onDone={handleSplashDone} />}
      <div className="app-shell">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <Icon name={sidebarOpen ? 'close' : 'menu'} />
      </button>

        <div className={`sidebar-scrim ${sidebarOpen ? 'is-visible' : ''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="brand">
            <div className="brand-mark">
              <img src={heroImage} alt="" />
            </div>
            <div>
              <strong>Techloom POS</strong>
              <span>Order &amp; inventory</span>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Primary navigation">
            <span className="nav-label">Workspace</span>
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="system-status">
              <span className="status-pulse" />
              <div>
                <strong>System online</strong>
                <span>Inventory sync active</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="topbar-copy">
              <span className="topbar-eyebrow">Operations workspace</span>
              <h1>{currentNavigation.label}</h1>
            </div>
            <div className="topbar-actions" aria-label="System status">
              <span className="live-pill"><span className="status-pulse" />Live</span>
              <div className="user-avatar" title="Store administrator">TL</div>
            </div>
          </header>

          <main className="main-content">
            <div className="content-width">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
