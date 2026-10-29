import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, parseId, isUniqueViolation } from "@/lib/http";
import { parseProductInput } from "@/validators/product";
import { serializeProduct } from "@/serializers/product";

async function getId(params) {
  const { id: rawId } = await params;
  return parseId(rawId);
}

export async function GET(request, { params }) {
  const { error } = requireAuth(request);
  if (error) return error;

  const id = await getId(params);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail(404, "NOT_FOUND", "Product tidak ditemukan");

  return ok({ product: serializeProduct(product) });
}

export async function PATCH(request, { params }) {
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const id = await getId(params);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return fail(404, "NOT_FOUND", "Product tidak ditemukan");

  const isOwner = auth.role === "OWNER";
  const isOwnPending =
    existing.createdById === auth.userId && existing.status === "PENDING_APPROVAL";
  if (!isOwner && !isOwnPending) {
    return fail(
      403,
      "FORBIDDEN",
      "Manager hanya bisa mengubah product miliknya yang masih menunggu approval"
    );
  }

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseProductInput(body, { partial: true });
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));
  if (Object.keys(data).length === 0) {
    return fail(400, "VALIDATION_ERROR", "Tidak ada field yang diubah");
  }

  if (data.sku && data.sku !== existing.sku) {
    const taken = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (taken) return fail(409, "SKU_TAKEN", "SKU sudah dipakai product lain");
  }

  try {
    const product = await prisma.product.update({ where: { id }, data });
    return ok({ product: serializeProduct(product) });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(409, "SKU_TAKEN", "SKU sudah dipakai product lain");
    }
    throw err;
  }
}

export async function DELETE(request, { params }) {
  const { error } = requireAuth(request, ["OWNER"]);
  if (error) return error;

  const id = await getId(params);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: { stockIns: true, saleItems: true, adjustments: true, movements: true },
      },
    },
  });
  if (!product) return fail(404, "NOT_FOUND", "Product tidak ditemukan");

  const hasHistory = Object.values(product._count).some((n) => n > 0);
  if (hasHistory) {
    return fail(409, "HAS_HISTORY", "Product sudah punya riwayat transaksi dan tidak bisa dihapus");
  }

  await prisma.product.delete({ where: { id } });
  return ok({ id });
}