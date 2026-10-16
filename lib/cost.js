// HPP baru = (nilai stok lama + nilai barang masuk) / total qty
// Contoh: stok 10 @ 1000, masuk 10 @ 2000 -> (10000 + 20000) / 20 = 1500
export function weightedAverageCost(currentStock, currentAvgCost, inQty, inUnitCost) {
  const totalQty = currentStock + inQty;
  if (totalQty === 0) return currentAvgCost; // hindari bagi nol

  const totalValue = currentStock * currentAvgCost + inQty * inUnitCost;
  return Math.round((totalValue / totalQty) * 100) / 100;
}