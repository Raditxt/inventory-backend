export function weightedAverageCost(currentStock, currentAvgCost, inQty, inUnitCost) {
  const totalQty = currentStock + inQty;
  if (totalQty === 0) return currentAvgCost; // hindari bagi nol

  const totalValue = currentStock * currentAvgCost + inQty * inUnitCost;
  return Math.round((totalValue / totalQty) * 100) / 100;
}