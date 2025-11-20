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
    console.log(`🔧 Initializing S3Service. NODE_ENV: ${process.env.NODE_ENV}`);

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    console.log(`🔑 AWS_ACCESS_KEY_ID present: ${!!accessKeyId} (first 4 chars: ${accessKeyId ? accessKeyId.substring(0, 4) : 'none'})`);
    console.log(`🔑 AWS_SECRET_ACCESS_KEY present: ${!!secretAccessKey} (first 4 chars: ${secretAccessKey ? secretAccessKey.substring(0, 4) : 'none'})`);
    console.log(`🔧 AWS_REGION: ${this.configService.get<string>("AWS_REGION")}`);
    console.log(`🔧 AWS_S3_BUCKET_NAME: ${this.configService.get<string>("AWS_S3_BUCKET_NAME")}`);

    const region = this.configService.get<string>("AWS_REGION") || "eu-north-1";
    const bucketName =
      this.configService.get<string>("AWS_S3_BUCKET_NAME") ||
      "tada-media-bucket-local";

    this.isDevMode = !accessKeyId || !secretAccessKey || accessKeyId.trim() === '' || secretAccessKey.trim() === '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    console.log(`📁 Uploads directory will be: ${this.uploadsDir}`);
    console.log(`🔧 Final isDevMode determination: ${this.isDevMode}`);

    if (this.isDevMode) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "⚠️ Missing AWS credentials, S3Service will use local file storage (dev mode)"
        );
        this.s3Client = null as any;
        this.bucketName = bucketName;
        this.keyPrefix = "tada-media/";

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
          console.log(`📁 Created uploads directory: ${this.uploadsDir}`);
        }

        console.log("✅ S3Service initialized in DEV mode (local file storage)");
        return;
      } else {
        console.error("❌ Missing AWS credentials from ConfigService");
        throw new Error("AWS credentials not configured in ConfigService");
      }
    }

    // Принудительно создаем S3Client с кредами из ConfigService
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Принудительно отключаем поиск credentials в других местах
      forcePathStyle: false,
    });

    this.bucketName = bucketName;
    this.keyPrefix = "tada-media/";

    console.log(
      `🔧 S3Service initialized with ConfigService credentials: bucket=${this.bucketName}, region=${region}, prefix=${this.keyPrefix}`
    );
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
    console.log(`🔄 Starting upload for file: ${originalFilename}, key: ${key}, size: ${buffer.length} bytes, mimeType: ${mimeType}, isDevMode: ${this.isDevMode}`);

    try {
      // Check if in dev mode - use local file storage
      if (this.isDevMode) {
        console.log(`📁 Saving file locally for dev mode: ${originalFilename}`);

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
        console.log(`✅ File saved locally: ${filePath}`);
        console.log(`📊 File size written: ${fs.statSync(filePath).size} bytes`);

        // Return local URL for development
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        const localUrl = `${backendUrl}/uploads/${key}`;
        console.log(`🔗 Local URL generated: ${localUrl} (using BACKEND_URL: ${backendUrl})`);

        return {
          url: localUrl,
          key: `${this.keyPrefix}${key}`,
        };
      }

      // Add prefix to key
      const fullKey = `${this.keyPrefix}${key}`;
      console.log(`📤 Uploading to S3: ${fullKey}`);

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
      console.log(`✅ S3 upload successful for ${originalFilename} (${mimeType}, ${buffer.length} bytes)`);

      // Special logging for PDF files
      if (mimeType === 'application/pdf') {
        console.log(`📄 PDF file uploaded successfully: ${fullKey}`);
      }

      // Generate presigned URL for secure access
      const url = await this.getPresignedUrl(fullKey);
      console.log(`🔗 Presigned URL generated for ${originalFilename}: ${url}`);

      return {
        url,
        key: fullKey,
      };
    } catch (error) {
      console.error(`❌ Error uploading ${originalFilename}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });

      // For PDF files, use fallback URL instead of throwing error
      if (mimeType === 'application/pdf') {
        console.warn(`⚠️ PDF upload to S3 failed for ${originalFilename}, using fallback URL`);
        const fallbackUrl = `https://fallback-s3.example.com/${this.keyPrefix}${key}`;
        return {
          url: fallbackUrl,
          key: `${this.keyPrefix}${key}`,
        };
      }

      // Fallback: return mock URL if S3 fails (for images/videos)
      console.warn(`⚠️ S3 upload failed, using fallback URL for ${originalFilename}`);
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
      console.log(`🔗 Returning local URL for dev mode: ${key} (isDevMode: ${this.isDevMode})`);
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
      const localUrl = `${backendUrl}/uploads/${key}`;
      console.log(`🔗 Local URL: ${localUrl}`);
      return localUrl;
    }

    try {
      console.log(`🔗 Generating presigned URL for key: ${key}, bucket: ${this.bucketName}`);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      console.log(`🔗 Presigned URL generated successfully: ${signedUrl.substring(0, 100)}...`);
      return signedUrl;
    } catch (error) {
      console.error(`❌ Error generating presigned URL for ${key}:`, error);
      console.error(`❌ Presigned URL error details:`, {
        message: error.message,
        code: error.code,
        name: error.name
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
