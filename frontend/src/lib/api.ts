import axios from 'axios';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('lotus-lion-storage');
    if (storage) {
      try {
        const { state } = JSON.parse(storage);
        if (state.userInfo && state.userInfo.token) {
          config.headers.Authorization = `Bearer ${state.userInfo.token}`;
        }
      } catch (e) {
        console.error('Error parsing storage', e);
      }
    }
  }
  return config;
});

// Add response interceptor for 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
        if (!isLoginRequest) {
          // Clear only user session, preserving cart items
          useStore.getState().setUserInfo(null);
          
          const isAdminRoute = window.location.pathname.startsWith('/admin');
          if (!sessionStorage.getItem('lotus-lion-auth-expired')) {
            sessionStorage.setItem('lotus-lion-auth-expired', 'true');
            toast.error('Session expired. Please sign in again.');
          }
          if (isAdminRoute) {
            window.location.href = '/login?redirect=/admin';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

