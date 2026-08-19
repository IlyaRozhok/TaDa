import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sender used when NOTIFICATIONS_FROM is not set. Must be verified in SES. */
const DEFAULT_FROM_ADDRESS = "no-reply@ta-da.co";

/**
 * The single place the application talks to an SMTP provider.
 *
 * Credentials and the degraded mode follow `S3Service`: static IAM keys out of
 * the environment, and a no-op mode when they are absent. It differs from
 * `S3Service` in one deliberate way — missing credentials in production log a
 * warning instead of throwing at construction. An unsendable notification is a
 * missing email; a backend that refuses to boot is a missing product.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: SESv2Client | null;
  private readonly fromAddress: string;
  private readonly isDevMode: boolean;

  constructor(private readonly configService: ConfigService) {
    // SES-specific keys win when present; otherwise the same pair S3 already
    // uses, so adding ses:SendEmail to that identity is all a host needs.
    const accessKeyId =
      this.configService.get<string>("AWS_SES_ACCESS_KEY_ID")?.trim() ||
      this.configService.get<string>("AWS_ACCESS_KEY_ID")?.trim();
    const secretAccessKey =
      this.configService.get<string>("AWS_SES_SECRET_ACCESS_KEY")?.trim() ||
      this.configService.get<string>("AWS_SECRET_ACCESS_KEY")?.trim();
    const region =
      this.configService.get<string>("AWS_SES_REGION")?.trim() ||
      this.configService.get<string>("AWS_REGION")?.trim() ||
      "eu-west-2";

    this.fromAddress =
      this.configService.get<string>("NOTIFICATIONS_FROM")?.trim() ||
      DEFAULT_FROM_ADDRESS;

    // Held in a local as well as on the instance: narrowing a field does not
    // survive into the branch below, and both keys are provably set past it.
    const hasCredentials = Boolean(accessKeyId && secretAccessKey);
    this.isDevMode = !hasCredentials;

    if (!hasCredentials) {
      this.client = null;
      this.logger.warn(
        "AWS SES credentials are not configured — email delivery runs in log-only mode.",
      );
      return;
    }

    this.client = new SESv2Client({
      region,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  /** True when a real SES client is behind `sendEmail`. */
  isConfigured(): boolean {
    return !this.isDevMode;
  }

  getFromAddress(): string {
    return this.fromAddress;
  }

  /**
   * Sends one email. Throws on provider failure — the caller records the error
   * and schedules a retry, which is why the failure has to be visible here.
   */
  async sendEmail(email: OutboundEmail): Promise<void> {
    if (this.isDevMode) {
      this.logger.log(
        `[log-only] email to ${email.to}: ${email.subject}\n${email.text}`,
      );
      return;
    }

    const command = new SendEmailCommand({
      FromEmailAddress: this.fromAddress,
      Destination: { ToAddresses: [email.to] },
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: email.text, Charset: "UTF-8" },
            ...(email.html
              ? { Html: { Data: email.html, Charset: "UTF-8" } }
              : {}),
          },
        },
      },
    });

    await this.client!.send(command);
  }
}
