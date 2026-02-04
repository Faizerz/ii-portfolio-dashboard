/**
 * Chart label utilities for consistent rendering
 */

/**
 * Props for pie chart label rendering
 */
interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  index?: number;
}

/**
 * Render a percentage label on a pie chart slice
 *
 * Only displays if slice is large enough (>5%) and all required values are present
 *
 * @param props - Label positioning and data props from Recharts
 * @returns JSX element or null
 */
export function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelProps) {
  // Check if all required values are present
  if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) {
    return null;
  }

  // Only show label if slice is large enough (>5%)
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

/**
 * Create a pie label renderer with custom minimum threshold
 *
 * @param minPercent - Minimum percentage to show label (default 0.05)
 * @returns Label renderer function
 */
export function createPieLabel(minPercent: number = 0.05) {
  return (props: PieLabelProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) {
      return null;
    }

    if (percent < minPercent) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };
}
