/**
 * Chart-related types
 */

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: any;
  dataKey?: string;
  color?: string;
}
