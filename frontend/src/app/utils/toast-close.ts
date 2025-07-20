import toast from "react-hot-toast";

// Add click handlers to make toasts dismissible
export const initToastCloseHandlers = () => {
  // Add event delegation for toast clicks
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    // Check if clicked element is a toast or inside a toast
    const toastElement = target.closest("[data-hot-toast-id]");
    if (toastElement) {
      const toastId = toastElement.getAttribute("data-hot-toast-id");
      if (toastId) {
        // Dismiss the clicked toast
        toast.dismiss(toastId);
      }
    }
  });
};

// Enhanced toast functions with automatic close button
export const adminToast = {
  success: (message: string, options: any = {}) => {
    return toast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  error: (message: string, options: any = {}) => {
    return toast.error(message, {
      duration: 6000,
      ...options,
    });
  },

  info: (message: string, options: any = {}) => {
    return toast(message, {
      duration: 4000,
      ...options,
    });
  },
};

export default adminToast;
