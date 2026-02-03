'use client';

import { useState, useEffect } from 'react';
import { subMonths, subYears, startOfYear, format } from 'date-fns';

export type DateRangePreset = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'YTD' | 'FY' | 'ALL' | 'CUSTOM';

interface DateRangeFilterProps {
  onRangeChange: (startDate: string | null, endDate: string | null) => void;
  initialPreset?: DateRangePreset;
}

// UK tax year starts April 6th
function getFinancialYearStart(): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  const aprilSixth = new Date(currentYear, 3, 6); // Month is 0-indexed

  // If we're before April 6th, the financial year started last year
  if (now < aprilSixth) {
    return new Date(currentYear - 1, 3, 6);
  }
  return aprilSixth;
}

function getDateRangeFromPreset(preset: DateRangePreset): { start: Date | null; end: Date } {
  const now = new Date();

  switch (preset) {
    case '1M':
      return { start: subMonths(now, 1), end: now };
    case '3M':
      return { start: subMonths(now, 3), end: now };
    case '6M':
      return { start: subMonths(now, 6), end: now };
    case '1Y':
      return { start: subYears(now, 1), end: now };
    case '3Y':
      return { start: subYears(now, 3), end: now };
    case '5Y':
      return { start: subYears(now, 5), end: now };
    case 'YTD':
      return { start: startOfYear(now), end: now };
    case 'FY':
      return { start: getFinancialYearStart(), end: now };
    case 'ALL':
      return { start: null, end: now };
    default:
      return { start: null, end: now };
  }
}

const presets: { label: string; value: DateRangePreset; description: string }[] = [
  { label: '1M', value: '1M', description: 'Last month' },
  { label: '3M', value: '3M', description: 'Last 3 months' },
  { label: '6M', value: '6M', description: 'Last 6 months' },
  { label: '1Y', value: '1Y', description: 'Last year' },
  { label: '3Y', value: '3Y', description: 'Last 3 years' },
  { label: '5Y', value: '5Y', description: 'Last 5 years' },
  { label: 'YTD', value: 'YTD', description: 'Year to date' },
  { label: 'FY', value: 'FY', description: 'Financial year (from April)' },
  { label: 'All', value: 'ALL', description: 'All time' },
];

export function DateRangeFilter({ onRangeChange, initialPreset = '1Y' }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(initialPreset);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showCustom, setShowCustom] = useState(false);

  // Apply initial filter on mount
  useEffect(() => {
    const { start, end } = getDateRangeFromPreset(initialPreset);
    onRangeChange(
      start ? format(start, 'yyyy-MM-dd') : null,
      format(end, 'yyyy-MM-dd')
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'CUSTOM') {
      setShowCustom(true);
      setSelectedPreset('CUSTOM');
      return;
    }
    setShowCustom(false);
    setSelectedPreset(preset);
    const { start, end } = getDateRangeFromPreset(preset);
    onRangeChange(
      start ? format(start, 'yyyy-MM-dd') : null,
      format(end, 'yyyy-MM-dd')
    );
  };

  const handleCustomApply = () => {
    if (customStart) {
      onRangeChange(customStart, customEnd || format(new Date(), 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => handlePresetClick(preset.value)}
          title={preset.description}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selectedPreset === preset.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <button
        onClick={() => handlePresetClick('CUSTOM')}
        title="Custom date range"
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          selectedPreset === 'CUSTOM'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export { getDateRangeFromPreset };
