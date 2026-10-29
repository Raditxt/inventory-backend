import { prisma } from "@/lib/prisma";

const include = {
  product: { select: { id: true, sku: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

export async function listMovements({ where, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take,
      include,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return { items, total };
}