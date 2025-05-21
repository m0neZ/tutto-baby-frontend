import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({ token: null, login: () => {}, logout: () => {} });

const API_BASE = (import.meta.env.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '');

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setToken(data.access_token);
      return true;
    }
    throw new Error(data.error || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
  };

  // Auto-refresh logic omitted for brevity

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
