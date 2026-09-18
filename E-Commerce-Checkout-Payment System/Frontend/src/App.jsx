import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import FlashScreen from './components/FlashScreen';
import ProtectedRoute from './components/ProtectedRoute';
import RouteChangeFocus from './components/RouteChangeFocus';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import PaymentResult from './pages/PaymentResult';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminProducts from './pages/AdminProducts';
import NotFound from './pages/NotFound';

/**
 * Application shell: providers -> navbar -> routes.
 * Protected routes redirect unauthenticated users to /login;
 * /admin/products additionally requires the admin role.
 */
function App() {
  const [flashDone, setFlashDone] = useState(false);

  return (
    <BrowserRouter>
      <RouteChangeFocus />
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <div className="app-shell">
              {/* Flash/Splash screen - shows Elogo.png for 3 seconds */}
              {!flashDone && <FlashScreen onFinished={() => setFlashDone(true)} />}

              {/* First tab stop: lets keyboard users jump past the navbar */}
              <a className="skip-link" href="#main-content">
                Skip to main content
              </a>

              <Navbar />

              {/* tabIndex allows the skip link / route change to focus this landmark */}
              <main id="main-content" className="app-main container" tabIndex={-1}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Authenticated */}
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout/:sessionId"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment/:sessionId"
                    element={
                      <ProtectedRoute>
                        <Payment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment/result/:sessionId"
                    element={
                      <ProtectedRoute>
                        <PaymentResult />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrderHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin */}
                  <Route
                    path="/admin/products"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminProducts />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <footer className="app-footer">
                <div className="container footer-content">
                  <div className="footer-brand">
                    <span className="footer-title">TechMart</span>
                    <span className="footer-divider">|</span>
                    <span className="footer-tagline">E-Commerce Checkout &amp; Payment System</span>
                  </div>
                  <p className="footer-note">
                    Mock payment gateway — no real charges. Demo purposes only.
                  </p>
                </div>
              </footer>
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
