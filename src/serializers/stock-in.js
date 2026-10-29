export function serializeStockIn(s) {
  return {
    id: s.id,
    productId: s.productId,
    qty: s.qty,
    unitCost: Number(s.unitCost),
    createdAt: s.createdAt,

    product: s.product
      ? { id: s.product.id, sku: s.product.sku, name: s.product.name }
      : undefined,
    createdBy: s.createdBy
      ? { id: s.createdBy.id, name: s.createdBy.name }
      : undefined,
  };
}