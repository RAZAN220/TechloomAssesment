import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';

/**
 * Global toast notifications (success / error / info).
 *
 * Errors are announced assertively; the auto-dismiss countdown pauses while a
 * toast is hovered or focused, so its message can actually be read.
 */
const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4500;

const TOAST_ICON = { success: 'check', error: 'alert', info: 'info' };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id) => {
      clearTimer(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  /** (Re)start the auto-dismiss countdown for a toast. */
  const schedule = useCallback(
    (id) => {
      if (timersRef.current.has(id)) return;
      timersRef.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    },
    [dismiss]
  );

  const push = useCallback(
    (type, message) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current, { id, type, message }]);
      schedule(id);
    },
    [schedule]
  );

  // Never leave timers running after unmount
  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Errors announce assertively (role="alert"), the rest politely
          (role="status") — a failed action is never missed mid-task. */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            onMouseEnter={() => clearTimer(t.id)}
            onMouseLeave={() => schedule(t.id)}
            onFocus={() => clearTimer(t.id)}
            onBlur={() => schedule(t.id)}
          >
            <Icon name={TOAST_ICON[t.type] || 'info'} size={18} className="toast-icon" />
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
