import { vipaymentProvider } from "./vipayment";

export const providerRegistry = {
  vipayment: vipaymentProvider,
} as const;

export type ProviderName = keyof typeof providerRegistry;

export function getProvider(name: ProviderName) {
  const provider = providerRegistry[name];

  if (!provider) {
    throw new Error(`Provider tidak tersedia: ${name}`);
  }

  return provider;
}
