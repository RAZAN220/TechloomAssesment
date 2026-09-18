import React, { useEffect, useState } from 'react';
import logo from '../pages/Elogo.png';

function FlashScreen({ onFinished }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onFinished?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  if (!visible && onFinished) {
    return null;
  }

  return (
    <div className="flash-screen" role="status" aria-label="Loading">
      <img
        src={logo}
        alt="TechMart logo"
        className="flash-logo"
      />
      <p className="flash-text">Welcome to TechMart</p>
    </div>
  );
}

export default FlashScreen;
