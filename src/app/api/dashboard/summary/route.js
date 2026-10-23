import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { parsePeriod } from "@/domain/period";
import { getSummary } from "@/services/dashboard.service";

// GET /api/dashboard/summary?from=2026-10-01&to=2026-10-31
export async function GET(request) {
  const { error } = requireAuth(request, ["OWNER"]);
  if (error) return error;

  const parsed = parsePeriod(new URL(request.url).searchParams);
  if (parsed.error) return fail(400, "VALIDATION_ERROR", parsed.error);

  return ok(await getSummary(parsed));
}