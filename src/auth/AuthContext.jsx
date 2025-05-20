// src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  // On mount, load saved token
  useEffect(() => {
    const saved = localStorage.getItem('access_token');
    if (saved) setToken(saved);
  }, []);

  // Login function
  const login = async (email, password) => {
    const res = await fetch(process.env.REACT_APP_API_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Credenciais inválidas');
    const { access_token, refresh_token } = await res.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setToken(access_token);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
