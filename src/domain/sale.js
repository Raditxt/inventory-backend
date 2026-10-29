const round2 = (n) => Math.round(n * 100) / 100;

export const calcLineTotal = (price, qty) => round2(price * qty);

export function calcTotal(lines) {
  return round2(lines.reduce((sum, l) => sum + calcLineTotal(l.price, l.qty), 0));
}

export function calcTotalHpp(lines) {
  return round2(lines.reduce((sum, l) => sum + calcLineTotal(l.hpp, l.qty), 0));
}

export const calcGrossProfit = (total, totalHpp) => round2(total - totalHpp);