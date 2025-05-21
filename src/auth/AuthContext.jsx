// src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 🔧 Use CRA env var, not import.meta.env
const API_BASE = `${(process.env.REACT_APP_API_URL || 'https://tutto-baby-backend.onrender.com')
  .replace(/\/$/, '')}/api`;

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem('refresh_token')
  );

  // ... your existing login, logout, refresh logic ...

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Credenciais inválidas');
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout: () => {/*...*/} }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
