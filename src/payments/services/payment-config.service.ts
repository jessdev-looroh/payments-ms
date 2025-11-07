import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PaymentMethodConfig } from '../interfaces/payment-method-config.interface';
import { DynamoDBService } from 'src/aws/services/dynamodb.service';
import { RpcException } from '@nestjs/microservices';
import { CryptoService } from 'src/shared/encrypt/crypto.service';
import { envs } from 'src/config';

/**
 * Service for retrieving payment method configuration from DynamoDB
 * and caching it locally for better performance.
 */
@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);
  private readonly cache = new Map<string, PaymentMethodConfig>();
  private readonly cacheTTL = 1000 * 60 * 10; // 10 minutes
  private readonly tableName = envs.paymentConfigTable;

  constructor(
    private readonly dynamoService: DynamoDBService,
    private readonly cryptoService: CryptoService,
  ) {}

  private tryDecryptMaybe(value: unknown) {
    if (typeof value !== 'string') return value;
    try {
      return this.cryptoService.decrypt(value);
    } catch (err) {
      this.logger.debug(
        `No se desencriptó un valor (no es ciphertext válido?): ${String(value).slice(0, 40)}...`,
      );
      return value;
    }
  }

  private decryptDeep<T = any>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => this.decryptDeep(item)) as unknown as T;
    }
    if (typeof obj === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(obj as any)) {
        out[k] = this.decryptDeep(v);
      }
      return out;
    }
    return this.tryDecryptMaybe(obj) as unknown as T;
  }

  async getPaymentConfig(id: string): Promise<PaymentMethodConfig> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    this.logger.log(`Fetching payment config from DynamoDB: ${id}`);

    const paymentMethod = await this.dynamoService.getItem<PaymentMethodConfig>(
      this.tableName,
      { PK: id, SK: 'CONFIG' },
    );

    if (!paymentMethod)
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: `Payment configuration not found for ${id}`,
      });

    // Aseguramos que exista estructura esperada
    const configs = paymentMethod.configs ?? {};
    const credentials = paymentMethod.credentials ?? {};

    const decryptedConfigs = this.decryptDeep(configs);
    const decryptedCredentials = this.decryptDeep(credentials);

    const credentialsArray = Object.keys(decryptedCredentials).map((key) => ({
      key,
      value: decryptedCredentials[key],
    }));

    this.logger.debug(
      `Credentials keys for ${id}: ${credentialsArray.map((c) => c.key).join(', ')}`,
    );

    const resultConfig: PaymentMethodConfig = {
      ...paymentMethod,
      configs: decryptedConfigs,
      credentials: decryptedCredentials,
    };

    this.cache.set(id, resultConfig);
    setTimeout(() => this.cache.delete(id), this.cacheTTL);

    return resultConfig;
  }
}
