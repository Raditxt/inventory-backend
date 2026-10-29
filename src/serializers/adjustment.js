// Mengasumsikan query selalu memakai include (product, requestedBy, decidedBy).
export function serializeAdjustment(a) {
  return {
    id: a.id,
    productId: a.productId,
    type: a.type,
    qtyChange: a.qtyChange,
    reason: a.reason,
    status: a.status,
    lossValue: a.lossValue === null ? null : Number(a.lossValue),
    product: { id: a.product.id, sku: a.product.sku, name: a.product.name },
    requestedBy: { id: a.requestedBy.id, name: a.requestedBy.name },
    decidedBy: a.decidedBy ? { id: a.decidedBy.id, name: a.decidedBy.name } : null,
    createdAt: a.createdAt,
    decidedAt: a.decidedAt,
  };
}