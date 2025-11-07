import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { envs } from 'src/config';

/**
 * DynamoDB Service
 *
 * This service handles all DynamoDB operations for the payment audit system.
 * It provides methods for storing and retrieving payment audit data.
 */
@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);
  private readonly dynamoClient: DynamoDBClient;

  constructor() {
    const options = {
      region: envs.awsRegion,
      credentials: {
        accessKeyId: envs.awsAccessKeyId,
        secretAccessKey: envs.awsSecretAccessKey,
      },
    };
    this.dynamoClient = new DynamoDBClient(options);
  }

  /**
   * Gets the DynamoDB client instance
   *
   * @returns DynamoDBClient - The DynamoDB client instance
   */
  getClient(): DynamoDBClient {
    return this.dynamoClient;
  }

  /**
   * Stores payment audit data in DynamoDB
   *
   * @param tableName - The name of the DynamoDB table
   * @param item - The item to store in DynamoDB
   * @returns Promise<boolean> - Returns true if successful, false otherwise
   */
  async storeItem(
    tableName: string,
    item: Record<string, any>,
  ): Promise<boolean> {
    try {
      const command = new PutItemCommand({
        TableName: tableName,
        Item: marshall(item),
      });

      await this.dynamoClient.send(command);
      this.logger.log(
        `Successfully stored item in DynamoDB table: ${tableName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to store item in DynamoDB: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async getItem<T = any>(
    tableName: string,
    key: Record<string, any>,
  ): Promise<T | null> {
    try {
      const command = new GetItemCommand({
        TableName: tableName,
        Key: marshall(key),
      });
      this.logger.debug({
        TableName: tableName,
        Key: marshall(key),
      });
      const { Item } = await this.dynamoClient.send(command);     
      
      if (!Item) return null;
      return unmarshall(Item) as T;
    } catch (error) {
      console.log({error});
      this.logger.error(`Failed to get item from DynamoDB: ${error.message}`);
      return null;
    }
  }
}
