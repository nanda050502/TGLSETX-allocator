import React, { createContext, useContext, useState, useEffect } from 'react';
import { appStorage } from '../services/appStorage';

const AuthContext = createContext(null);

export const API_BASE = ''; // Client-side standalone app

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('exam_auth_token'));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('exam_auth_token');
    localStorage.removeItem('exam_auth_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      const savedUserStr = localStorage.getItem('exam_auth_user');
      if (savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch (e) {
          logout();
        }
      }
    }
    setLoading(false);
  }, [token]);

  const loginAdminOrFaculty = async (username, password) => {
    const res = appStorage.login(username, password);
    if (!res.success) {
      throw new Error(res.error || 'Login failed');
    }
    localStorage.setItem('exam_auth_token', res.token);
    localStorage.setItem('exam_auth_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginWithRoomPin = async (room_number, room_pin, staff_name) => {
    const res = appStorage.roomPinLogin(room_number, room_pin, staff_name);
    if (!res.success) {
      throw new Error(res.error || 'Room login failed');
    }
    localStorage.setItem('exam_auth_token', res.token);
    localStorage.setItem('exam_auth_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'ADMIN',
        isFaculty: user?.role === 'FACULTY',
        loginAdminOrFaculty,
        loginWithRoomPin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
