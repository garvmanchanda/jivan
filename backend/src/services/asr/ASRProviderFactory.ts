import { ASRProvider } from './ASRProvider.interface';
import { OpenAIWhisperProvider } from './OpenAIWhisperProvider';
import { logger } from '../../utils/logger';
import { ASR_CONFIG } from '../../config/providers';

/**
 * Factory for creating ASR provider instances
 */
export class ASRProviderFactory {
  private static providers: Map<string, ASRProvider> = new Map();

  /**
   * Get ASR provider by name
   */
  static getProvider(providerName?: string): ASRProvider {
    const name = providerName || ASR_CONFIG.defaultProvider;

    // Check if provider is already instantiated
    if (this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    // Create new provider instance
    let provider: ASRProvider;

    switch (name) {
      case 'openai-whisper':
        provider = new OpenAIWhisperProvider();
        break;

      // Future providers can be added here:
      // case 'google-speech':
      //   provider = new GoogleSpeechProvider();
      //   break;
      // case 'azure-speech':
      //   provider = new AzureSpeechProvider();
      //   break;

      default:
        logger.warn(`Unknown ASR provider: ${name}, falling back to default`);
        provider = new OpenAIWhisperProvider();
    }

    // Cache the provider instance
    this.providers.set(name, provider);

    logger.info('ASR provider initialized', { provider: name });

    return provider;
  }

  /**
   * Get default provider
   */
  static getDefaultProvider(): ASRProvider {
    return this.getProvider();
  }

  /**
   * Check if provider is available
   */
  static isProviderAvailable(providerName: string): boolean {
    try {
      const provider = this.getProvider(providerName);
      return provider.isAvailable();
    } catch (error) {
      logger.error('Failed to check provider availability', {
        provider: providerName,
        error,
      });
      return false;
    }
  }

  /**
   * List available providers
   */
  static getAvailableProviders(): string[] {
    const providers = ['openai-whisper'];
    // Add more as implemented

    return providers.filter((name) => this.isProviderAvailable(name));
  }

  /**
   * Clear cached providers (useful for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

