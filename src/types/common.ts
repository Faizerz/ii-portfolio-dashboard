/**
 * Common types used across the application
 */

export type DataQuality = 'complete' | 'partial' | 'unavailable';

export type FetchStatus = 'pending' | 'trying' | 'success' | 'failed';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface PricePoint {
  date: string;
  price: number;
}
