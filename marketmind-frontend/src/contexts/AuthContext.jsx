import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('mm_token');
    if (token) { fetchMe(); } else { setLoading(false); }
  }, []);
  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      try {
        const res = await api.post('/auth/refresh');
        localStorage.setItem('mm_token', res.data.accessToken);
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('mm_token');
      }
    } finally { setLoading(false); }
  };
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('mm_token', res.data.accessToken);
    setUser(res.data.user);
    toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 🚀`);
    return res.data.user;
  };
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('mm_token', res.data.accessToken);
    setUser(res.data.user);
    toast.success(`Welcome to MarketMind! 🎉`);
    return res.data.user;
  };
  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('mm_token');
    setUser(null);
  };
  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
