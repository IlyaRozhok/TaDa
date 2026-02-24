# Security Improvements - JWT Authentication

## Changes Made

### 1. Removed Default JWT Secret ✅
- **Files changed**: `auth.module.ts`, `jwt.strategy.ts`
- **What**: Removed fallback "your-secret-key" default value
- **Impact**: Application will now throw an error on startup if `JWT_SECRET` environment variable is not set
- **Security benefit**: Prevents accidental deployment with weak default secrets

### 2. Removed JWT from URL Query Parameters ✅
- **Files changed**: `jwt.strategy.ts`, `auth.controller.ts`
- **What**: Removed `ExtractJwt.fromUrlQueryParameter("token")` from JWT extraction methods
- **Impact**: JWT tokens can no longer be passed via URL query parameters (e.g., `?token=xxx`)
- **Security benefit**: Prevents token exposure in server logs, browser history, and referrer headers

### 3. Replaced localStorage with httpOnly Cookies ✅
- **Files changed**: `auth.controller.ts`, `jwt.strategy.ts`, `main.ts`
- **Dependencies added**: `cookie-parser`, `@types/cookie-parser`
- **What**: 
  - Added cookie-parser middleware
  - Updated all auth endpoints to set/clear httpOnly cookies
  - Added cookie extraction to JWT strategy
  - Updated login/register/refresh endpoints to return success messages instead of tokens
- **Cookie settings**:
  - `httpOnly: true` - Prevents XSS access
  - `secure: true` (in production) - HTTPS only
  - `sameSite: 'lax'` - CSRF protection
  - `maxAge`: 24h for access token, 7d for refresh token
- **Security benefit**: Prevents XSS token theft, automatic CSRF protection

### 4. Added Rate Limiting ✅
- **Files changed**: `app.module.ts`, `auth.controller.ts`
- **Dependencies added**: `@nestjs/throttler`
- **What**: 
  - Global throttling with multiple time windows (1s, 10s, 1min)
  - Specific limits for auth endpoints:
    - **Register**: 1/sec, 3/10sec, 5/min
    - **Login**: 2/sec, 5/10sec, 10/min  
    - **Check User**: 2/sec, 10/10sec, 20/min
    - **Google OAuth**: 1/sec, 3/10sec, 10/min
- **Security benefit**: Prevents brute force attacks, account enumeration, and API abuse

## Environment Variables Required

```bash
# Required - application will fail to start without this
JWT_SECRET=your-super-secure-secret-key-here

# Optional - defaults provided
JWT_ACCESS_EXPIRES_IN=1d
NODE_ENV=production  # for secure cookies
```

## Frontend Changes Needed

The frontend will need to be updated to:

1. **Remove token storage logic** - tokens are now automatically handled via cookies
2. **Update auth state management** - check authentication via API calls instead of localStorage
3. **Handle cookie-based authentication** - ensure credentials are included in requests
4. **Update Google OAuth callback** - no longer receives token in URL parameters

## API Response Changes

### Before:
```json
{
  "user": {...},
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here"
}
```

### After:
```json
{
  "user": {...},
  "message": "Login successful"
}
```

Tokens are now automatically set as httpOnly cookies and don't appear in API responses.

## Testing

To test the changes:

1. **JWT Secret**: Try starting the app without `JWT_SECRET` - should fail
2. **URL Tokens**: Try accessing protected endpoints with `?token=xxx` - should fail
3. **Cookies**: Login should set cookies, logout should clear them
4. **Rate Limiting**: Make rapid requests to auth endpoints - should be throttled

## Migration Notes

- **Backward compatibility**: The API still accepts Bearer tokens in Authorization headers for existing clients
- **Gradual migration**: Frontend can be updated incrementally to use cookie-based auth
- **Session management**: Existing session invalidation endpoints continue to work