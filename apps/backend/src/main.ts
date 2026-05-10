import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  const corsOrigins = process.env.CORS_ORIGINS;
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins.split(",").map((s) => s.trim()) : true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  Logger.log(`Listening on http://${host === "0.0.0.0" ? "localhost" : host}:${port} (bound ${host})`, "Bootstrap");
}

void bootstrap();
