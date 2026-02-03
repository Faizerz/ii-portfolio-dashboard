import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './card';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function SummaryCard({ title, value, subtitle, trend, trendValue }: SummaryCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2 mt-2">
            {trendValue && (
              <>
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>{trendValue}</span>
              </>
            )}
            {subtitle && <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
