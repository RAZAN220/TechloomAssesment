import React from 'react';

const LoadingSpinner = ({ label = 'Loading…', full = false }) => (
  <div className={full ? 'spinner-wrap spinner-full' : 'spinner-wrap'} role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span className="spinner-label">{label}</span>
  </div>
);

export default LoadingSpinner;
