// File: src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// Create authentication context
export const AuthContext = createContext();

// Provider component to wrap the app
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  // On mount, load saved tokens
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) setToken(savedToken);
  }, []);

  // Build API base URL from Vite env or default
  const apiBase = (import.meta.env.VITE_API_URL || "https://tutto-baby-backend.onrender.com").replace(/\/$/, '');

  // Login function: request tokens and save
  const login = async (email, password) => {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error('Credenciais inválidas');
    }
    const { access_token, refresh_token } = await res.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setToken(access_token);
  };

  // Logout function: clear tokens
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
