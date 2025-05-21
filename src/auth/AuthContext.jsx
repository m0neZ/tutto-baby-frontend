// src/auth/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import { authFetch } from '../api';

export const AuthContext = createContext({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(token ? jwtDecode(token) : null);

  // Persist token → localStorage & decode
  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
      setUser(jwtDecode(token));
    } else {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  }, [token]);

  // Login function
  const login = async (email, password) => {
    const res = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!res.access_token) {
      throw new Error(res.error || 'Falha no login');
    }
    localStorage.setItem('refresh_token', res.refresh_token || '');
    setToken(res.access_token);
  };

  // Logout function
  const logout = () => {
    setToken(null);
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
