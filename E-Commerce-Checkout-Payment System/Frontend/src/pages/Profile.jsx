import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Profile = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();

  useDocumentTitle('Profile');

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Profile</h1>
        <p className="muted">Your account details and quick actions.</p>
      </div>

      <div className="card profile-card">
        <div className="profile-row">
          <span className="muted">Name</span>
          <strong>{user.name}</strong>
        </div>
        <div className="profile-row">
          <span className="muted">Email</span>
          <strong>{user.email}</strong>
        </div>
        <div className="profile-row">
          <span className="muted">Role</span>
          <strong>{user.role}</strong>
        </div>
        <div className="profile-row">
          <span className="muted">Member since</span>
          <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
        </div>
        <div className="profile-row">
          <span className="muted">Cart items</span>
          <strong>{cart.itemCount}</strong>
        </div>
      </div>

      <div className="profile-actions">
        <Link className="btn btn-outline" to="/orders">
          Order history
        </Link>
        <Link className="btn btn-outline" to="/cart">
          View cart
        </Link>
        {isAdmin && (
          <Link className="btn btn-outline" to="/admin/products">
            Manage products
          </Link>
        )}
        <button type="button" className="btn btn-danger" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;