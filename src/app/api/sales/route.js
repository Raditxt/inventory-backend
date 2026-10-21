import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, fromResult } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import { parseSaleInput, SALE_STATUSES } from "@/validators/sale";
import { serializeSale, serializeSaleSummary } from "@/serializers/sale";
import { createSale, listSales } from "@/services/sale.service";

// POST /api/sales  { items: [{ productId, qty }] }
export async function POST(request) {
  const { auth, error } = requireAuth(request, ["MANAGER"]);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseSaleInput(body);
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));

  const result = await createSale({ items: data.items, userId: auth.userId });
  return fromResult(result, (d) => ({ sale: serializeSale(d.sale) }), 201);
}

// GET /api/sales?status=SUCCESS&page=1&limit=20
export async function GET(request) {
  const { error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const { page, limit, skip } = parsePagination(params);

  const where = {};
  const status = params.get("status");
  if (status) {
    if (!SALE_STATUSES.includes(status)) {
      return fail(400, "VALIDATION_ERROR", "status tidak valid");
    }
    where.status = status;
  }

  const { items, total } = await listSales({ where, skip, take: limit });
  return ok({ items: items.map(serializeSaleSummary), page, limit, total });
}