import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    // Validate every required var at startup so misconfiguration fails loud,
    // not later at upload time. R2_ACCOUNT_ID is part of the contract even
    // though the SDK only needs the explicit endpoint.
    void config.getOrThrow<string>('R2_ACCOUNT_ID');
    const endpoint = config.getOrThrow<string>('R2_ENDPOINT');
    const accessKeyId = config.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.getOrThrow<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: false,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
  }

  async getPresignedUrl(key: string, expiresIn = 900): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
