import { Catch, ArgumentsHost } from '@nestjs/common';
import type { HttpServer } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import type { PinoLogger } from 'nestjs-pino';

@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
    constructor(
        applicationRef: HttpServer,
        private readonly logger: PinoLogger,
    ) {
        super(applicationRef);
    }

    catch(exception: unknown, host: ArgumentsHost) {
        // Не логируем 4xx — это ошибки клиента, не баги
        const status = this.getHttpStatus(exception);
        if (!status || status >= 500) {
            Sentry.captureException(exception);
        }

        this.log(exception, status, host);
        super.catch(exception, host);
    }

    /**
     * Nest's own BaseExceptionFilter only logs what it fails to recognise, so an
     * HttpException carrying a 500 used to leave no trace at all. Everything
     * reaching this filter is logged here instead, carrying the request id so a
     * report can be tied back to its access line.
     */
    private log(exception: unknown, status: number | null, host: ArgumentsHost) {
        const request = host.switchToHttp().getRequest();
        const context = {
            reqId: request?.id,
            method: request?.method,
            path: request?.url,
            statusCode: status ?? 500,
        };
        const message =
            exception instanceof Error ? exception.message : String(exception);

        if (status && status < 500) {
            // Client errors are worth counting, not worth a stack trace.
            this.logger.warn(context, message);
            return;
        }

        this.logger.error(
            {
                ...context,
                stack: exception instanceof Error ? exception.stack : undefined,
            },
            message,
        );
    }

    private getHttpStatus(exception: unknown): number | null {
        if (exception instanceof Error && 'status' in exception) {
            return (exception as any).status;
        }
        return null;
    }
}
