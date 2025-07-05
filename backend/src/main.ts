import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import * as cors from "cors";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Set request body size limits
  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // More permissive CORS for development
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
      ], // Specific origins
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
    })
  );

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
