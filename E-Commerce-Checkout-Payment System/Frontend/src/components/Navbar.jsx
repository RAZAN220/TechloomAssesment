import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import Icon from './Icon';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <Icon name="bag" size={20} />
          <span>TechMart</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/cart" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Cart
              {cart.itemCount > 0 && (
                <>
                  <span className="cart-count" aria-hidden="true">
                    {cart.itemCount}
                  </span>
                  {/* Spelled out for screen readers: "3" alone means nothing out of context */}
                  <span className="sr-only">
                    {`${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} in cart`}
                  </span>
                </>
              )}
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Orders
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin/products"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="nav-auth">
          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                {user.name}
              </NavLink>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
