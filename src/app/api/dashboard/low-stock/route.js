import { requireAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import { getLowStock } from "@/services/dashboard.service";

export async function GET(request) {
  const { error } = requireAuth(request, ["OWNER"]);
  if (error) return error;

  const { page, limit, skip } = parsePagination(new URL(request.url).searchParams);
  const { items, total } = await getLowStock({ skip, take: limit });
  return ok({ items, page, limit, total });
}