/**
 * Invesco provider fetcher
 * TODO: Implement Invesco API integration
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult } from '@/types';

export class InvescoFetcher extends BaseFetcher {
  name = 'invesco';
  priority = 85;
  supportsFullHoldings = true;

  canHandle(metadata: FundMetadata): boolean {
    return metadata.name.toLowerCase().includes('invesco');
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    // TODO: Research and implement Invesco API
    // Based on danielsteman/etf-constituents patterns
    console.log(`Invesco provider not yet implemented for ${metadata.symbol}`);
    return this.createEmptyResult(this.name);
  }
}
