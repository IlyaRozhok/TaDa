import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        // Не логируем 4xx — это ошибки клиента, не баги
        const status = this.getHttpStatus(exception);
        if (!status || status >= 500) {
            Sentry.captureException(exception);
        }
        super.catch(exception, host);
    }

    private getHttpStatus(exception: unknown): number | null {
        if (exception instanceof Error && 'status' in exception) {
            return (exception as any).status;
        }
        return null;
    }
}