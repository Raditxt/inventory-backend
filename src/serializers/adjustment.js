// Mengasumsikan query selalu memakai include (product, requestedBy, decidedBy).
export function serializeAdjustment(a) {
  return {
    id: a.id,
    productId: a.productId,
    type: a.type,
    qtyChange: a.qtyChange,
    reason: a.reason,
    status: a.status,
    // Number(null) hasilnya 0, bukan null. Tanpa pengecekan ini, adjustment
    // yang belum punya nilai kerugian akan tampil sebagai "rugi Rp 0".
    lossValue: a.lossValue === null ? null : Number(a.lossValue),
    product: { id: a.product.id, sku: a.product.sku, name: a.product.name },
    requestedBy: { id: a.requestedBy.id, name: a.requestedBy.name },
    decidedBy: a.decidedBy ? { id: a.decidedBy.id, name: a.decidedBy.name } : null,
    createdAt: a.createdAt,
    decidedAt: a.decidedAt,
  };
}