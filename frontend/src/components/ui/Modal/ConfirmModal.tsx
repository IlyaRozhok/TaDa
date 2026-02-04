"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Heart, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: "warning" | "danger" | "heart";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700 text-white",
  icon = "warning",
  loading = false,
}: ConfirmModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case "danger":
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case "heart":
        return <Heart className="w-6 h-6 text-rose-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent event propagation from modal content
    e.stopPropagation();
  };

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onConfirm();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md">
        {/* Glass effect modal */}
        <div
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 relative overflow-hidden"
          onClick={handleModalClick}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              {getIcon()}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelClick}
                disabled={loading}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirmClick}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass} ${
                  loading ? "relative" : ""
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <span className={loading ? "opacity-0" : "opacity-100"}>
                  {confirmText}
                </span>
              </button>
            </div>
          </div>

          {/* Decorative gradient */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-full blur-xl" />
        </div>
      </div>
    </div>
  );
}
