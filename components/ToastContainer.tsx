
import React from 'react';
import { type Toast } from '../types';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 w-full max-w-xs space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`relative flex items-center p-4 rounded-lg shadow-lg text-white animate-fade-in-up ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
