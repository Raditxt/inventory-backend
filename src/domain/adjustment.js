// Nilai kerugian hanya untuk barang rusak: jumlah rusak x HPP rata-rata saat disetujui.
// Koreksi stok (CORRECTION) tidak dianggap kerugian, jadi hasilnya null.
export function calcLossValue(type, qtyChange, avgCost) {
  if (type !== "DAMAGED") return null;
  return Math.round(Math.abs(qtyChange) * avgCost * 100) / 100;
}