// src/auth/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  // Read from localStorage on init
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  // CRA uses process.env.REACT_APP_* variables, not import.meta.env
  const API_BASE = `${(process.env.REACT_APP_API_URL || 'https://tutto-baby-backend.onrender.com')
    .replace(/\/$/, '')}/api`;

  // Attempt to refresh token on mount (optional)
  useEffect(() => {
    // e.g. refresh logic here if you have a refresh token workflow
  }, []);

  // login: call your /auth/login, store tokens
  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Credenciais inválidas');
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    setToken(data.access_token);
  };

  // logout: clear storage
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}
