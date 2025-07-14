import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import * as cors from "cors";
import * as path from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Set request body size limits
  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // Статическая раздача файлов для uploads
  const uploadsPath =
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "..", "uploads")
      : path.join(process.cwd(), "uploads");

  console.log(`📁 Serving static files from: ${uploadsPath}`);
  app.useStaticAssets(uploadsPath, {
    prefix: "/uploads/",
  });

  // CORS configuration for both development and production
  const corsConfig = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://tada.illiacodes.dev",
        "https://www.tada.illiacodes.dev",
        "https://api.tada.illiacodes.dev",
        "https://www.tada.illiacodes.dev",
      ];

      // Add custom domain from environment variable
      if (process.env.CORS_ORIGIN) {
        const origins = process.env.CORS_ORIGIN.split(",").map((o) => o.trim());
        allowedOrigins.push(...origins);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check Vercel domains for production
      if (process.env.NODE_ENV === "production") {
        if (
          origin.match(/^https:\/\/.*\.vercel\.app$/) ||
          origin.match(/^https:\/\/.*\.vercel\.com$/)
        ) {
          return callback(null, true);
        }
      }

      // Reject origin
      callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Access-Control-Allow-Headers",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tada.illiacodes.dev",
        "https://www.tada.illiacodes.dev",
      ];

      if (process.env.CORS_ORIGIN) {
        const origins = process.env.CORS_ORIGIN.split(",").map((o) => o.trim());
        allowedOrigins.push(...origins);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin?.match(/^https:\/\/.*\.vercel\.app$/) ||
        origin?.match(/^https:\/\/.*\.vercel\.com$/)
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Временно разрешаем дополнительные поля
      transform: true,
    })
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle("TaDa Rental Platform API")
    .setDescription("API for connecting tenants and property operators")
    .setVersion("1.0")
    .addBearerAuth(
      {
        description: `JWT Authorization header using the Bearer scheme.
        Enter 'Bearer' [space] and then your token in the text input below.
        Example: "Bearer 12345abcdef"`,
        name: "Authorization",
        bearerFormat: "JWT",
        scheme: "Bearer",
        type: "http",
        in: "Header",
      },
      "access-token"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 5001;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
