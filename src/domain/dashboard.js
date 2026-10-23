import { addDays } from "./period.js";
import { calcGrossProfit } from "./sale.js";

// Persen margin: laba / omzet x 100, dua desimal.
// Omzet 0 dijaga secara eksplisit: 0/0 di JavaScript hasilnya NaN, dan
// JSON.stringify(NaN) diam-diam menjadi null, jadi FE menerima "tidak ada data"
// tanpa pesan error apa pun.
export function calcMarginPercent(omzet, grossProfit) {
  if (omzet === 0) return 0;
  return Math.round((grossProfit / omzet) * 10000) / 100;
}

export function calcProfitAfterLoss(grossProfit, lossValue) {
  return Math.round((grossProfit - lossValue) * 100) / 100;
}

// rows: [{ day: "YYYY-MM-DD", count, omzet, hpp }] dari database (hanya hari yang
// ada penjualannya). Hasilnya satu entri per hari dari `from` sampai `to`,
// hari kosong berisi nol, supaya grafik di FE tidak bolong.
export function fillDailySeries(rows, from, to) {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const series = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const row = byDay.get(day);
    const omzet = row?.omzet ?? 0;
    const hpp = row?.hpp ?? 0;
    series.push({
      date: day,
      count: row?.count ?? 0,
      omzet,
      hpp,
      grossProfit: calcGrossProfit(omzet, hpp),
    });
  }
  return series;
}