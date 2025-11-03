export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: "tenant" | "operator";
    provider: string;
  };
  access_token: string;
}

export interface GoogleUserResponse {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
    provider?: string;
  };
  access_token: string;
}

export interface CheckUserResponse {
  exists: boolean;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}
