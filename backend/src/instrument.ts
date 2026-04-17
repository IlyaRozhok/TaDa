import * as Sentry from "@sentry/nestjs"
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        nodeProfilingIntegration(),
        Sentry.requestDataIntegration({
            include: {
                data: false,   // не читаем body запроса — это ломало stream
                cookies: false,
                query_string: true,
                url: true,
                headers: false, // не отправляем заголовки (PII)
            },
        }),
    ],
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enabled: process.env.NODE_ENV !== 'test',
    profilesSampleRate: 1.0,
    sendDefaultPii: false, // GDPR: не отправляем IP и PII автоматически
});