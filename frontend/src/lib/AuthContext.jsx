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
      mockUser = { uid: 'ADM001', nom: 'Administrateur', prenom: 'Système', email: 'admin@uganc.edu', role: 'admin' };
    } else {
      mockUser = { uid: 'CHR001', nom: 'Condé', prenom: 'Mamadou Alpha', email: 'm.conde@uganc.edu', role: 'chercheur', laboratoire: 'LARI' };
    }
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Génère un mock-token contenant le rôle et l'UID pour l'auth backend
    const mockToken = `mock-demo-token-${mockUser.role}-${mockUser.uid}`;
    localStorage.setItem('token', mockToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    
    return true;
  };

  const demoLoginCustom = (profile) => {
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
    
    const mockToken = `mock-demo-token-${profile.role}-${profile.uid}`;
    localStorage.setItem('token', mockToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, demoLogin, demoLoginCustom, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
