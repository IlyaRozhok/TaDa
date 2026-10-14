import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PhoneVerificationEvent } from "@/entities/phone-verification-event.entity";
import { User } from "@/entities/user.entity";
import { OTP_PROVIDER } from "./otp/otp-provider";
import { createOtpProvider } from "./otp/otp-provider.factory";
import { PhoneVerificationController } from "./phone-verification.controller";
import { PhoneVerificationLedger, TypeOrmPhoneVerificationLedger } from "./phone-verification.ledger";
import { PhoneVerificationService } from "./phone-verification.service";
import { TurnstileService } from "./turnstile.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, PhoneVerificationEvent])],
  controllers: [PhoneVerificationController],
  providers: [
    // Built once at boot: a misconfiguration (twilio without credentials, or
    // the gate on in production without Twilio) stops the app here.
    { provide: OTP_PROVIDER, useFactory: () => createOtpProvider() },
    { provide: PhoneVerificationLedger, useClass: TypeOrmPhoneVerificationLedger },
    TurnstileService,
    PhoneVerificationService,
  ],
})
export class PhoneVerificationModule {}
