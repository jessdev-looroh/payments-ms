import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_ENDPOINT_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  NATS_SERVERS: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET_NAME?: string;
  CRYPTO_MASTER_KEY: string;
  CRYPTO_ALGORITHM: string;
  PAYMENT_CONFIG_TABLE: string;
}

const envSchema = joi
  .object({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    NATS_SERVERS: joi.string().required(),
    AWS_REGION: joi.string().required(),
    AWS_ACCESS_KEY_ID: joi.string().required(),
    AWS_SECRET_ACCESS_KEY: joi.string().required(),
    AWS_S3_BUCKET_NAME: joi.string().optional(),
    CRYPTO_MASTER_KEY: joi.string().optional(),
    CRYPTO_ALGORITHM: joi.string().optional(),
    PAYMENT_CONFIG_TABLE: joi.string().optional(),
  })
  .unknown(true);

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = env;

export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  natsServers: envVars.NATS_SERVERS,
  awsRegion: envVars.AWS_REGION,
  awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
  awsS3BucketName: envVars.AWS_S3_BUCKET_NAME,
  cryptoAlgorithm: envVars.CRYPTO_ALGORITHM,
  cryptoMasterKey: envVars.CRYPTO_MASTER_KEY,
  paymentConfigTable: envVars.PAYMENT_CONFIG_TABLE,
};
