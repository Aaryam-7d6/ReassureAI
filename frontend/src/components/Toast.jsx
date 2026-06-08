import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", details = null) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, details }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle className="text-current h-5 w-5" />,
    error: <AlertCircle className="text-current h-5 w-5" />,
    info: <Info className="text-current h-5 w-5" />,
  };

  const toastClasses = {
    success: "toast-glass toast-success",
    error: "toast-glass toast-error",
    info: "toast-glass toast-info",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`p-4 rounded-[1rem] border pointer-events-auto flex gap-3 max-w-sm ${toastClasses[toast.type]}`}
    >
      <div className="mt-0.5 flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{toast.message}</p>
        {toast.details && Array.isArray(toast.details) && (
          <ul className="mt-2 text-xs list-disc pl-4 space-y-1">
            {toast.details.map((detail, i) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 flex-shrink-0 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
