import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, parseId, fromResult } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import {
  parseAdjustmentInput,
  ADJUSTMENT_TYPES,
  ADJUSTMENT_STATUSES,
} from "@/validators/adjustment";
import { serializeAdjustment } from "@/serializers/adjustment";
import { createAdjustment, listAdjustments } from "@/services/adjustment.service";

export async function POST(request) {
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseAdjustmentInput(body);
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));

  const result = await createAdjustment({ ...data, userId: auth.userId, role: auth.role });
  return fromResult(result, (d) => ({ adjustment: serializeAdjustment(d.adjustment) }), 201);
}

export async function GET(request) {
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const { page, limit, skip } = parsePagination(params);

  const where = {};

  if (auth.role === "MANAGER") where.requestedById = auth.userId;

  const status = params.get("status");
  if (status) {
    if (!ADJUSTMENT_STATUSES.includes(status)) {
      return fail(400, "VALIDATION_ERROR", "status tidak valid");
    }
    where.status = status;
  }

  const type = params.get("type");
  if (type) {
    if (!ADJUSTMENT_TYPES.includes(type)) {
      return fail(400, "VALIDATION_ERROR", "type tidak valid");
    }
    where.type = type;
  }

  const rawProductId = params.get("productId");
  if (rawProductId !== null) {
    const productId = parseId(rawProductId);
    if (!productId) return fail(400, "VALIDATION_ERROR", "productId tidak valid");
    where.productId = productId;
  }

  const { items, total } = await listAdjustments({ where, skip, take: limit });
  return ok({ items: items.map(serializeAdjustment), page, limit, total });
}