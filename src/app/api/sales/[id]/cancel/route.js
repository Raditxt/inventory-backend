import { requireAuth } from "@/lib/auth";
import { fail, readJson, parseId, fromResult } from "@/lib/http";
import { parseCancelInput } from "@/validators/sale";
import { serializeSale } from "@/serializers/sale";
import { cancelSale } from "@/services/sale.service";

export async function POST(request, { params }) {
  // Asumsi: owner dan manager boleh membatalkan. Ganti array ini kalau Baskara
  // mau membatasinya ke owner saja.
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const id = parseId((await params).id);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseCancelInput(body);
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));

  const result = await cancelSale({ id, userId: auth.userId, reason: data.reason });
  return fromResult(result, (d) => ({ sale: serializeSale(d.sale) }));
}