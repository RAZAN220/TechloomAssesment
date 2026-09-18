import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="page page-narrow">
      <div className="state state-empty">
        <span className="state-icon">
          <Icon name="search" size={26} />
        </span>
        <h1>404 — Page not found</h1>
        <p className="muted">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to shop
        </Link>
      </div>
    </div>
  );
};

export default NotFound;