import { prisma } from "@/lib/prisma";
import { weightedAverageCost } from "@/domain/cost";

// Service mengembalikan { data } kalau berhasil, atau { failure } kalau
// ditolak karena aturan bisnis. Route yang menerjemahkannya ke HTTP.
const failure = (status, code, message) => ({ failure: { status, code, message } });

export async function createStockIn({ productId, qty, unitCost, userId }) {
  // Semua langkah di dalam callback ini berjalan sebagai SATU transaksi.
  // Kalau ada error di tengah, semua perubahan dibatalkan (rollback).
  return prisma.$transaction(async (tx) => {
    // Kunci baris product sampai transaksi selesai. Tanpa ini, dua barang
    // masuk bersamaan bisa sama-sama membaca stok lama, lalu salah satu
    // menimpa hasil yang lain. Perhatikan backtick: ini tagged template,
    // ${productId} dikirim sebagai parameter, bukan disambung ke teks SQL.
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) return failure(404, "NOT_FOUND", "Product tidak ditemukan");
    if (product.status !== "ACTIVE") {
      return failure(409, "PRODUCT_NOT_ACTIVE", "Product belum disetujui owner");
    }

    // product.avgCost berupa object Decimal, ubah ke number dulu.
    const newAvgCost = weightedAverageCost(
      product.stock,
      Number(product.avgCost),
      qty,
      unitCost
    );

    const stockIn = await tx.stockIn.create({
      data: { productId, qty, unitCost, createdById: userId },
    });

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: qty }, avgCost: newAvgCost },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        activityType: "STOCK_IN",
        quantityChange: qty,
        referenceId: stockIn.id,
        createdById: userId,
      },
    });

    return { data: { stockIn, product: updatedProduct } };
  });
}

export async function listStockIns({ productId, skip, take }) {
  const where = productId ? { productId } : {};

  const [items, total] = await Promise.all([
    prisma.stockIn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockIn.count({ where }),
  ]);

  return { items, total };
}