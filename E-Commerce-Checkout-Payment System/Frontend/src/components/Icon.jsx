import React from 'react';

/**
 * Inline SVG icon set.
 *
 * Replaces the emoji that were previously used as UI icons (cart, warning,
 * check, cross ...): emoji are announced by screen readers ("warning sign",
 * "shopping trolley"), render differently on every OS and cannot inherit
 * colour or stroke width.
 * Every icon inherits `currentColor`, so it follows the surrounding text colour.
 *
 * Icons are decorative by default (`aria-hidden`); pass `title` only when the
 * icon carries meaning on its own, which exposes it as `role="img"`.
 */
const ICON_PATHS = {
  bag: 'M6.5 2 3.5 6.5V20a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V6.5L17.5 2zM3.5 6.5h17M16 11a4 4 0 0 1-8 0',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M10 20.5a1 1 0 1 1-2 0M18 20.5a1 1 0 1 1-2 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  alert: 'M10.3 4 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0M12 9.5v4M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 11v5M12 8h.01',
  check: 'M20 6 9 17l-5-5',
  close: 'M6 6l12 12M18 6 6 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7.5V12l3 2',
  package: 'M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10',
  image: 'M4 5h16v14H4zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M4 16.5 9 12l4.5 4.5L16 14l4 3',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  user: 'M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
};

const Icon = ({ name, size = 18, className = '', strokeWidth = 1.8, title }) => {
  const d = ICON_PATHS[name];
  if (!d) return null;

  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
};

export default Icon;
