import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getToken,
  setToken,
  clearToken,
  fetchMe,
  loginUser,
  registerUser,
  logoutUser,
} from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // booting = restoring an existing session from a stored token
  const [booting, setBooting] = useState(Boolean(getToken()));

  useEffect(() => {
    let active = true;
    const boot = async () => {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (active) setUser(me);
      } catch {
        clearToken();
      } finally {
        if (active) setBooting(false);
      }
    };
    boot();
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    const result = await loginUser(credentials);
    setUser(result.user);
    return result.user;
  };

  const register = async (payload) => {
    const result = await registerUser(payload);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      logout,
      isAdmin: Boolean(user && user.role === 'admin'),
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
