import Papa from 'papaparse';
import { convertSedolToIsin } from './sedol-to-isin';

/**
 * CSV-specific holding interface (from II CSV export)
 * This is a subset of the full Holding interface used elsewhere
 */
export interface CSVHolding {
  symbol: string;
  sedol: string;
  isin?: string;
  name: string;
  quantity: number;
  currentPrice: number;
  bookCost: number;
  marketValue: number;
}

export interface ParseResult {
  holdings: CSVHolding[];
  errors: string[];
}

// Parse currency values (remove £, commas, p for pence, etc.)
function parseCurrency(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === '-') {
    return null;
  }

  let cleaned = value.trim();

  // Check if it's in pence (ends with 'p')
  const isPence = cleaned.toLowerCase().endsWith('p');

  cleaned = cleaned
    .replace(/[£$€,\s]/g, '')
    .replace(/p$/i, '') // Remove trailing 'p' for pence
    .replace(/\(([^)]+)\)/, '-$1'); // Handle negative values in parentheses

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Convert pence to pounds
  return isPence ? num / 100 : num;
}

// Parse quantity (handle commas)
function parseQuantity(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === '-') {
    return null;
  }

  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseHoldingsCSV(csvContent: string): ParseResult {
  const errors: string[] = [];
  const holdings: CSVHolding[] = [];

  // Remove BOM characters
  const cleanedContent = csvContent.replace(/^\uFEFF+/, '');

  const parsed = Papa.parse(cleanedContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
  });

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((err) => {
      errors.push(`Row ${err.row}: ${err.message}`);
    });
  }

  parsed.data.forEach((row: unknown, index: number) => {
    const record = row as Record<string, string>;
    const rowNum = index + 2;

    // Skip totals row
    const symbol = record['symbol']?.trim();
    if (!symbol || symbol === '' || symbol.toLowerCase() === 'totals') {
      return;
    }

    const name = record['name']?.trim();
    if (!name) {
      errors.push(`Row ${rowNum}: Missing name`);
      return;
    }

    const quantity = parseQuantity(record['qty']);
    if (quantity === null || quantity <= 0) {
      errors.push(`Row ${rowNum}: Invalid quantity`);
      return;
    }

    const currentPrice = parseCurrency(record['price']);
    const bookCost = parseCurrency(record['book_cost']);
    const marketValue = parseCurrency(record['market_value_£']) || parseCurrency(record['market_value']);

    if (bookCost === null) {
      errors.push(`Row ${rowNum}: Missing book cost`);
      return;
    }

    // Extract ISIN if available, or generate from SEDOL
    const sedol = record['sedol'] || symbol;
    const isin = record['isin']?.trim() ||
                 (sedol ? convertSedolToIsin(sedol) : null) ||
                 undefined;

    holdings.push({
      symbol,
      sedol,
      isin,
      name,
      quantity,
      currentPrice: currentPrice || 0,
      bookCost,
      marketValue: marketValue || 0,
    });
  });

  return { holdings, errors };
}
