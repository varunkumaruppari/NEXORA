import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple placeholder login/logout handlers for initialization
  const login = (userData, token) => {
    localStorage.setItem('resolv_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('resolv_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
