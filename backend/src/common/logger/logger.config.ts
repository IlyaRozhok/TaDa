import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import type { Params } from "nestjs-pino";

/** Paths answered on every health check — they would drown the access log. */
const SILENT_PATHS = ["/api/health", "/health"];

/**
 * Anything that can carry a session. Authentication here is a JWT in an
 * httpOnly cookie, so an unredacted access log would hand out live sessions to
 * whoever can read the container output.
 */
const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export function buildLoggerParams(env: NodeJS.ProcessEnv): Params {
  const isProduction = env.NODE_ENV === "production";

  return {
    pinoHttp: {
      level: isProduction ? "info" : "debug",

      // Production writes JSON straight to stdout; development goes through
      // pino-pretty, which is a devDependency and must not be reached in prod.
      transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: {
              singleLine: true,
              colorize: true,
              translateTime: "HH:MM:ss.l",
              ignore: "pid,hostname",
            },
          },

      redact: {
        paths: REDACTED_PATHS,
        censor: "[REDACTED]",
      },

      // Reuse the id the reverse proxy assigned when there is one, so a request
      // can be followed across nginx and the application. nginx does not send
      // the header today (see step 3.1), hence the fallback.
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers["x-request-id"];
        const id = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },

      autoLogging: {
        ignore: (req: IncomingMessage) => {
          const path = (req.url ?? "").split("?")[0];
          return SILENT_PATHS.includes(path);
        },
      },
    },
  };
}
