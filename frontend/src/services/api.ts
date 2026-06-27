import axios from "axios";

// Using relative path so it automatically works on the same domain/port in development and preview
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for httpOnly cookie authentication
  headers: {
    "Content-Type": "application/json",
  },
});

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  framework?: string | null;
  language?: string | null;
  route_count?: number | null;
  controller_count?: number | null;
  middleware_count?: number | null;
  model_count?: number | null;
  database?: string | null;
  authentication?: string | null;
  analysis_status?: string | null;
  analysis_completed_at?: string | null;
  routes_discovered?: any[] | string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// --- Auth Endpoints ---

export const authApi = {
  register: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const res = await api.post("/auth/register", { email, password });
    return res.data;
  },

  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

// --- Projects Endpoints ---

export const projectsApi = {
  getAll: async (): Promise<ApiResponse<{ projects: Project[] }>> => {
    const res = await api.get("/projects");
    return res.data;
  },

  getOne: async (id: string): Promise<ApiResponse<{ project: Project }>> => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  create: async (name: string, description: string | null): Promise<ApiResponse<{ project: Project }>> => {
    const res = await api.post("/projects", { name, description });
    return res.data;
  },

  update: async (
    id: string,
    updates: { name?: string; description?: string | null; status?: string }
  ): Promise<ApiResponse<{ project: Project }>> => {
    const res = await api.put(`/projects/${id}`, updates);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  uploadCodebase: async (id: string, file: File): Promise<ApiResponse<{ project: any }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/projects/${id}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
