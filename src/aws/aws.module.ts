import { Module } from '@nestjs/common';
import { DynamoDBService } from './services/dynamodb.service';
import { S3Service } from './services/s3.service';

/**
 * AWS Module
 * 
 * This module provides AWS services for DynamoDB and S3 operations.
 * It encapsulates all AWS-related functionality for the payment audit system.
 * Each service is independently responsible for its specific AWS service.
 */
@Module({
  providers: [DynamoDBService, S3Service],
  exports: [DynamoDBService, S3Service],
})
export class AwsModule {}
