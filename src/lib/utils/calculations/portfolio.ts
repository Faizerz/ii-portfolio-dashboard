/**
 * Portfolio calculation utilities
 */

/**
 * Calculate gain/loss metrics for an investment
 *
 * @param marketValue - Current market value
 * @param bookCost - Original investment cost
 * @returns Object with gainLoss amount and gainLossPercent
 */
export function calculateGainLoss(marketValue: number, bookCost: number) {
  const gainLoss = marketValue - bookCost;
  const gainLossPercent = bookCost > 0 ? (gainLoss / bookCost) * 100 : 0;

  return {
    gainLoss,
    gainLossPercent,
  };
}

/**
 * Input type for portfolio summary calculation
 */
interface HoldingInput {
  marketValue: number;
  bookCost: number;
}

/**
 * Calculate portfolio summary statistics from holdings
 *
 * @param holdings - Array of holdings with marketValue and bookCost
 * @returns Portfolio summary with totals and gain/loss metrics
 */
export function calculatePortfolioSummary(holdings: HoldingInput[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.bookCost, 0);

  const { gainLoss, gainLossPercent } = calculateGainLoss(totalValue, totalInvested);

  return {
    totalValue,
    totalInvested,
    gainLoss,
    gainLossPercent,
  };
}
