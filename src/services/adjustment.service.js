import { prisma } from "@/lib/prisma";
import { calcLossValue } from "@/domain/adjustment";

const failure = (status, code, message) => ({ failure: { status, code, message } });

const include = {
  product: { select: { id: true, sku: true, name: true } },
  requestedBy: { select: { id: true, name: true } },
  decidedBy: { select: { id: true, name: true } },
};

// Kunci baris product, lalu baca kondisi terbarunya. Hanya di dalam transaksi.
async function lockAndLoadProduct(tx, productId) {
  await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
  return tx.product.findUnique({ where: { id: productId } });
}

// Cek aturan SEBELUM ada yang ditulis. Mengembalikan failure, atau null kalau aman.
function checkCanApply(product, qtyChange) {
  if (!product) return failure(404, "NOT_FOUND", "Product tidak ditemukan");
  if (product.status !== "ACTIVE") {
    return failure(409, "PRODUCT_NOT_ACTIVE", "Product belum disetujui owner");
  }
  if (product.stock + qtyChange < 0) {
    return failure(
      409,
      "INSUFFICIENT_STOCK",
      `Stok saat ini ${product.stock}, tidak cukup untuk pengurangan ${Math.abs(qtyChange)}`
    );
  }
  return null;
}

// Menulis perubahan stok dan log. Hanya dipanggil setelah checkCanApply lolos.
async function applyStockChange(tx, { adjustmentId, productId, type, qtyChange, reason, deciderId }) {
  await tx.product.update({
    where: { id: productId },
    data: { stock: { increment: qtyChange } },
  });
  await tx.stockMovement.create({
    data: {
      productId,
      activityType: type === "DAMAGED" ? "DAMAGED" : "ADJUSTMENT",
      quantityChange: qtyChange,
      referenceId: adjustmentId,
      reason,
      createdById: deciderId,
    },
  });
}

// Dipakai approve dan reject untuk mengetahui product mana yang harus dikunci.
async function findProductIdOf(adjustmentId) {
  const row = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    select: { productId: true },
  });
  return row?.productId ?? null;
}

export async function createAdjustment({ productId, type, qtyChange, reason, userId, role }) {
  // MANAGER: hanya mengajukan. Stok tidak disentuh, jadi tidak perlu transaksi.
  if (role === "MANAGER") {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return failure(404, "NOT_FOUND", "Product tidak ditemukan");
    if (product.status !== "ACTIVE") {
      return failure(409, "PRODUCT_NOT_ACTIVE", "Product belum disetujui owner");
    }
    const adjustment = await prisma.stockAdjustment.create({
      data: { productId, type, qtyChange, reason, requestedById: userId },
      include,
    });
    return { data: { adjustment } };
  }

  // OWNER: langsung diterapkan, semuanya dalam satu transaksi.
  return prisma.$transaction(async (tx) => {
    const product = await lockAndLoadProduct(tx, productId);
    const problem = checkCanApply(product, qtyChange);
    if (problem) return problem;

    const adjustment = await tx.stockAdjustment.create({
      data: {
        productId,
        type,
        qtyChange,
        reason,
        status: "APPROVED",
        lossValue: calcLossValue(type, qtyChange, Number(product.avgCost)),
        requestedById: userId,
        decidedById: userId,
        decidedAt: new Date(),
      },
      include,
    });
    await applyStockChange(tx, {
      adjustmentId: adjustment.id,
      productId,
      type,
      qtyChange,
      reason,
      deciderId: userId,
    });
    return { data: { adjustment } };
  });
}

export async function approveAdjustment({ id, userId }) {
  const productId = await findProductIdOf(id);
  if (!productId) return failure(404, "NOT_FOUND", "Adjustment tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    const product = await lockAndLoadProduct(tx, productId);

    // Baca adjustment SETELAH kunci didapat. Kalau ada request approve lain
    // yang baru selesai, statusnya sudah berubah dan kita berhenti di sini.
    const adjustment = await tx.stockAdjustment.findUnique({ where: { id } });
    if (adjustment.status !== "PENDING") {
      return failure(409, "NOT_PENDING", "Adjustment ini sudah diproses");
    }

    const problem = checkCanApply(product, adjustment.qtyChange);
    if (problem) return problem;

    await applyStockChange(tx, {
      adjustmentId: id,
      productId,
      type: adjustment.type,
      qtyChange: adjustment.qtyChange,
      reason: adjustment.reason,
      deciderId: userId,
    });
    const updated = await tx.stockAdjustment.update({
      where: { id },
      data: {
        status: "APPROVED",
        lossValue: calcLossValue(adjustment.type, adjustment.qtyChange, Number(product.avgCost)),
        decidedById: userId,
        decidedAt: new Date(),
      },
      include,
    });
    return { data: { adjustment: updated } };
  });
}

export async function rejectAdjustment({ id, userId }) {
  const productId = await findProductIdOf(id);
  if (!productId) return failure(404, "NOT_FOUND", "Adjustment tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    // Kunci product yang sama dengan approve, supaya approve dan reject
    // untuk adjustment yang sama tidak bisa berjalan bersamaan.
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;

    const adjustment = await tx.stockAdjustment.findUnique({ where: { id } });
    if (adjustment.status !== "PENDING") {
      return failure(409, "NOT_PENDING", "Adjustment ini sudah diproses");
    }

    const updated = await tx.stockAdjustment.update({
      where: { id },
      data: { status: "REJECTED", decidedById: userId, decidedAt: new Date() },
      include,
    });
    return { data: { adjustment: updated } };
  });
}

export async function listAdjustments({ where, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);
  return { items, total };
}                                                                                                                                                                                                                