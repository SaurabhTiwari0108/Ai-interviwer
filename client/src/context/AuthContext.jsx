import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchMe } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on first boot if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetchMe();
          setUser(res.user);
        } catch (error) {
          console.error("Failed to fetch user context", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
