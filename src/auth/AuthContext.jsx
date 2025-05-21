// src/auth/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  // initialize token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  // CRA reads env vars prefixed with REACT_APP_
  const API_BASE = `${(process.env.REACT_APP_API_URL || 'https://tutto-baby-backend.onrender.com')
    .replace(/\/$/, '')}/api`;

  const login = async (email, password) => {
    console.debug('[Auth] logging in', email);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Credenciais inválidas');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    window.location.href = '/login';
  };

  // (optional) refresh logic could go here
  useEffect(() => {
    // e.g. auto-refresh token if you implement it
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}
