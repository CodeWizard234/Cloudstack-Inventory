import axios from 'axios';

const getDefaultApiBaseURL = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || getDefaultApiBaseURL(),
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;