import { calcLineTotal, calcGrossProfit } from "@/domain/sale";

// Ringkasan untuk daftar. Mengasumsikan query memakai include createdBy, cancelledBy, _count.
export function serializeSaleSummary(s) {
  const total = Number(s.total);
  // totalHpp baru final saat dikonfirmasi. Selama PENDING nilainya belum bermakna.
  const totalHpp = s.status === "PENDING" ? null : Number(s.totalHpp);

  return {
    id: s.id,
    status: s.status,
    total,
    totalHpp,
    grossProfit: s.status === "SUCCESS" ? calcGrossProfit(total, totalHpp) : null,
    itemCount: s._count.items,
    createdBy: { id: s.createdBy.id, name: s.createdBy.name },
    createdAt: s.createdAt,
    confirmedAt: s.confirmedAt,
    cancelledBy: s.cancelledBy ? { id: s.cancelledBy.id, name: s.cancelledBy.name } : null,
    cancelledAt: s.cancelledAt,
    cancelReason: s.cancelReason,
  };
}

// Detail = ringkasan + daftar item.
export function serializeSale(s) {
  const pending = s.status === "PENDING";
  return {
    ...serializeSaleSummary(s),
    items: s.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      product: { sku: i.product.sku, name: i.product.name, unit: i.product.unit },
      qty: i.qty,
      price: Number(i.price),
      hppSnapshot: pending ? null : Number(i.hppSnapshot),
      subtotal: calcLineTotal(Number(i.price), i.qty),
    })),
  };
}