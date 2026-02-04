# Utility Library

This directory contains reusable utility functions and components to eliminate code duplication across the application.

## Structure

```
src/lib/utils/
├── index.ts                      # Barrel export
├── formatters.ts                 # Formatting utilities
├── charts/
│   ├── colors.ts                # Chart color palette
│   ├── tooltips.tsx             # Reusable chart tooltips
│   ├── labels.tsx               # Chart label renderers
│   ├── legends.tsx              # Chart legend components
│   └── empty-states.tsx         # Chart empty state components
├── tables/
│   └── sorting.tsx              # Table sorting utilities
└── calculations/
    ├── portfolio.ts             # Portfolio calculations
    ├── dates.ts                 # Date filtering and transformations
    └── holdings.ts              # Holdings transformations
```

## Usage

**Import from the barrel export:**

```typescript
import { formatCurrency, formatPercent, CHART_COLORS } from '@/lib/utils';
```

---

## Formatters (`formatters.ts`)

### formatCurrency(value, options?)
Format a number as GBP currency.

```typescript
formatCurrency(1234.56)
// "£1,235"

formatCurrency(1234.56, { minimumFractionDigits: 2 })
// "£1,234.56"
```

### formatPercent(value, options?)
Format a number as a percentage with optional sign.

```typescript
formatPercent(5.42)
// "+5.42%"

formatPercent(-2.15)
// "-2.15%"

formatPercent(5.42, { showSign: false, decimals: 1 })
// "5.4%"
```

### formatDate(dateStr, format?)
Format a date string for display.

```typescript
formatDate('2024-01-15')
// "Jan 24"

formatDate('2024-01-15', 'dd/MM/yyyy')
// "15/01/2024"
```

### truncateName(text, maxLength?)
Truncate text with ellipsis.

```typescript
truncateName('Very Long Company Name Ltd', 20)
// "Very Long Company..."
```

### formatNumber(value, options?)
Format a number with locale-specific separators.

```typescript
formatNumber(1234.56)
// "1,234.56"

formatNumber(1234.56, { decimals: 0 })
// "1,235"
```

---

## Chart Utilities

### Colors (`charts/colors.ts`)

#### CHART_COLORS
Standard color palette for consistent chart styling.

```typescript
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  // ... 7 more colors
]
```

#### getChartColor(index)
Get a color from the palette (wraps around).

```typescript
getChartColor(0)  // "#3b82f6"
getChartColor(15) // Wraps to "#f59e0b"
```

#### getTrendColor(value)
Get color based on positive/negative value.

```typescript
getTrendColor(5.42)  // "#10b981" (green)
getTrendColor(-2.15) // "#ef4444" (red)
```

### Tooltips (`charts/tooltips.tsx`)

Reusable tooltip components for Recharts:

- **FinancialTooltip** - For time-series financial data
- **AllocationTooltip** - For portfolio allocation pie charts
- **HoldingsWeightTooltip** - For fund holdings weight charts

```typescript
<Tooltip content={<FinancialTooltip />} />
<Tooltip content={<AllocationTooltip />} />
```

### Labels (`charts/labels.tsx`)

#### renderPieLabel(props)
Render percentage labels on pie chart slices (>5% only).

```typescript
<Pie label={renderPieLabel} ... />
```

#### createPieLabel(minPercent)
Create custom label renderer with different threshold.

```typescript
<Pie label={createPieLabel(0.03)} ... />
```

### Legends (`charts/legends.tsx`)

#### createAllocationLegend(data)
Create formatted allocation legend with values and percentages.

```typescript
const legendData = chartData.map(entry => ({
  name: entry.name,
  value: entry.value,
  percentage: entry.percentage,
}));

{createAllocationLegend(legendData)}
```

### Empty States (`charts/empty-states.tsx`)

#### ChartEmptyState
Generic empty state component.

```typescript
<ChartEmptyState message="No data available" height={256} />
```

#### EmptyStates
Predefined empty states:

```typescript
<EmptyStates.noData />
<EmptyStates.noPortfolioData />
<EmptyStates.noHoldingsData />
<EmptyStates.noPriceData />
<EmptyStates.noPerformanceData />
```

---

## Table Utilities (`tables/sorting.tsx`)

### getSortIcon(columnId, sorting)
Get appropriate sort icon for table column.

```typescript
const [sorting, setSorting] = useState<SortingState>([]);

<th>
  <div className="flex items-center">
    Column Name
    {getSortIcon(header.id, sorting)}
  </div>
</th>
```

### TABLE_HEADER_CLASSES
Standard classes for table headers.

---

## Calculation Utilities

### Portfolio (`calculations/portfolio.ts`)

#### calculateGainLoss(marketValue, bookCost)
Calculate gain/loss metrics.

```typescript
const { gainLoss, gainLossPercent } = calculateGainLoss(10500, 10000);
// { gainLoss: 500, gainLossPercent: 5 }
```

#### calculatePortfolioSummary(holdings)
Calculate portfolio summary from holdings.

```typescript
const summary = calculatePortfolioSummary([
  { marketValue: 10000, bookCost: 9000 },
  { marketValue: 5000, bookCost: 5500 },
]);
// {
//   totalValue: 15000,
//   totalInvested: 14500,
//   gainLoss: 500,
//   gainLossPercent: 3.45
// }
```

### Dates (`calculations/dates.ts`)

#### filterByDateRange(data, startDate, endDate?)
Filter array by date range.

```typescript
const filtered = filterByDateRange(data, '2024-01-01', '2024-12-31');
```

#### rebasePercentageData(data, excludeKeys?)
Rebase percentage data to start from zero.

This is useful for performance charts where you want to show relative performance from a specific starting point.

**Example**: If Fund A was +20% and is now +30%, and the date range starts at the +20% point, this will rebase it to show 0% initially and ~8.33% at the end.

```typescript
const data = [
  { date: '2024-01-01', fundA: 20, fundB: 15 },
  { date: '2024-02-01', fundA: 30, fundB: 18 },
];

const rebased = rebasePercentageData(data);
// [
//   { date: '2024-01-01', fundA: 0, fundB: 0 },
//   { date: '2024-02-01', fundA: 8.33, fundB: 2.61 },
// ]
```

### Holdings (`calculations/holdings.ts`)

#### sortHoldingsByWeight(holdings)
Sort holdings by weight percentage (descending).

```typescript
const sorted = sortHoldingsByWeight(holdings);
```

#### getTopHoldingsWithOthers(holdings, topN?)
Get top N holdings with remaining grouped as "Others".

```typescript
const topHoldings = getTopHoldingsWithOthers(holdings, 10);
// Returns top 10 + { name: 'Others', weightPercent: X }
```

---

## Design Principles

1. **DRY**: Don't Repeat Yourself - eliminate code duplication
2. **Pure Functions**: No side effects where possible
3. **Type Safety**: Full TypeScript support with JSDoc
4. **Consistent API**: Similar functions have similar signatures
5. **Documentation**: Each function has usage examples
6. **Options Objects**: Use options for optional parameters

## Adding New Utilities

When adding new utilities:

1. Choose the appropriate module (formatters, charts, tables, calculations)
2. Add JSDoc comments with examples
3. Export from the module
4. Add to barrel export in `index.ts`
5. Update this README with usage examples
6. Ensure type safety with TypeScript
