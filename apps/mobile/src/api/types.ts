/**
 * Transport boundary for future HTTP client. Services call repositories
 * today; swap implementations here when wiring real APIs.
 */
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ApiError {
  message: string;
  status?: number;
}
