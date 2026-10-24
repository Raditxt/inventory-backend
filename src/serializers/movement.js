import { referenceTypeOf } from "@/domain/movement";

// Mengasumsikan query memakai include product dan createdBy.
export function serializeMovement(m) {
  return {
    id: m.id,
    type: m.activityType,
    quantityChange: m.quantityChange, // positif = stok bertambah, negatif = berkurang
    product: { id: m.product.id, sku: m.product.sku, name: m.product.name },
    reference:
      m.referenceId === null ? null : { type: referenceTypeOf(m.activityType), id: m.referenceId },
    reason: m.reason,
    createdBy: { id: m.createdBy.id, name: m.createdBy.name },
    createdAt: m.createdAt,
  };
}