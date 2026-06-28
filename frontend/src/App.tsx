import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectAnalysis from "./pages/ProjectAnalysis";
import DocumentationPreview from "./pages/DocumentationPreview";
import { Loader2 } from "lucide-react";

// Initialize TanStack React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard route for authenticated users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Checking session status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Guard route for non-authenticated guests
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Checking session status...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<Home />} />

              {/* Guest routes (Redirects to dashboard if already logged in) */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />

              {/* Protected routes (Redirects to login if not logged in) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/analysis"
                element={
                  <ProtectedRoute>
                    <ProjectAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/documentation"
                element={
                  <ProtectedRoute>
                    <DocumentationPreview />
                  </ProtectedRoute>
                }
              />

              {/* Fallback routing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
