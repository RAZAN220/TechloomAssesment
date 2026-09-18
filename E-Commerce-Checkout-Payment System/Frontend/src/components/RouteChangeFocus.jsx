import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Accessibility helper for client-side navigation.
 *
 * SPA route changes do not move focus the way a full page load does, so
 * keyboard users can be left several hundred tab stops deep (e.g. after
 * following a link from the middle of the product grid). On every path
 * change we scroll to the top and move focus to the main landmark, which
 * pairs with the "Skip to main content" link.
 *
 * The first render is skipped so the initial page load is untouched.
 */
const RouteChangeFocus = () => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
};

export default RouteChangeFocus;
