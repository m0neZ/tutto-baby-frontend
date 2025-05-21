// src/auth/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import { authFetch } from "../api";       // <-- named import now
import jwt_decode from "jwt-decode";

export const AuthContext = createContext({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [user, setUser] = useState(
    token ? jwt_decode(localStorage.getItem("access_token")) : null
  );

  const login = async (email, password) => {
    const res = await fetch(
      `${(import.meta.env?.VITE_API_URL ||
        "https://tutto-baby-backend.onrender.com")}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao fazer login");
    }
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setToken(data.access_token);
    setUser(jwt_decode(data.access_token));
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  // Optionally: refresh token logic could go here, using authFetch()

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
