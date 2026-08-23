import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('coop_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [linkedProfile, setLinkedProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coop_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('coop_token');
      if (storedToken) {
        const decoded = decodeJWT(storedToken);
        if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
          logout();
          setLoading(false);
          return;
        }
        const storedUser = localStorage.getItem('coop_user');
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch {}
        }
        try {
          const res = await api.getProfile();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('coop_user', JSON.stringify(res.user));
          }
        } catch {
          if (!storedUser) logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const persistAuth = (tokenVal, userVal) => {
    localStorage.setItem('coop_token', tokenVal);
    localStorage.setItem('coop_user', JSON.stringify(userVal));
    localStorage.setItem('coop_demo_user_id', userVal.id);
    setToken(tokenVal);
    setUser(userVal);
  };

  const login = async (identifier, password) => {
    try {
      const res = await api.login({ email: identifier, password });
      if (res.success) {
        persistAuth(res.token, res.user);
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
      const res = await api.login({ email: email, password: 'password123' });
      if (res.success) {
        persistAuth(res.token, res.user);
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
        persistAuth(res.token, res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('coop_token');
    localStorage.removeItem('coop_user');
    localStorage.removeItem('coop_demo_user_id');
    setToken(null);
    setUser(null);
    setLinkedProfile(null);
  };

  const googleLogin = async (googleToken) => {
    try {
      const res = await api.googleLogin(googleToken);
      if (res.success) {
        persistAuth(res.token, res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Google login failed' };
    }
  };

  const resetAllData = async () => {
    try {
      await api.resetDemoData();
      if (user) {
        const res = await api.getProfile();
        if (res.success) {
          setUser(res.user);
          localStorage.setItem('coop_user', JSON.stringify(res.user));
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
        googleLogin,
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
