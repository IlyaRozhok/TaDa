# Frontend Integration Guide

## Expected Backend Responses

### 1. Existing User (SUCCESS)

When an existing user completes Google OAuth:

```javascript
// Redirects to: /auth/success?token=xxx&refresh_token=yyy

// Backend response structure:
{
  "status": "SUCCESS",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "tenant",
    "avatar_url": "https://...",
    "tenantProfile": { ... }
  }
}
```

### 2. New User (NEEDS_ROLE_SELECTION)

When a new user completes Google OAuth:

```javascript
// Redirects to: /auth/role-selection?registration_id=uuid

// Backend response structure:
{
  "status": "NEEDS_ROLE_SELECTION",
  "registration_id": "uuid-registration-id",
  "message": "Please select your role to complete registration"
}
```

### 3. After Role Selection (SUCCESS)

When user completes role selection:

```javascript
// POST /auth/complete-registration
{
  "registration_id": "uuid-registration-id",
  "role": "tenant" // or "operator"
}

// Backend response:
{
  "status": "SUCCESS",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "full_name": "Jane Doe",
    "role": "tenant",
    "avatar_url": "https://...",
    "tenantProfile": { ... }
  }
}
```

## Frontend Implementation Examples

### React/Next.js Implementation

```typescript
// pages/auth/role-selection.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function RoleSelection() {
  const router = useRouter();
  const { registration_id } = router.query;
  const [selectedRole, setSelectedRole] = useState<
    "tenant" | "operator" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelection = async () => {
    if (!selectedRole || !registration_id) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/complete-registration", {
        registration_id,
        role: selectedRole,
      });

      if (response.data.status === "SUCCESS") {
        // Store tokens
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);

        // Store user data
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Redirect based on role
        if (selectedRole === "tenant") {
          router.push("/tenant/dashboard");
        } else {
          router.push("/operator/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Choose Your Role
        </h2>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => setSelectedRole("tenant")}
            className={`w-full p-4 border rounded-lg text-left ${
              selectedRole === "tenant"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
          >
            <h3 className="font-semibold">I'm looking for a place</h3>
            <p className="text-sm text-gray-600">Find and rent properties</p>
          </button>

          <button
            onClick={() => setSelectedRole("operator")}
            className={`w-full p-4 border rounded-lg text-left ${
              selectedRole === "operator"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
          >
            <h3 className="font-semibold">I have properties to rent</h3>
            <p className="text-sm text-gray-600">List and manage properties</p>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
```

### Auth Success Handler

```typescript
// pages/auth/success.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthSuccess() {
  const router = useRouter();
  const { token, refresh_token } = router.query;

  useEffect(() => {
    if (token && refresh_token) {
      // Store tokens
      localStorage.setItem("access_token", token as string);
      localStorage.setItem("refresh_token", refresh_token as string);

      // Get user profile
      fetchUserProfile();
    }
  }, [token, refresh_token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Store user data and redirect
      localStorage.setItem("user", JSON.stringify(response.data));

      if (response.data.role === "tenant") {
        router.push("/tenant/dashboard");
      } else {
        router.push("/operator/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      router.push("/auth/error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
```

### Auth Service Helper

```typescript
// services/authService.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const authService = {
  // Complete registration with role
  completeRegistration: async (
    registrationId: string,
    role: "tenant" | "operator"
  ) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/complete-registration`,
      {
        registration_id: registrationId,
        role,
      }
    );
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
```

## Testing the Flow

### Backend Testing Script

```typescript
// test-google-oauth-flow.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../src/auth/auth.service";
import { PendingRegistrationService } from "../src/auth/services/pending-registration.service";
import { UserService } from "../src/user/user.service";

describe("Google OAuth Flow", () => {
  let authService: AuthService;
  let pendingRegistrationService: PendingRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PendingRegistrationService,
        // Mock UserService
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            createFromGoogle: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    pendingRegistrationService = module.get<PendingRegistrationService>(
      PendingRegistrationService
    );
  });

  it("should handle new user OAuth flow", async () => {
    const mockGoogleUser = {
      google_id: "test-google-id",
      email: "test@example.com",
      full_name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
      email_verified: true,
    };

    // Mock user not found
    jest.spyOn(userService, "findByEmail").mockResolvedValue(null);

    const result = await authService.handleGoogleCallback(mockGoogleUser);

    expect(result.status).toBe("NEEDS_ROLE_SELECTION");
    expect(result.registration_id).toBeDefined();
  });

  it("should complete registration with role", async () => {
    const mockGoogleUser = {
      google_id: "test-google-id",
      email: "test@example.com",
      full_name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
      email_verified: true,
    };

    // Store pending registration
    const registrationId =
      pendingRegistrationService.storePendingRegistration(mockGoogleUser);

    // Mock user creation
    const mockCreatedUser = {
      id: "user-id",
      ...mockGoogleUser,
      role: "tenant",
    };
    jest
      .spyOn(userService, "createFromGoogle")
      .mockResolvedValue(mockCreatedUser);

    const result = await authService.completeRegistration({
      registration_id: registrationId,
      role: "tenant",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.access_token).toBeDefined();
    expect(result.user.role).toBe("tenant");
  });
});
```

### Manual Testing Checklist

1. **New User Flow:**

   - [ ] Click "Sign in with Google" button
   - [ ] Complete Google OAuth
   - [ ] Get redirected to role selection page
   - [ ] Select role and submit
   - [ ] Get redirected to appropriate dashboard
   - [ ] Check that user and profile are created in database

2. **Existing User Flow:**

   - [ ] Click "Sign in with Google" with existing account
   - [ ] Get redirected directly to dashboard
   - [ ] Verify tokens are valid

3. **Edge Cases:**
   - [ ] Expired registration ID
   - [ ] Invalid registration ID
   - [ ] User created between OAuth and role selection
   - [ ] Token refresh functionality

## Production Considerations

### 1. Storage Solutions

**Development:** In-memory storage (current implementation)
**Production:** Use one of these:

```typescript
// Option 1: Redis
import { Injectable } from "@nestjs/common";
import { RedisService } from "@nestjs-modules/ioredis";

@Injectable()
export class RedisPendingRegistrationService {
  constructor(private readonly redis: RedisService) {}

  async storePendingRegistration(googleUser: GoogleUser): Promise<string> {
    const registrationId = crypto.randomUUID();
    await this.redis.setex(
      `pending:${registrationId}`,
      15 * 60, // 15 minutes
      JSON.stringify(googleUser)
    );
    return registrationId;
  }
}

// Option 2: Database table
@Entity("pending_registrations")
export class PendingRegistrationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("jsonb")
  google_user_data: GoogleUser;

  @Column()
  expires_at: Date;
}
```

### 2. Security Considerations

- Validate registration IDs are UUIDs
- Implement rate limiting on registration endpoints
- Add CSRF protection
- Validate Google OAuth state parameter
- Use secure JWT settings

### 3. Monitoring

```typescript
// Add metrics to track:
- Pending registrations count
- Conversion rate (OAuth → completed registration)
- Expired registrations
- Failed completions
```

This implementation provides a clean, secure, and scalable solution for your Google OAuth flow with role selection!
