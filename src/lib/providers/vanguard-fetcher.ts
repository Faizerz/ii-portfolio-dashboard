/**
 * Vanguard provider fetcher
 * TODO: Implement Vanguard API integration
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult } from '@/types';

export class VanguardFetcher extends BaseFetcher {
  name = 'vanguard';
  priority = 90;
  supportsFullHoldings = true;

  canHandle(metadata: FundMetadata): boolean {
    return metadata.name.toLowerCase().includes('vanguard');
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    // TODO: Research and implement Vanguard API
    // Placeholder implementation
    console.log(`Vanguard provider not yet implemented for ${metadata.symbol}`);
    return this.createEmptyResult(this.name);
  }
}
