import "./instrument";
import {HttpAdapterHost, NestFactory} from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import { Logger, PinoLogger } from "nestjs-pino";
import { AppModule } from "@/app.module";
import * as path from "path";
import { SentryGlobalFilter } from "@/common/filters/sentry-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // отключаем встроенный body parser NestJS, используем свой ниже
    // Hold Nest's own startup messages until useLogger below, so they come out
    // in the same format as everything else instead of the default console.
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ta-da.co",
      "https://www.ta-da.co",
      "https://stage.ta-da.co",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    })
  );

    const { httpAdapter } = app.get(HttpAdapterHost);
    // PinoLogger is transient-scoped, so it has to be resolved, not fetched.
    // The filter passes the request id explicitly, so an instance created
    // outside a request context is enough.
    const pinoLogger = await app.resolve(PinoLogger);
    app.useGlobalFilters(new SentryGlobalFilter(httpAdapter, pinoLogger));

  const swaggerCfg = new DocumentBuilder()
    .setTitle("TaDa Rental Platform API")
    .setDescription("API for connecting tenants and property operators")
    .setVersion("1.0")
    .addBearerAuth(
      {
        description: "JWT Bearer. Пример: 'Bearer 12345abcdef'",
        name: "Authorization",
        bearerFormat: "JWT",
        scheme: "Bearer",
        type: "http",
        in: "Header",
      },
      "access-token"
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg);

  if (process.env.NODE_ENV === "production") {
    app.use("/api/docs", (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Basic ")) {
        const [user, pass] = Buffer.from(authHeader.split(" ")[1], "base64")
          .toString()
          .split(":");
        if (
          user === process.env.SWAGGER_USER &&
          pass === process.env.SWAGGER_PASSWORD
        ) {
          return next();
        }
      }
      res.setHeader("WWW-Authenticate", 'Basic realm="Swagger"');
      res.status(401).send("Unauthorized");
    });
  }

  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ?? 5001;
  await app.listen(port, "0.0.0.0");

  logger.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
