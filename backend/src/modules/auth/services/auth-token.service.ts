import { Injectable, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../../entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../../../common/services/redis.module";

export interface SessionData {
  id: string;
  token: string;
  refreshTokenJti: string;
  deviceInfo?: string;
  lastActivity: Date;
  createdAt: Date;
}

export interface TempGoogleToken {
  id: string;
  googleUserData: {
    google_id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    email_verified: boolean;
  };
  expiresAt: Date;
}

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days — matches refresh token expiry
const GOOGLE_TEMP_TOKEN_TTL = 10 * 60; // 10 minutes

// Atomically find a session by refreshTokenJti, delete it, return 1 if found else 0
const ROTATE_SCRIPT = `
local sessions = redis.call('HGETALL', KEYS[1])
for i = 1, #sessions, 2 do
  local ok, data = pcall(cjson.decode, sessions[i+1])
  if ok and data.refreshTokenJti == ARGV[1] then
    redis.call('HDEL', KEYS[1], sessions[i])
    return 1
  end
end
return 0
`;

@Injectable()
export class AuthTokenService {
  constructor(
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, status: user.status },
      { expiresIn: "24h" },
    );
  }

  generateRefreshToken(user: User, jti: string): string {
    return this.jwtService.sign(
      { sub: user.id, type: "refresh", jti },
      { expiresIn: "7d" },
    );
  }

  verifyRefreshToken(token: string): { userId: string; jti: string } | null {
    try {
      const payload = this.jwtService.verify<{ sub: string; type: string; jti: string }>(token);
      if (payload.type !== "refresh" || !payload.jti) return null;
      return { userId: payload.sub, jti: payload.jti };
    } catch {
      return null;
    }
  }

  // --- Session management (Redis-backed) ---

  private sessionKey(userId: string): string {
    return `sessions:${userId}`;
  }

  async createSession(
    userId: string,
    accessToken: string,
    refreshTokenJti: string,
    deviceInfo?: string,
  ): Promise<SessionData> {
    const session: SessionData = {
      id: uuidv4(),
      token: accessToken,
      refreshTokenJti,
      deviceInfo,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    await this.redis.hset(this.sessionKey(userId), session.id, JSON.stringify(session));
    await this.redis.expire(this.sessionKey(userId), SESSION_TTL);

    return session;
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const raw = await this.redis.hgetall(this.sessionKey(userId));
    return Object.values(raw).map((s) => {
      const parsed = JSON.parse(s);
      parsed.lastActivity = new Date(parsed.lastActivity);
      parsed.createdAt = new Date(parsed.createdAt);
      return parsed as SessionData;
    });
  }

  /**
   * Atomically finds the session with `oldJti`, removes it, returns true if found.
   * Returns false if the jti was already consumed (replay attack or concurrent request).
   * On false, callers should invalidate all sessions for the user.
   */
  async rotateRefreshToken(userId: string, oldJti: string): Promise<boolean> {
    const result = await this.redis.eval(ROTATE_SCRIPT, 1, this.sessionKey(userId), oldJti);
    return result === 1;
  }

  async invalidateToken(userId: string, token: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const session = sessions.find((s) => s.token === token);
    if (session) {
      await this.redis.hdel(this.sessionKey(userId), session.id);
    }
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.redis.del(this.sessionKey(userId));
  }

  async invalidateOtherUserTokens(userId: string, currentToken: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const currentSession = sessions.find((s) => s.token === currentToken);
    if (currentSession) {
      await this.redis.del(this.sessionKey(userId));
      await this.redis.hset(this.sessionKey(userId), currentSession.id, JSON.stringify(currentSession));
      await this.redis.expire(this.sessionKey(userId), SESSION_TTL);
    }
  }

  async invalidateSession(userId: string, sessionId: string): Promise<void> {
    await this.redis.hdel(this.sessionKey(userId), sessionId);
  }

  async updateSessionActivity(userId: string, token: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const session = sessions.find((s) => s.token === token);
    if (session) {
      session.lastActivity = new Date();
      await this.redis.hset(this.sessionKey(userId), session.id, JSON.stringify(session));
    }
  }

  // --- Temporary Google OAuth tokens ---

  async createTempGoogleToken(googleUserData: TempGoogleToken["googleUserData"]): Promise<string> {
    const tokenId = uuidv4();
    const token: TempGoogleToken = {
      id: tokenId,
      googleUserData,
      expiresAt: new Date(Date.now() + GOOGLE_TEMP_TOKEN_TTL * 1000),
    };

    await this.redis.set(`google_temp:${tokenId}`, JSON.stringify(token), "EX", GOOGLE_TEMP_TOKEN_TTL);
    return tokenId;
  }

  async getTempGoogleToken(tokenId: string): Promise<TempGoogleToken | null> {
    const raw = await this.redis.get(`google_temp:${tokenId}`);
    if (!raw) return null;

    const token: TempGoogleToken = JSON.parse(raw);
    token.expiresAt = new Date(token.expiresAt);

    if (token.expiresAt < new Date()) {
      await this.redis.del(`google_temp:${tokenId}`);
      return null;
    }

    return token;
  }
}
