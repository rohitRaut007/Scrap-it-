import { Logger } from "@nestjs/common";
import { createApp } from "./bootstrap";

async function bootstrap() {
  const app = await createApp();

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  Logger.log(`Listening on http://${host === "0.0.0.0" ? "localhost" : host}:${port} (bound ${host})`, "Bootstrap");
}

void bootstrap();
