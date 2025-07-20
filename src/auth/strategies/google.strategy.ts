import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

export interface GoogleUser {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  email_verified: boolean;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;

      if (!emails?.length || !emails[0]?.value) {
        return done(new Error("No email found in Google profile"), null);
      }

      const googleUser: GoogleUser = {
        google_id: id,
        email: emails[0].value,
        full_name: `${name.givenName || ""} ${name.familyName || ""}`.trim(),
        avatar_url: photos?.[0]?.value || null,
        email_verified: emails[0].verified || true,
      };

      done(null, googleUser);
    } catch (error) {
      done(error, null);
    }
  }
}
