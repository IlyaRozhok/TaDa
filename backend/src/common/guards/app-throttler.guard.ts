import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/** The stable error code every throttled request answers with. */
export const RATE_LIMITED_CODE = "RATE_LIMITED";

/**
 * The global rate limiter, answering with a machine-readable body instead of
 * the stock `{ message: "ThrottlerException: Too Many Requests" }`, which
 * clients ended up showing to users verbatim. The client maps
 * `code: "RATE_LIMITED"` to its own translated text. Limits and the
 * Retry-After headers are unchanged — only the body is.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: RATE_LIMITED_CODE,
        message: "Too many requests. Please try again later.",
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
