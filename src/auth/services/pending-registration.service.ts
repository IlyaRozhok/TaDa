import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { GoogleUser } from "../strategies/google.strategy";

export interface PendingRegistration {
  id: string;
  googleUser: GoogleUser;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class PendingRegistrationService {
  // In-memory storage (for development)
  // For production, use Redis or database table
  private pendingRegistrations = new Map<string, PendingRegistration>();

  constructor(private readonly configService: ConfigService) {
    // Clean up expired registrations every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Store Google user data temporarily until role is selected
   */
  storePendingRegistration(googleUser: GoogleUser): string {
    const registrationId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    const pendingReg: PendingRegistration = {
      id: registrationId,
      googleUser,
      expiresAt,
      createdAt: new Date(),
    };

    this.pendingRegistrations.set(registrationId, pendingReg);

    console.log(
      `✅ Stored pending registration: ${registrationId} for ${googleUser.email}`
    );
    return registrationId;
  }

  /**
   * Retrieve and remove pending registration
   */
  consumePendingRegistration(registrationId: string): GoogleUser | null {
    const pendingReg = this.pendingRegistrations.get(registrationId);

    if (!pendingReg) {
      console.log(`❌ Pending registration not found: ${registrationId}`);
      return null;
    }

    if (pendingReg.expiresAt < new Date()) {
      console.log(`❌ Pending registration expired: ${registrationId}`);
      this.pendingRegistrations.delete(registrationId);
      return null;
    }

    // Consume the registration (remove from storage)
    this.pendingRegistrations.delete(registrationId);
    console.log(
      `✅ Consumed pending registration: ${registrationId} for ${pendingReg.googleUser.email}`
    );

    return pendingReg.googleUser;
  }

  /**
   * Clean up expired registrations
   */
  private cleanupExpired(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, pendingReg] of this.pendingRegistrations) {
      if (pendingReg.expiresAt < now) {
        this.pendingRegistrations.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 Cleaned up ${cleanedCount} expired pending registrations`
      );
    }
  }

  /**
   * Get statistics (for monitoring)
   */
  getStats() {
    return {
      totalPending: this.pendingRegistrations.size,
      pendingRegistrations: Array.from(this.pendingRegistrations.values()).map(
        (reg) => ({
          id: reg.id,
          email: reg.googleUser.email,
          createdAt: reg.createdAt,
          expiresAt: reg.expiresAt,
        })
      ),
    };
  }
}

// Alternative: Database-based storage (recommended for production)
/*
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pending_registrations')
export class PendingRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  google_user_data: GoogleUser;

  @Column()
  expires_at: Date;

  @Column()
  created_at: Date;
}
*/
