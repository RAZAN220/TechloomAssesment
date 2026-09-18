import { useEffect } from 'react';

const SITE_NAME = 'TechMart';
const DEFAULT_TITLE = `${SITE_NAME} — E-Commerce Checkout & Payments`;

/**
 * Keeps `document.title` in sync with the current page.
 * Screen-reader users hear the title on route changes, and browser
 * tabs/history become distinguishable instead of all reading "React App".
 */
const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  }, [title]);
};

export default useDocumentTitle;
