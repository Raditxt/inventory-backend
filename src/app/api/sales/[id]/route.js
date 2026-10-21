import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId, fromResult } from "@/lib/http";
import { serializeSale } from "@/serializers/sale";
import { getSale, deletePendingSale } from "@/services/sale.service";

export async function GET(request, { params }) {
  const { error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const id = parseId((await params).id);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const result = await getSale(id);
  return fromResult(result, (d) => ({ sale: serializeSale(d.sale) }));
}

export async function DELETE(request, { params }) {
  const { error } = requireAuth(request, ["MANAGER"]);
  if (error) return error;

  const id = parseId((await params).id);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const result = await deletePendingSale(id);
  return fromResult(result, (d) => d);
}