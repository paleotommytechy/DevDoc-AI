import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Define global event for non-React files (like Axios interceptors)
export const showGlobalToast = (message: string, type: ToastType = "error", duration?: number) => {
  const event = new CustomEvent("global-toast-event", {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Listen to global non-React toast triggers
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType; duration?: number }>;
      if (customEvent.detail) {
        const { message, type, duration } = customEvent.detail;
        addToast(message, type, duration);
      }
    };

    window.addEventListener("global-toast-event", handleGlobalToast);
    return () => {
      window.removeEventListener("global-toast-event", handleGlobalToast);
    };
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Portal Container */}
      <div id="toast-portal-container" className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-md pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            let bgClass = "bg-white border-slate-200 text-slate-800";
            let IconComponent = Info;
            let iconColor = "text-blue-500";
            let progressBg = "bg-blue-500";

            switch (toast.type) {
              case "success":
                bgClass = "bg-emerald-50/95 border-emerald-200 text-emerald-900";
                IconComponent = CheckCircle2;
                iconColor = "text-emerald-500";
                progressBg = "bg-emerald-500";
                break;
              case "error":
                bgClass = "bg-rose-50/95 border-rose-200 text-rose-900";
                IconComponent = AlertCircle;
                iconColor = "text-rose-500";
                progressBg = "bg-rose-500";
                break;
              case "warning":
                bgClass = "bg-amber-50/95 border-amber-200 text-amber-900";
                IconComponent = AlertTriangle;
                iconColor = "text-amber-500";
                progressBg = "bg-amber-500";
                break;
              case "info":
                bgClass = "bg-sky-50/95 border-sky-200 text-sky-900";
                IconComponent = Info;
                iconColor = "text-sky-500";
                progressBg = "bg-sky-500";
                break;
            }

            return (
              <motion.div
                key={toast.id}
                id={`toast-${toast.id}`}
                layout
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`relative overflow-hidden pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md ${bgClass}`}
              >
                <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 text-sm font-medium pr-2 leading-relaxed">
                  {toast.message}
                </div>
                <button
                  id={`close-toast-${toast.id}`}
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 shrink-0 transition-colors p-0.5 rounded-lg hover:bg-black/5"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Micro Progress Bar Animation */}
                {toast.duration && toast.duration > 0 ? (
                  <motion.div
                    id={`toast-progress-${toast.id}`}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                    className={`absolute bottom-0 left-0 h-1 ${progressBg}`}
                  />
                ) : null}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
