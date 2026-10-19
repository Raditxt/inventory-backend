import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId } from "@/lib/http";
import { serializeProduct } from "@/lib/serialize";

export async function POST(request, { params }) {
  const { error } = requireAuth(request, ["OWNER"]);
  if (error) return error;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail(404, "NOT_FOUND", "Product tidak ditemukan");
  if (product.status !== "PENDING_APPROVAL") {
    return fail(409, "NOT_PENDING", "Product ini tidak sedang menunggu approval");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  return ok({ product: serializeProduct(updated) });
}