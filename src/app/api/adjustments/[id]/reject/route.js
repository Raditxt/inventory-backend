import { requireAuth } from "@/lib/auth";
import { fail, parseId, fromResult } from "@/lib/http";
import { serializeAdjustment } from "@/serializers/adjustment";
import { rejectAdjustment } from "@/services/adjustment.service";

export async function POST(request, { params }) {
  const { auth, error } = requireAuth(request, ["OWNER"]);
  if (error) return error;

  const id = parseId((await params).id);
  if (!id) return fail(400, "VALIDATION_ERROR", "id tidak valid");

  const result = await rejectAdjustment({ id, userId: auth.userId });
  return fromResult(result, (d) => ({ adjustment: serializeAdjustment(d.adjustment) }));
}