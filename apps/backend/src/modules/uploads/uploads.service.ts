import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const SIGNED_PUT_TTL_SECONDS = 60 * 60; // 1 hour
const SIGNED_GET_TTL_SECONDS = 60 * 60; // 1 hour

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private clientCache: { client: S3Client; bucket: string } | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Cloudflare R2 client. R2 is S3-compatible, so we point the AWS SDK at
   * R2's endpoint (`https://<account-id>.r2.cloudflarestorage.com`) and use
   * the R2 access key as the IAM credentials.
   */
  private getClient() {
    if (this.clientCache) return this.clientCache;

    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const bucket = this.config.get<string>("R2_BUCKET");

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new BadRequestException(
        "R2 storage is not configured (need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)",
      );
    }

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.clientCache = { client, bucket };
    return this.clientCache;
  }

  get orderPhotoBucket() {
    return this.getClient().bucket;
  }

  /**
   * Issue a presigned upload URL for an order photo. Server picks the bucket
   * and builds a key under `orders/{userId}/{ulid}.{ext}` so the customer
   * cannot write to anyone else's path.
   */
  async createOrderPhotoUpload(params: {
    userId: string;
    contentType: string;
    contentLength: number;
  }) {
    const ext = MIME_TO_EXT[params.contentType];
    if (!ext) {
      throw new BadRequestException("Unsupported contentType");
    }

    const id = randomUUID();
    const storageKey = `orders/${params.userId}/${id}.${ext}`;

    const { client, bucket } = this.getClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: params.contentType,
      ContentLength: params.contentLength,
    });

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(client, command, {
        expiresIn: SIGNED_PUT_TTL_SECONDS,
      });
    } catch (err) {
      this.logger.warn(
        `getSignedUrl(PutObject) failed for ${storageKey}: ${describeError(err)}`,
      );
      throw new BadRequestException("Could not issue upload URL");
    }

    const expiresAt = new Date(
      Date.now() + SIGNED_PUT_TTL_SECONDS * 1000,
    ).toISOString();
    return {
      storageKey,
      uploadUrl,
      token: null,
      expiresAt,
      bucket,
      maxBytes: params.contentLength,
    };
  }

  /**
   * Verify that an `order-photos` storage key is owned by `userId` and the
   * object exists. Used to gate `POST /orders` photoStorageKeys.
   */
  async verifyOrderPhotoKey(
    userId: string,
    storageKey: string,
  ): Promise<boolean> {
    const expectedPrefix = `orders/${userId}/`;
    if (!storageKey.startsWith(expectedPrefix)) {
      return false;
    }
    const filename = storageKey.slice(expectedPrefix.length);
    if (!filename || filename.includes("/")) {
      return false;
    }

    const { client, bucket } = this.getClient();
    try {
      await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: storageKey }),
      );
      return true;
    } catch (err) {
      if (
        err instanceof S3ServiceException &&
        (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404)
      ) {
        return false;
      }
      this.logger.warn(
        `HeadObject failed for ${storageKey}: ${describeError(err)}`,
      );
      return false;
    }
  }

  /** Build a signed read URL (1h TTL) for the given storage key. */
  async getOrderPhotoReadUrl(storageKey: string): Promise<string | null> {
    const { client, bucket } = this.getClient();
    try {
      return await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
        { expiresIn: SIGNED_GET_TTL_SECONDS },
      );
    } catch (err) {
      this.logger.warn(
        `getSignedUrl(GetObject) failed for ${storageKey}: ${describeError(err)}`,
      );
      return null;
    }
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
