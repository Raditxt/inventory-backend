import { requireAuth } from "@/lib/auth";
import { ok, fail, parseId } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import { parsePeriod } from "@/domain/period";
import { MOVEMENT_TYPES } from "@/domain/movement";
import { serializeMovement } from "@/serializers/movement";
import { listMovements } from "@/services/movement.service";

export async function GET(request) {
  const { error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const { page, limit, skip } = parsePagination(params);
  const where = {};

  const rawProductId = params.get("productId");
  if (rawProductId !== null) {
    const productId = parseId(rawProductId);
    if (!productId) return fail(400, "VALIDATION_ERROR", "productId tidak valid");
    where.productId = productId;
  }

  const type = params.get("type");
  if (type) {
    if (!MOVEMENT_TYPES.includes(type)) {
      return fail(400, "VALIDATION_ERROR", `type harus salah satu dari: ${MOVEMENT_TYPES.join(", ")}`);
    }
    where.activityType = type;
  }

  if (params.has("from") || params.has("to")) {
    const parsed = parsePeriod(params);
    if (parsed.error) return fail(400, "VALIDATION_ERROR", parsed.error);
    where.createdAt = { gte: parsed.start, lt: parsed.end };
  }

  const { items, total } = await listMovements({ where, skip, take: limit });
  return ok({ items: items.map(serializeMovement), page, limit, total });
}