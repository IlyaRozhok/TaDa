import { authLogger } from "./authLogger";

export interface AuthError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

class AuthErrorHandlerService {
  // Handle login errors
  handleLoginError(error: any): AuthError {
    const authError = this.processError(error, "login");
    authLogger.error(authError.message, "error", {
      code: authError.code,
      statusCode: authError.statusCode,
      details: authError.details,
    });
    return authError;
  }

  // Handle registration errors
  handleRegistrationError(error: any): AuthError {
    const authError = this.processError(error, "register");
    authLogger.error(authError.message, "validation_error", {
      code: authError.code,
      statusCode: authError.statusCode,
      details: authError.details,
    });
    return authError;
  }

  // Handle session restoration errors
  handleSessionError(error: any): AuthError {
    const authError = this.processError(error, "session_restore");
    authLogger.error(authError.message, "error", {
      code: authError.code,
      statusCode: authError.statusCode,
      details: authError.details,
    });
    return authError;
  }

  // Handle general auth errors
  handleAuthError(error: any, context: string): AuthError {
    const authError = this.processError(error, context);
    authLogger.error(authError.message, "error", {
      context,
      code: authError.code,
      statusCode: authError.statusCode,
      details: authError.details,
    });
    return authError;
  }

  private processError(error: any, context: string): AuthError {
    // Handle axios errors
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string | string[]; error?: string; errors?: any };
        };
        message?: string;
      };

      const statusCode = axiosError.response?.status;
      const responseData = axiosError.response?.data;

      // Handle different status codes
      switch (statusCode) {
        case 401:
          return this.handle401Error(responseData, context);
        case 400:
          return this.handle400Error(responseData, context);
        case 409:
          return this.handle409Error(responseData, context);
        case 422:
          return this.handle422Error(responseData, context);
        case 500:
          return {
            message: "Server error occurred. Please try again later.",
            code: "SERVER_ERROR",
            statusCode,
            details: responseData,
          };
        default:
          return {
            message:
              responseData?.message ||
              axiosError.message ||
              "An unexpected error occurred",
            code: "UNKNOWN_ERROR",
            statusCode,
            details: responseData,
          };
      }
    }

    // Handle Error instances
    if (error instanceof Error) {
      return {
        message: error.message,
        code: "CLIENT_ERROR",
        details: error,
      };
    }

    // Handle string errors
    if (typeof error === "string") {
      return {
        message: error,
        code: "STRING_ERROR",
      };
    }

    // Fallback
    return {
      message: "An unknown error occurred",
      code: "UNKNOWN_ERROR",
      details: error,
    };
  }

  private handle401Error(responseData: any, context: string): AuthError {
    const contextMessages = {
      login: "Invalid email or password",
      register: "Authentication failed during registration",
      session_restore: "Your session has expired. Please log in again.",
      default: "Authentication failed",
    };

    return {
      message:
        responseData?.message ||
        contextMessages[context as keyof typeof contextMessages] ||
        contextMessages.default,
      code: "UNAUTHORIZED",
      statusCode: 401,
      details: responseData,
    };
  }

  private handle400Error(responseData: any, context: string): AuthError {
    // Handle NestJS validation errors
    if (responseData?.message && Array.isArray(responseData.message)) {
      return {
        message: responseData.message[0], // Show first validation error
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: responseData.message,
      };
    }

    const contextMessages = {
      login: "Please check your login credentials",
      register: "Please check your registration information",
      default: "Invalid request. Please check your input.",
    };

    return {
      message:
        responseData?.message ||
        contextMessages[context as keyof typeof contextMessages] ||
        contextMessages.default,
      code: "BAD_REQUEST",
      statusCode: 400,
      details: responseData,
    };
  }

  private handle409Error(responseData: any, context: string): AuthError {
    const contextMessages = {
      register: "An account with this email already exists",
      default: "Resource conflict occurred",
    };

    return {
      message:
        responseData?.message ||
        contextMessages[context as keyof typeof contextMessages] ||
        contextMessages.default,
      code: "CONFLICT",
      statusCode: 409,
      details: responseData,
    };
  }

  private handle422Error(responseData: any, context: string): AuthError {
    return {
      message:
        responseData?.message || "The provided data could not be processed",
      code: "UNPROCESSABLE_ENTITY",
      statusCode: 422,
      details: responseData,
    };
  }

  // Helper method to get user-friendly error messages
  getFriendlyErrorMessage(error: AuthError, context: string): string {
    const friendlyMessages: Record<string, Record<string, string>> = {
      login: {
        UNAUTHORIZED:
          "Oops! Those credentials don't match our records. Please try again.",
        BAD_REQUEST: "Please fill in all required fields correctly.",
        SERVER_ERROR:
          "We're having trouble connecting. Please try again in a moment.",
      },
      register: {
        CONFLICT: "This email is already registered. Try logging in instead?",
        VALIDATION_ERROR: "Please check that all fields are filled correctly.",
        BAD_REQUEST: "Please ensure all required information is provided.",
      },
      session_restore: {
        UNAUTHORIZED: "Your session has expired. Please log in to continue.",
        CLIENT_ERROR: "We couldn't restore your session. Please log in again.",
      },
    };

    return friendlyMessages[context]?.[error.code || ""] || error.message;
  }
}

export const authErrorHandler = new AuthErrorHandlerService();
