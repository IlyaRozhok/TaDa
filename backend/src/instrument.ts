import * as Sentry from "@sentry/nestjs"
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enabled: process.env.NODE_ENV !== 'test',
    profilesSampleRate: 1.0,
    // Setting this option to true will send default PII data to Sentry
    // For example, automatic IP address collection on events
    // GDPR
    sendDefaultPii: true,
});