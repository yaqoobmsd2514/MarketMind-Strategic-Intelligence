import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  timeout: 30000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.accessToken;
        localStorage.setItem('mm_token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('mm_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export default api;
