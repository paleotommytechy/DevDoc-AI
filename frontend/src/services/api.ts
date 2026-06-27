import axios from "axios";
import { showGlobalToast } from "../context/ToastContext";

// Using relative path so it automatically works on the same domain/port in development and preview
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for httpOnly cookie authentication
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercept Axios errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine the source of the error
    const isNetworkError = !error.response;
    const isBackendError = !!error.response;

    if (isNetworkError) {
      // Internet connection / Network offline / Connection refused
      const errorMessage = "Network Error: Unable to connect to the server. Please check your internet connection.";

      console.group("%c📡 [FRONTEND LOG: NETWORK/CONNECTION ERROR]", "color: #d97706; font-weight: bold; font-size: 13px;");
      console.warn("Origin: Network / Internet Connection");
      console.warn("Details:", error.message || "Unknown Network Error");
      console.warn("Suggested Action: Verify if the backend server is running and internet connectivity is active.");
      console.groupEnd();

      // Dispatch global toast
      showGlobalToast(errorMessage, "error");
    } else if (isBackendError) {
      // Backend error (HTTP 4xx or 5xx)
      const status = error.response.status;
      const data = error.response.data;
      const backendMessage = data?.message || error.message || "An error occurred on the server.";
      const requestUrl = error.config?.url || "";
      const requestMethod = error.config?.method?.toUpperCase() || "";

      console.group(`%c🖥️ [FRONTEND LOG: BACKEND API ERROR (${status})]`, "color: #dc2626; font-weight: bold; font-size: 13px;");
      console.error(`Origin: Backend API Server (${requestMethod} ${requestUrl})`);
      console.error(`HTTP Status Code: ${status}`);
      console.error(`Response Message: ${backendMessage}`);
      console.error("Full Error Response Data:", data);
      console.groupEnd();

      // Decide whether to show toast based on HTTP status
      if (status === 401) {
        // Only show if it's not the initial check auth (me)
        if (requestUrl !== "/auth/me" && !requestUrl.includes("/me")) {
          showGlobalToast("Your session has expired. Please log in again.", "warning");
        }
      } else if (status === 403) {
        showGlobalToast("You do not have permission to perform this action.", "error");
      } else if (status === 429) {
        showGlobalToast("Too many requests. Please try again later.", "warning");
      } else {
        showGlobalToast(backendMessage, "error");
      }
    }

    return Promise.reject(error);
  }
);

// Register global browser listeners for other unhandled errors (frontend errors)
if (typeof window !== "undefined") {
  const anyWindow = window as any;
  if (!anyWindow.__globalErrorListenersAttached) {
    anyWindow.__globalErrorListenersAttached = true;

    window.addEventListener("error", (event) => {
      // Ignore websocket connection errors, which are benign HMR messages
      if (event.message && (event.message.includes("websocket") || event.message.includes("vite") || event.message.includes("HMR"))) {
        return;
      }
      
      console.group("%c💻 [FRONTEND LOG: RUNTIME ERROR]", "color: #dc2626; font-weight: bold; font-size: 13px;");
      console.error("Origin: Within Frontend Application Code");
      console.error("Message:", event.message);
      console.error("Source File:", event.filename);
      console.error("Line/Col:", `${event.lineno}:${event.colno}`);
      console.error("Error Object:", event.error);
      console.groupEnd();

      // Show toast notification for unhandled frontend error
      showGlobalToast(`A frontend error occurred: ${event.message}`, "error");
    });

    window.addEventListener("unhandledrejection", (event) => {
      // Ignore websocket connection rejections
      const reasonStr = String(event.reason || "");
      if (reasonStr.includes("websocket") || reasonStr.includes("vite")) {
        return;
      }

      console.group("%c💻 [FRONTEND LOG: UNHANDLED PROMISE REJECTION]", "color: #dc2626; font-weight: bold; font-size: 13px;");
      console.error("Origin: Within Frontend (Unhandled Promise)");
      console.error("Reason / Error Object:", event.reason);
      console.groupEnd();

      const msg = event.reason?.message || event.reason || "An unexpected promise rejection occurred in the browser.";
      showGlobalToast(String(msg), "error");
    });
  }
}

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
