export function serializeProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: Number(p.price),
    avgCost: Number(p.avgCost), 
    stock: p.stock,
    minStock: p.minStock,
    status: p.status,
    createdAt: p.createdAt,
  };
}