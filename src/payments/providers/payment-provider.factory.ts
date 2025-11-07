import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StripeProvider } from './stripe.provider';
import { CulqiProvider } from './culqi.provider';
import { PaymentProvider } from './payment-provider.interface';
import { PaymentMethodConfig } from '../interfaces/payment-method-config.interface';

/**
 * Factory responsible for creating payment providers dynamically
 * based on the provider type defined in configuration.
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);

  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly culqiProvider: CulqiProvider,
  ) {}

  /**
   * Returns the appropriate payment provider instance.
   * @param config Payment method configuration
   */
  getProvider(config: PaymentMethodConfig): PaymentProvider {
    this.logger.log(`Resolving payment provider: ${config.paymentMethodId}`);

    switch (config.paymentMethodId) {
      case '1':
        this.stripeProvider.initialize(config);
        return this.stripeProvider;

      case '2':
        this.culqiProvider.initialize(config);
        return this.culqiProvider;

      default:
        throw new NotFoundException(
          `Unsupported payment provider: ${config.paymentMethodId}`,
        );
    }
  }
}
