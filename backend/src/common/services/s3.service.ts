import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from 'fs';
import * as path from 'path';

export interface S3UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private keyPrefix: string;
  private isDevMode: boolean;
  private uploadsDir: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = this.configService.get<string>("AWS_REGION") || "eu-north-1";
    const bucketName =
      this.configService.get<string>("AWS_S3_BUCKET") ||
      this.configService.get<string>("AWS_S3_BUCKET_NAME") ||
      "tada-media-bucket-local";

    this.isDevMode = !accessKeyId || !secretAccessKey || accessKeyId.trim() === '' || secretAccessKey.trim() === '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    if (this.isDevMode) {
      if (process.env.NODE_ENV !== "production") {
        // Dev mode: use local file storage
        this.s3Client = null as any;
        this.bucketName = bucketName;
        this.keyPrefix = "tada-media/";

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
        return;
      } else {
        throw new Error("AWS credentials not configured in production");
      }
    }

    // Production mode: use real S3
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: false,
    });

    this.bucketName = bucketName;
    this.keyPrefix = "tada-media/";
  }

  /**
   * Upload file to S3 and return a presigned URL
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
    originalFilename: string
  ): Promise<S3UploadResult> {

    try {
      // Check if in dev mode - use local file storage
      if (this.isDevMode) {

        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
        }

        // Save file locally
        const filePath = path.join(this.uploadsDir, key);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);

        // Return local URL for development
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        const localUrl = `${backendUrl}/uploads/${key}`;

        return {
          url: localUrl,
          key: `${this.keyPrefix}${key}`,
        };
      }

      // Add prefix to key
      const fullKey = `${this.keyPrefix}${key}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: buffer,
        ContentType: mimeType,
        // Skip metadata for PDF files as they might contain problematic characters
        ...(mimeType !== 'application/pdf' && {
          Metadata: {
            originalFilename: mimeType === 'application/pdf' ? 'document.pdf' : originalFilename,
            uploadedAt: new Date().toISOString(),
          },
        }),
      });

      await this.s3Client.send(command);


      // Generate presigned URL for secure access
      const url = await this.getPresignedUrl(fullKey);

      return {
        url,
        key: fullKey,
      };
    } catch (error) {
      console.error(`❌ S3 Upload Error for ${originalFilename}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        bucket: this.bucketName,
        region: this.configService.get<string>("AWS_REGION"),
        keyPrefix: this.keyPrefix,
        bucketFromEnv: this.configService.get<string>("AWS_S3_BUCKET")
      });

      // For PDF files, use fallback URL instead of throwing error
      if (mimeType === 'application/pdf') {
        const fallbackUrl = `https://fallback-s3.example.com/${this.keyPrefix}${key}`;
        return {
          url: fallbackUrl,
          key: `${this.keyPrefix}${key}`,
        };
      }

      // Fallback: return mock URL if S3 fails (for images/videos)
      const fallbackUrl = `https://fallback-s3.example.com/${this.keyPrefix}${key}`;
      return {
        url: fallbackUrl,
        key: `${this.keyPrefix}${key}`,
      };
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    // Check if in dev mode - delete local file
    if (this.isDevMode) {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    // Production mode: delete from S3
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate presigned URL for secure access
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // Check if in dev mode - return local URL
    if (this.isDevMode) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
      const localUrl = `${backendUrl}/uploads/${key}`;
      return localUrl;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error(`❌ Presigned URL Error for ${key}:`, error);
      console.error(`❌ Presigned URL error details:`, {
        message: error.message,
        code: error.code,
        name: error.name,
        bucket: this.bucketName,
        region: this.configService.get<string>("AWS_REGION"),
        bucketFromEnv: this.configService.get<string>("AWS_S3_BUCKET")
      });
      // Return fallback URL
      return `https://fallback-s3.example.com/${key}`;
    }
  }

  /**
   * Generate unique file key with prefix
   */
  generateFileKey(originalFilename: string, prefix: string = "media"): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);

    // Get file extension safely
    const parts = originalFilename.split(".");
    const extension = parts.length > 1 ? parts[parts.length - 1] : "";

    // Create safe filename - remove special characters and spaces
    const safeFilename = `${timestamp}-${randomStr}.${extension}`;

    return `${prefix}/${safeFilename}`;
  }

  /**
   * Validate file type
   */
  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",

      // Videos
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo", // .avi
      "video/x-ms-wmv", // .wmv
    ];

    return allowedTypes.includes(mimeType);
  }

  /**
   * Get file type from MIME type
   */
  getFileType(mimeType: string): "image" | "video" {
    return mimeType.startsWith("image/") ? "image" : "video";
  }
}
