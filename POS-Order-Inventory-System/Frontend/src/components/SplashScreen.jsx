import { useEffect, useState } from 'react';
import heroImage from '../assets/hero.png';

const SPLASH_DURATION = 3000;
const EXIT_ANIMATION = 450;

export default function SplashScreen({ onDone }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setIsLeaving(true), SPLASH_DURATION);
    const doneTimer = setTimeout(() => onDone(), SPLASH_DURATION + EXIT_ANIMATION);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`splash-screen${isLeaving ? ' is-leaving' : ''}`}
      role="status"
      aria-label="Welcome to Techloom POS"
    >
      <div className="splash-inner">
        <div className="splash-logo">
          <img src={heroImage} alt="Techloom POS logo" />
        </div>
        <strong className="splash-title">Techloom POS</strong>
        <span className="splash-subtitle">Order & Inventory System</span>
        <div className="splash-loader" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}