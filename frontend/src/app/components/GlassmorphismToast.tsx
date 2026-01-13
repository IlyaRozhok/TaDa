"use client";

import React from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}

interface GlassmorphismToastProps {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info";
    message: string;
  }>;
  onCloseNotification: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-white" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-white" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div
      className="relative rounded-3xl backdrop-blur-[3px] overflow-hidden min-w-[300px] max-w-[400px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
        boxShadow:
          "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="relative z-10 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const GlassmorphismToast: React.FC<GlassmorphismToastProps> = ({
  notifications,
  onCloseNotification,
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onCloseNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default GlassmorphismToast;
