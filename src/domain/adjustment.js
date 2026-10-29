export function calcLossValue(type, qtyChange, avgCost) {
  if (type !== "DAMAGED") return null;
  return Math.round(Math.abs(qtyChange) * avgCost * 100) / 100;
}