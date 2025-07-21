"use client";

import React from "react";
import { X } from "lucide-react";

interface NotificationProps {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}

interface AdminNotificationsProps {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info";
    message: string;
  }>;
  onCloseNotification: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
}) => {
  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: (
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ),
          textColor: "text-green-800",
          buttonColor: "text-green-400 hover:text-green-600",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: (
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
          textColor: "text-red-800",
          buttonColor: "text-red-400 hover:text-red-600",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: (
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          ),
          textColor: "text-blue-800",
          buttonColor: "text-blue-400 hover:text-blue-600",
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg p-4 shadow-lg max-w-sm`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3">
          <p className={`text-sm ${styles.textColor}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`${styles.buttonColor} transition-colors`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  notifications,
  onCloseNotification,
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onCloseNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default AdminNotifications;
