import { Injectable, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../../entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../../../common/services/redis.module";

export interface SessionData {
  id: string;
  token: string;
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

// Redis key TTLs (in seconds)
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days — matches refresh token expiry
const GOOGLE_TEMP_TOKEN_TTL = 10 * 60; // 10 minutes

@Injectable()
export class AuthTokenService {
  constructor(
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return this.jwtService.sign(payload, {
      expiresIn: "24h",
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: "refresh",
    };
    return this.jwtService.sign(payload, {
      expiresIn: "7d",
    });
  }

  // --- Session management (Redis-backed) ---

  private sessionKey(userId: string): string {
    return `sessions:${userId}`;
  }

  async createSession(
    userId: string,
    token: string,
    deviceInfo?: string,
  ): Promise<SessionData> {
    const session: SessionData = {
      id: uuidv4(),
      token,
      deviceInfo,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    // Store session as a hash field keyed by session ID
    await this.redis.hset(
      this.sessionKey(userId),
      session.id,
      JSON.stringify(session),
    );
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

  async invalidateOtherUserTokens(
    userId: string,
    currentToken: string,
  ): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const currentSession = sessions.find((s) => s.token === currentToken);
    if (currentSession) {
      // Delete the whole key, then re-add only the current session
      await this.redis.del(this.sessionKey(userId));
      await this.redis.hset(
        this.sessionKey(userId),
        currentSession.id,
        JSON.stringify(currentSession),
      );
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
      await this.redis.hset(
        this.sessionKey(userId),
        session.id,
        JSON.stringify(session),
      );
    }
  }

  // --- Temporary Google OAuth tokens (Redis-backed) ---

  async createTempGoogleToken(
    googleUserData: TempGoogleToken["googleUserData"],
  ): Promise<string> {
    const tokenId = uuidv4();
    const token: TempGoogleToken = {
      id: tokenId,
      googleUserData,
      expiresAt: new Date(Date.now() + GOOGLE_TEMP_TOKEN_TTL * 1000),
    };

    await this.redis.set(
      `google_temp:${tokenId}`,
      JSON.stringify(token),
      "EX",
      GOOGLE_TEMP_TOKEN_TTL,
    );

    return tokenId;
  }

  async getTempGoogleToken(tokenId: string): Promise<TempGoogleToken | null> {
    const raw = await this.redis.get(`google_temp:${tokenId}`);
    if (!raw) return null;

    const token: TempGoogleToken = JSON.parse(raw);
    token.expiresAt = new Date(token.expiresAt);

    // Redis TTL handles expiry, but double-check just in case
    if (token.expiresAt < new Date()) {
      await this.redis.del(`google_temp:${tokenId}`);
      return null;
    }

    return token;
  }

  async getTempTokenInfo(tokenId: string): Promise<TempGoogleToken | null> {
    return this.getTempGoogleToken(tokenId);
  }
}
