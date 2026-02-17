"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: "400px",
        },
        success: {
          duration: 4000,
          style: {
            background:
              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            border: "1px solid #059669",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "400px",
          },
        },
        error: {
          duration: 6000,
          style: {
            background:
              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#fff",
            border: "1px solid #dc2626",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "400px",
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} position={t.position || "top-right"}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== "loading" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  aria-label="Close"
                  className="ml-3 shrink-0 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 border border-white/20 text-white text-base leading-none cursor-pointer transition-colors"
                >
                  ×
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
