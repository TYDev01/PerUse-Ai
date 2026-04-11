/**
 * Revenue split calculator.
 * platformFee = max(20% of salePrice, PLATFORM_FEE_MINIMUM)
 * creatorEarning = salePrice - providerCost - platformFee (min 0)
 */
export function calculateRevenueSplit(
  salePrice: number,
  providerCost: number
): { platformFee: number; creatorEarning: number } {
  const feePercent =
    Number(process.env.PLATFORM_FEE_PERCENT ?? 20) / 100;
  const feeMinimum = Number(process.env.PLATFORM_FEE_MINIMUM ?? 0.1);

  const platformFee = Math.max(salePrice * feePercent, feeMinimum);
  const creatorEarning = Math.max(salePrice - providerCost - platformFee, 0);

  return {
    platformFee: Math.round(platformFee * 10000) / 10000,
    creatorEarning: Math.round(creatorEarning * 10000) / 10000,
  };
}
