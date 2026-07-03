import axios from "axios";

// Standard development URL for the FastAPI backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercept requests to inject the JWT access token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fixora_access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle auth errors / token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("fixora_refresh_token");
        if (refreshToken) {
          // Attempt to refresh tokens
          // In our simple API we can exchange or just redirect, let's try a quick logout if refresh fails
          // For now, let's clean local storage and push to login if 401 persists
        }
      } catch (e) {
        console.error("Token refresh failed:", e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
