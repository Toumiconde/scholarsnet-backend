import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      // Set stored user immediately so UI doesn't flash
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Re-fetch full profile from API to always have the latest role
      api.get('/auth/me').then(({ data }) => {
        const fresh = { ...parsed, ...data };
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      }).catch(() => {
        // If /auth/me fails (expired token), clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.chercheur));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.chercheur);
      return data.chercheur;
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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Erreur lors de la déconnexion backend', err);
    }
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
