import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.chercheur));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.chercheur);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const demoLogin = (role) => {
    let mockUser;
    if (role === 'admin') {
      mockUser = { uid: 'ADM001', nom: 'Administrateur', email: 'admin@uganc.edu', role: 'admin' };
    } else {
      mockUser = { uid: 'CHR001', nom: 'Condé', prenom: 'Mamadou Alpha', email: 'm.conde@uganc.edu', role: 'chercheur', laboratoire: 'LARI' };
    }
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
