import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, parseId } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import { parseStockInInput } from "@/validators/stock-in";
import { serializeStockIn } from "@/serializers/stock-in";
import { serializeProduct } from "@/serializers/product";
import { createStockIn, listStockIns } from "@/services/stock-in.service";

export async function POST(request) {
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseStockInInput(body);
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));

  const result = await createStockIn({ ...data, userId: auth.userId });
  if (result.failure) {
    const { status, code, message } = result.failure;
    return fail(status, code, message);
  }

  return ok(
    {
      stockIn: serializeStockIn(result.data.stockIn),
      product: serializeProduct(result.data.product),
    },
    201
  );
}

export async function GET(request) {
  const { error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const { page, limit, skip } = parsePagination(params);

  let productId;
  const rawProductId = params.get("productId");
  if (rawProductId !== null) {
    productId = parseId(rawProductId);
    if (!productId) return fail(400, "VALIDATION_ERROR", "productId tidak valid");
  }

  const { items, total } = await listStockIns({ productId, skip, take: limit });
  return ok({ items: items.map(serializeStockIn), page, limit, total });
}