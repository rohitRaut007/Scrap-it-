interface MapTelemetryContext {
  screen: "map";
  reason?: string;
}

export interface MapTelemetry {
  trackEvent(event: string, context: MapTelemetryContext): void;
  trackError(error: unknown, context: MapTelemetryContext): void;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "unknown_error";
}

interface SentryLike {
  captureMessage?: (message: string, context?: Record<string, unknown>) => void;
  captureException?: (
    error: unknown,
    context?: { extra?: Record<string, unknown> }
  ) => void;
}

function getSentryClient(): SentryLike | null {
  const candidate = (globalThis as { Sentry?: SentryLike }).Sentry;
  return candidate ?? null;
}

export const mapTelemetry: MapTelemetry = {
  trackEvent(event, context) {
    const sentry = getSentryClient();
    sentry?.captureMessage?.(`map_event:${event}`, {
      screen: context.screen,
      reason: context.reason,
    });
  },
  trackError(error, context) {
    const sentry = getSentryClient();
    sentry?.captureException?.(error, {
      extra: {
        screen: context.screen,
        reason: context.reason,
        message: toErrorMessage(error),
      },
    });
  },
};
