import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { envs } from 'src/config';

/**
 * S3 Service
 *
 * This service handles all S3 operations for the payment audit system.
 * It provides methods for storing and retrieving payment audit data as JSON files.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;

  constructor() {
    const options = {
      region: envs.awsRegion,
      credentials: {
        accessKeyId: envs.awsAccessKeyId,
        secretAccessKey: envs.awsSecretAccessKey,
      },
    };

    this.logger.log(`S3 Service initialized with region: ${envs.awsRegion}`);
    this.s3Client = new S3Client(options);
  }

  /**
   * Stores payment audit data in S3 as a JSON file
   *
   * @param bucketName - The name of the S3 bucket
   * @param key - The S3 object key (file path)
   * @param data - The data to store as JSON
   * @returns Promise<boolean> - Returns true if successful, false otherwise
   */
  async storeObject(
    bucketName: string,
    key: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully stored object in S3: ${bucketName}/${key}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to store object in S3: ${error.name} - ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Gets the S3 client instance
   *
   * @returns S3Client - The S3 client instance
   */
  getClient(): S3Client {
    return this.s3Client;
  }
}
