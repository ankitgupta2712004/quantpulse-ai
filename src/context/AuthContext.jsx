import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('quantpulse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quantpulse_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on initial load
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('quantpulse_token');
      if (storedToken) {
        try {
          const data = await authService.getCurrentUser();
          if (data.success && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('quantpulse_user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.warn('[AuthContext] Session verification failed, clearing session:', error.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (data.success && data.token) {
        localStorage.setItem('quantpulse_token', data.token);
        localStorage.setItem('quantpulse_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Authentication error' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      if (data.success && data.token) {
        localStorage.setItem('quantpulse_token', data.token);
        localStorage.setItem('quantpulse_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Registration error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('quantpulse_token');
    localStorage.removeItem('quantpulse_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
