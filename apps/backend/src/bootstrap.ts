import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { Express } from "express";
import compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

export async function createApp(expressInstance?: Express): Promise<INestApplication> {
  const app = expressInstance
    ? await NestFactory.create(AppModule, new ExpressAdapter(expressInstance))
    : await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.use(compression());

  const corsOrigins = process.env.CORS_ORIGINS;
  if (!corsOrigins?.length && process.env.NODE_ENV === "production") {
    throw new Error(
      "CORS_ORIGINS must be set in production (comma-separated allowed origins).",
    );
  }
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins.split(",").map((s) => s.trim()) : [],
    credentials: true,
  });

  app.enableShutdownHooks();

  return app;
}
