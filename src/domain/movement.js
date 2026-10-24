export const MOVEMENT_TYPES = ["STOCK_IN", "SALE", "CANCEL_SALE", "DAMAGED", "ADJUSTMENT"];

// referenceId menunjuk ke tabel yang berbeda tergantung jenis aktivitasnya.
// Pemetaan ini membuat FE tahu harus membuka halaman mana saat id diklik.
const REFERENCE_TYPES = {
  STOCK_IN: "STOCK_IN",
  SALE: "SALE",
  CANCEL_SALE: "SALE",
  DAMAGED: "ADJUSTMENT",
  ADJUSTMENT: "ADJUSTMENT",
};

export function referenceTypeOf(activityType) {
  // Object.hasOwn wajib: object biasa mewarisi properti bawaan seperti
  // "toString" dan "constructor", jadi REFERENCE_TYPES["toString"] bukan undefined,
  // melainkan sebuah fungsi.
  return Object.hasOwn(REFERENCE_TYPES, activityType) ? REFERENCE_TYPES[activityType] : null;
}
