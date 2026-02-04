/**
 * Axios HTTP Client Configuration
 * Centralized HTTP client with request/response interceptors
 * Handles authentication tokens and error responses automatically
 */
import axios from "axios";
import { env } from "@/config/env";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (adjust based on your auth strategy)
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle common response scenarios
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 - Unauthorized (redirect to login)
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error("Access denied");
    }

    // Handle 500 - Server Error
    if (error.response?.status === 500) {
      console.error("Server error occurred");
    }

    return Promise.reject(error);
  },
);

export default api;
