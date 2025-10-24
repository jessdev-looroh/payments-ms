import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';
import { Transport } from '@nestjs/microservices';
import { RpcExceptionInterceptor } from './common';

async function bootstrap() {
  const logger = new Logger('Payment-ms');
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new RpcExceptionInterceptor());
  await app.listen();
  logger.log(`Payments Microservice is running on Port: ${envs.port}`);
}
bootstrap();
