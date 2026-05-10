import { api } from "@/lib/api";

export type SignedUpload = {
  storageKey: string;
  uploadUrl: string;
  token: string | null;
  expiresAt: string;
  bucket: string;
  maxBytes: number;
};

type SignedUploadResponse = { data: SignedUpload };

const SUPPORTED: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const uploadsService = {
  async requestOrderPhotoUpload(input: {
    contentType: string;
    contentLength: number;
  }): Promise<SignedUpload> {
    const res = await api.post<SignedUploadResponse>(
      "/uploads/order-photo-url",
      input,
    );
    return res.data;
  },

  /** Pick MIME type from a local URI / filename (best-effort fallback to image/jpeg). */
  guessContentType(uriOrName: string, hint?: string | null): string {
    if (hint && Object.values(SUPPORTED).includes(hint)) return hint;
    const lower = uriOrName.toLowerCase();
    const dot = lower.lastIndexOf(".");
    const ext = dot >= 0 ? lower.slice(dot + 1).split("?")[0] : "";
    return SUPPORTED[ext] ?? "image/jpeg";
  },

  /**
   * Two-step upload: request a signed URL, then PUT the photo bytes directly
   * to Supabase Storage. Returns the server-issued storageKey to send back
   * with `POST /orders`.
   */
  async uploadOrderPhoto(asset: {
    uri: string;
    contentType?: string | null;
    contentLength: number;
  }): Promise<SignedUpload> {
    const contentType = this.guessContentType(asset.uri, asset.contentType);
    const signed = await this.requestOrderPhotoUpload({
      contentType,
      contentLength: asset.contentLength,
    });

    const blob = await fetchAsBlob(asset.uri);
    // R2 returns an S3-style presigned PUT URL. Content-Type must match the
    // value the backend signed (we send it as the picked asset's MIME type),
    // otherwise the signature check fails.
    const res = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(
        `Upload failed (${res.status}): ${text || "no response body"}`,
      );
    }
    return signed;
  },
};

async function fetchAsBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
