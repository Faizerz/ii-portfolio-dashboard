/**
 * Provider registry
 * Central registry for all provider fetchers
 */

import type { ProviderFetcher } from '@/types';
import { YahooFetcher } from './yahoo-fetcher';
import { ISharesFetcher } from './ishares-fetcher';
import { FTScraperFetcher } from './ft-scraper';
import { MorningstarFetcher } from './morningstar-fetcher';
import { VanguardFetcher } from './vanguard-fetcher';
import { InvescoFetcher } from './invesco-fetcher';
import { StateStreetFetcher } from './state-street-fetcher';

// Provider registry
const providers = new Map<string, ProviderFetcher>();

// Register all providers
function registerProviders() {
  const fetcherInstances: ProviderFetcher[] = [
    new ISharesFetcher(),
    new VanguardFetcher(),
    new InvescoFetcher(),
    new StateStreetFetcher(),
    new FTScraperFetcher(),
    new YahooFetcher(),
    new MorningstarFetcher(),
  ];

  for (const fetcher of fetcherInstances) {
    providers.set(fetcher.name, fetcher);
  }
}

// Initialize registry
registerProviders();

/**
 * Get a provider fetcher by name
 */
export function getProviderFetcher(name: string): ProviderFetcher | undefined {
  return providers.get(name);
}

/**
 * Get all registered providers
 */
export function getAllProviders(): ProviderFetcher[] {
  return Array.from(providers.values());
}

/**
 * Get providers sorted by priority
 */
export function getProvidersByPriority(): ProviderFetcher[] {
  return Array.from(providers.values()).sort((a, b) => b.priority - a.priority);
}

/**
 * Check if a provider exists
 */
export function hasProvider(name: string): boolean {
  return providers.has(name);
}

/**
 * Register a new provider dynamically
 */
export function registerProvider(fetcher: ProviderFetcher): void {
  providers.set(fetcher.name, fetcher);
}
