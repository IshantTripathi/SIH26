import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [linkedProfile, setLinkedProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coop_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('coop_token');
      if (storedToken) {
        try {
          const res = await api.getProfile();
          if (res.success) {
            setUser(res.user);
            setLinkedProfile(res.linkedProfile);
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out demo token');
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.login({ identifier, password });
      if (res.success) {
        localStorage.setItem('coop_token', res.token);
        localStorage.setItem('coop_demo_user_id', res.user.id);
        setToken(res.token);
        setUser(res.user);
        setLinkedProfile(res.linkedProfile);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const quickSwitchRole = async (email) => {
    setLoading(true);
    try {
      const res = await api.login({ identifier: email, password: 'password123' });
      if (res.success) {
        localStorage.setItem('coop_token', res.token);
        localStorage.setItem('coop_demo_user_id', res.user.id);
        setToken(res.token);
        setUser(res.user);
        setLinkedProfile(res.linkedProfile);
        setLoading(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
    setLoading(false);
    return { success: false };
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.success) {
        localStorage.setItem('coop_token', res.token);
        localStorage.setItem('coop_demo_user_id', res.user.id);
        setToken(res.token);
        setUser(res.user);
        setLinkedProfile(res.linkedProfile);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('coop_token');
    localStorage.removeItem('coop_demo_user_id');
    setToken(null);
    setUser(null);
    setLinkedProfile(null);
  };

  const resetAllData = async () => {
    try {
      await api.resetDemoData();
      if (user) {
        const res = await api.getProfile();
        if (res.success) {
          setUser(res.user);
          setLinkedProfile(res.linkedProfile);
        }
      }
      return true;
    } catch (err) {
      console.error('Reset data error:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        linkedProfile,
        token,
        loading,
        login,
        register,
        logout,
        quickSwitchRole,
        resetAllData,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
