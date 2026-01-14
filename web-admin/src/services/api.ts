import axios from "axios";

const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE;
  if (envBase) {
    // Keep /api prefix, just clean up any trailing slashes
    const cleaned = envBase.replace(/\/+$/, "");
    return cleaned;
  }
  if (typeof window === "undefined") {
    return "http://localhost:8080/api";
  }
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname || "localhost";
  const currentPort = window.location.port;
  const defaultPort = protocol === "https:" ? "443" : "80";
  const portSegment = currentPort && currentPort !== defaultPort ? `:${currentPort}` : "";
  return `${protocol}//${host}${portSegment}/api`;
};

export const apiBase = resolveApiBase();

export const api = axios.create({
  baseURL: apiBase,
  timeout: 15000,
});

// Auth API functions
export const authApi = {
  login: (username: string, password: string) => {
    return api.post("/v1/auth/login", { username, password });
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("godam_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem("godam_token");
      localStorage.removeItem("godam_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
