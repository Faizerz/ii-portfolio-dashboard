/**
 * Provider detection system
 *
 * Automatically detects which providers to try for a given fund
 * based on multiple signals (name, ISIN, symbol, etc.)
 */

import type { FundMetadata, ProviderInfo, DetectionResult } from '@/types';

/**
 * Detect fund providers based on metadata
 * Returns ordered list of providers to try, sorted by confidence
 */
export function detectProviders(metadata: FundMetadata): DetectionResult {
  const providers: ProviderInfo[] = [];
  const signals: DetectionResult['signals'] = {};

  // Signal 1: Fund name patterns
  const nameProviders = detectFromName(metadata.name);
  if (nameProviders.length > 0) {
    signals.namePattern = nameProviders[0].provider;
    providers.push(...nameProviders);
  }

  // Signal 2: ISIN prefix
  if (metadata.isin) {
    const isinProviders = detectFromISIN(metadata.isin);
    if (isinProviders.length > 0) {
      signals.isinPrefix = metadata.isin.substring(0, 2);
      providers.push(...isinProviders);
    }
  }

  // Signal 3: Symbol patterns
  const symbolProviders = detectFromSymbol(metadata.symbol);
  if (symbolProviders.length > 0) {
    signals.symbolPattern = 'detected';
    providers.push(...symbolProviders);
  }

  // Signal 4: Fund type detection
  const fundType = detectFundType(metadata);
  signals.fundType = fundType;

  // Add universal fallback providers
  providers.push(
    { provider: 'yahoo', region: 'global', fundType: 'any', confidence: 60 },
    { provider: 'morningstar', region: 'global', fundType: 'any', confidence: 40 }
  );

  // Deduplicate and sort by confidence
  const uniqueProviders = deduplicateProviders(providers);
  uniqueProviders.sort((a, b) => b.confidence - a.confidence);

  return {
    providers: uniqueProviders,
    signals,
  };
}

/**
 * Detect provider from fund name
 */
function detectFromName(name: string): ProviderInfo[] {
  const nameLower = name.toLowerCase();
  const providers: ProviderInfo[] = [];

  if (nameLower.includes('ishares')) {
    providers.push({
      provider: 'ishares',
      region: detectRegionFromName(name),
      fundType: 'etf',
      confidence: 95,
    });
  }

  if (nameLower.includes('vanguard')) {
    providers.push({
      provider: 'vanguard',
      region: detectRegionFromName(name),
      fundType: nameLower.includes('etf') ? 'etf' : 'mutual',
      confidence: 95,
    });
  }

  if (nameLower.includes('spdr')) {
    providers.push({
      provider: 'state-street',
      region: detectRegionFromName(name),
      fundType: 'etf',
      confidence: 95,
    });
  }

  if (nameLower.includes('invesco')) {
    providers.push({
      provider: 'invesco',
      region: detectRegionFromName(name),
      fundType: 'etf',
      confidence: 90,
    });
  }

  if (nameLower.includes('fidelity')) {
    providers.push({
      provider: 'fidelity',
      region: detectRegionFromName(name),
      fundType: 'mutual',
      confidence: 90,
    });
  }

  if (nameLower.includes('blackrock') && !nameLower.includes('ishares')) {
    // BlackRock funds that aren't iShares
    providers.push({
      provider: 'ft-scraper',
      region: 'uk',
      fundType: 'oeic',
      confidence: 85,
    });
  }

  // Investment trusts
  if (nameLower.includes('trust') && !nameLower.includes('unit trust')) {
    providers.push({
      provider: 'ft-scraper',
      region: 'uk',
      fundType: 'trust',
      confidence: 80,
    });
  }

  return providers;
}

/**
 * Detect providers from ISIN prefix
 */
function detectFromISIN(isin: string): ProviderInfo[] {
  const prefix = isin.substring(0, 2);
  const providers: ProviderInfo[] = [];

  switch (prefix) {
    case 'GB':
      // UK domiciled - likely OEIC or Investment Trust
      providers.push({
        provider: 'ft-scraper',
        region: 'uk',
        fundType: 'oeic',
        confidence: 70,
      });
      break;

    case 'IE':
      // Ireland - common for ETFs (especially iShares, Vanguard)
      providers.push({
        provider: 'ishares',
        region: 'ie',
        fundType: 'etf',
        confidence: 75,
      });
      providers.push({
        provider: 'vanguard',
        region: 'ie',
        fundType: 'etf',
        confidence: 70,
      });
      break;

    case 'US':
      // US domiciled
      providers.push({
        provider: 'ishares',
        region: 'us',
        fundType: 'etf',
        confidence: 70,
      });
      providers.push({
        provider: 'vanguard',
        region: 'us',
        fundType: 'etf',
        confidence: 70,
      });
      break;

    case 'LU':
      // Luxembourg - common for UCITS funds
      providers.push({
        provider: 'ishares',
        region: 'lu',
        fundType: 'etf',
        confidence: 70,
      });
      break;
  }

  return providers;
}

/**
 * Detect providers from symbol pattern
 */
function detectFromSymbol(symbol: string): ProviderInfo[] {
  const providers: ProviderInfo[] = [];

  // 2-4 character symbols are likely UK investment trusts
  if (/^[A-Z]{2,4}$/.test(symbol)) {
    providers.push({
      provider: 'ft-scraper',
      region: 'uk',
      fundType: 'trust',
      confidence: 65,
    });
  }

  // Symbols ending in .L are London-listed
  if (symbol.endsWith('.L')) {
    providers.push({
      provider: 'yahoo',
      region: 'uk',
      fundType: 'any',
      confidence: 70,
    });
  }

  // 4+ character uppercase symbols without dots are likely ETF tickers
  if (/^[A-Z]{4,}$/.test(symbol)) {
    providers.push({
      provider: 'yahoo',
      region: 'us',
      fundType: 'etf',
      confidence: 75,
    });
  }

  return providers;
}

/**
 * Detect fund type from metadata
 */
function detectFundType(metadata: FundMetadata): string {
  const nameLower = metadata.name.toLowerCase();

  if (nameLower.includes('etf')) return 'etf';
  if (nameLower.includes('trust') && !nameLower.includes('unit trust')) return 'trust';
  if (metadata.isin?.startsWith('GB') && metadata.sedol) return 'oeic';

  return 'unknown';
}

/**
 * Detect region from fund name
 */
function detectRegionFromName(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('msci world') || nameLower.includes('global')) return 'global';
  if (nameLower.includes('uk') || nameLower.includes('britain')) return 'uk';
  if (nameLower.includes('europe')) return 'eu';
  if (nameLower.includes('asia') || nameLower.includes('japan') || nameLower.includes('pacific')) return 'asia';
  if (nameLower.includes('us') || nameLower.includes('america')) return 'us';
  if (nameLower.includes('emerging')) return 'em';

  return 'unknown';
}

/**
 * Deduplicate providers, keeping highest confidence for each
 */
function deduplicateProviders(providers: ProviderInfo[]): ProviderInfo[] {
  const map = new Map<string, ProviderInfo>();

  for (const provider of providers) {
    const existing = map.get(provider.provider);
    if (!existing || provider.confidence > existing.confidence) {
      map.set(provider.provider, provider);
    }
  }

  return Array.from(map.values());
}

/**
 * Get a friendly display name for a provider
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    'ishares': 'iShares',
    'vanguard': 'Vanguard',
    'invesco': 'Invesco',
    'state-street': 'State Street',
    'yahoo': 'Yahoo Finance',
    'ft-scraper': 'FT.com',
    'morningstar': 'Morningstar',
  };

  return names[provider] || provider;
}
