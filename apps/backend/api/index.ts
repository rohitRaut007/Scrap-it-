import type { IncomingMessage, ServerResponse } from "http";
import express, { type Express } from "express";
// Imports the already-compiled output of `nest build` (run by the Vercel Build
// Command before functions are packaged), not raw src/ — Nest's decorator
// metadata is emitted correctly by tsc, so nothing needs re-transpiling here.
import { createApp } from "../dist/bootstrap";

let cachedServer: Express | undefined;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressInstance = express();
    const app = await createApp(expressInstance);
    await app.init();
    cachedServer = expressInstance;
  }
  return cachedServer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await bootstrapServer();
  server(req, res);
}
