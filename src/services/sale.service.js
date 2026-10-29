import { prisma } from "@/lib/prisma";
import { calcTotal, calcTotalHpp } from "@/domain/sale";

const failure = (status, code, message) => ({ failure: { status, code, message } });

const summaryInclude = {
  createdBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
  _count: { select: { items: true } },
};

const detailInclude = {
  ...summaryInclude, 
  items: {
    orderBy: { id: "asc" },
    include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
  },
};


const TX_OPTIONS = { timeout: 15000 };

async function lockSale(tx, id) {
  await tx.$queryRaw`SELECT id FROM sales WHERE id = ${id} FOR UPDATE`;
  return tx.sale.findUnique({ where: { id }, include: { items: true } });
}


async function lockProducts(tx, productIds) {
  const sorted = [...new Set(productIds)].sort((a, b) => a - b);
  for (const id of sorted) {
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${id} FOR UPDATE`;
  }
  const products = await tx.product.findMany({ where: { id: { in: sorted } } });
  return new Map(products.map((p) => [p.id, p]));
}

export async function createSale({ items, userId }) {
  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return failure(404, "NOT_FOUND", `Product id ${item.productId} tidak ditemukan`);
    }
    if (product.status !== "ACTIVE") {
      return failure(409, "PRODUCT_NOT_ACTIVE", `${product.name} belum disetujui owner`);
    }
  }

  const lines = items.map((item) => {
    const product = byId.get(item.productId);
    return {
      productId: item.productId,
      qty: item.qty,
      price: Number(product.price),
      hpp: Number(product.avgCost), 
    };
  });

  const sale = await prisma.sale.create({
    data: {
      createdById: userId,
      total: calcTotal(lines),
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          price: l.price,
          hppSnapshot: l.hpp,
        })),
      },
    },
    include: detailInclude,
  });
  return { data: { sale } };
}

export async function confirmSale({ id, userId }) {
  return prisma.$transaction(async (tx) => {
    const sale = await lockSale(tx, id);
    if (!sale) return failure(404, "NOT_FOUND", "Penjualan tidak ditemukan");
    if (sale.status !== "PENDING") {
      return failure(409, "NOT_PENDING", "Hanya penjualan PENDING yang bisa dikonfirmasi");
    }

    const products = await lockProducts(tx, sale.items.map((i) => i.productId));


    for (const item of sale.items) {
      const product = products.get(item.productId);
      if (product.status !== "ACTIVE") {
        return failure(409, "PRODUCT_NOT_ACTIVE", `${product.name} belum disetujui owner`);
      }
      if (product.stock < item.qty) {
        return failure(
          409,
          "INSUFFICIENT_STOCK",
          `Stok ${product.name} tinggal ${product.stock}, diminta ${item.qty}`
        );
      }
    }

    const lines = [];
    for (const item of sale.items) {
      const product = products.get(item.productId);
      const hpp = Number(product.avgCost); 
      lines.push({ hpp, qty: item.qty });

      await tx.saleItem.update({ where: { id: item.id }, data: { hppSnapshot: hpp } });
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.qty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          activityType: "SALE",
          quantityChange: -item.qty,
          referenceId: sale.id,
          createdById: userId,
        },
      });
    }

    const confirmed = await tx.sale.update({
      where: { id },
      data: { status: "SUCCESS", totalHpp: calcTotalHpp(lines), confirmedAt: new Date() },
      include: detailInclude,
    });
    return { data: { sale: confirmed } };
  }, TX_OPTIONS);
}

export async function cancelSale({ id, userId, reason }) {
  return prisma.$transaction(async (tx) => {
    const sale = await lockSale(tx, id);
    if (!sale) return failure(404, "NOT_FOUND", "Penjualan tidak ditemukan");
    if (sale.status === "PENDING") {
      return failure(409, "NOT_CANCELLABLE", "Penjualan PENDING dihapus, bukan dibatalkan");
    }
    if (sale.status === "CANCELLED") {
      return failure(409, "ALREADY_CANCELLED", "Penjualan ini sudah dibatalkan");
    }


    await lockProducts(tx, sale.items.map((i) => i.productId));

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          activityType: "CANCEL_SALE",
          quantityChange: item.qty,
          referenceId: sale.id,
          reason,
          createdById: userId,
        },
      });
    }

    const cancelled = await tx.sale.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledById: userId,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: detailInclude,
    });
    return { data: { sale: cancelled } };
  }, TX_OPTIONS);
}

export async function deletePendingSale(id) {
  const { count } = await prisma.sale.deleteMany({ where: { id, status: "PENDING" } });
  if (count === 1) return { data: { id } };

  const exists = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  return exists
    ? failure(409, "NOT_PENDING", "Hanya penjualan PENDING yang bisa dihapus")
    : failure(404, "NOT_FOUND", "Penjualan tidak ditemukan");
}

export async function listSales({ where, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: summaryInclude,
    }),
    prisma.sale.count({ where }),
  ]);
  return { items, total };
}

export async function getSale(id) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: detailInclude });
  return sale
    ? { data: { sale } }
    : failure(404, "NOT_FOUND", "Penjualan tidak ditemukan");
}