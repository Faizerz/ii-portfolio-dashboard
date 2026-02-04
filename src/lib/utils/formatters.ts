/**
 * Formatting utilities for consistent display across the application
 */

/**
 * Format a number as GBP currency
 *
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "£1,234")
 *
 * @example
 * formatCurrency(1234.56) // "£1,235"
 * formatCurrency(1234.56, { minimumFractionDigits: 2 }) // "£1,234.56"
 */
export function formatCurrency(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);
}

/**
 * Format a number as a percentage
 *
 * @param value - The numeric value to format (e.g., 5.42 for 5.42%)
 * @param options - Formatting options
 * @returns Formatted percentage string (e.g., "+5.42%")
 *
 * @example
 * formatPercent(5.42) // "+5.42%"
 * formatPercent(-2.15) // "-2.15%"
 * formatPercent(5.42, { showSign: false }) // "5.42%"
 * formatPercent(5.42, { decimals: 1 }) // "+5.4%"
 */
export function formatPercent(
  value: number,
  options?: {
    showSign?: boolean;
    decimals?: number;
  }
): string {
  const decimals = options?.decimals ?? 2;
  const sign = (options?.showSign !== false && value >= 0) ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a date string for display
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param formatStr - Desired format ('MMM yy', 'dd/MM/yyyy', etc.)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // "Jan 24"
 * formatDate('2024-01-15', 'dd/MM/yyyy') // "15/01/2024"
 */
export function formatDate(dateStr: string, formatStr: string = 'MMM yy'): string {
  const date = new Date(dateStr + 'T00:00:00'); // Force local timezone

  if (formatStr === 'MMM yy') {
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    });
  } else if (formatStr === 'dd/MM/yyyy') {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Default fallback
  return date.toLocaleDateString('en-GB');
}

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateName('Very Long Company Name Ltd', 20) // "Very Long Company..."
 */
export function truncateName(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a number with locale-specific separators
 *
 * @param value - The numeric value to format (or undefined)
 * @param options - Formatting options
 * @returns Formatted number string or 'N/A' if undefined
 *
 * @example
 * formatNumber(1234.56) // "1,234.56"
 * formatNumber(1234.56, { decimals: 0 }) // "1,235"
 * formatNumber(undefined) // "N/A"
 */
export function formatNumber(
  value: number | undefined,
  options?: {
    decimals?: number;
  }
): string {
  if (value === undefined) return 'N/A';

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(value);
}
