import { requireAuth } from "@/lib/auth";
import { fail, parseId, fromResult } from "@/lib/http";
import { serializeSale } from "@/serializers/sale";
import { confirmSale } from "@/services/sale.service";

export async function POST(request, { params }) {
  const { auth, error } = requireAuth(request, ["MANAGER"]);
  if (error) return error;

  const id = parseId((await params).id);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const result = await confirmSale({ id, userId: auth.userId });
  return fromResult(result, (d) => ({ sale: serializeSale(d.sale) }));
}