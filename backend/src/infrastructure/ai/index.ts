import { AIProvider } from './ai-provider.interface.js';
import { DifyProvider } from './dify.provider.js';

export * from './ai-provider.interface.js';
export * from './dify.provider.js';

let defaultAIProvider: AIProvider = new DifyProvider();

export function getAIProvider(): AIProvider {
  return defaultAIProvider;
}

export function setAIProvider(provider: AIProvider): void {
  defaultAIProvider = provider;
}
