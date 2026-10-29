// src/app/api/products/route.js
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, isUniqueViolation } from "@/lib/http";
import { parsePagination } from "@/lib/pagination";
import { parseProductInput } from "@/validators/product";
import { serializeProduct } from "@/serializers/product";

const STATUSES = ["ACTIVE", "PENDING_APPROVAL"];

export async function GET(request) {
  const { error } = requireAuth(request);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim();
  const category = params.get("category");
  const status = params.get("status");

  const { page, limit, skip } = parsePagination(params);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (status) {
    if (!STATUSES.includes(status)) {
      return fail(400, "VALIDATION_ERROR", "status tidak valid");
    }
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return ok({ items: items.map(serializeProduct), page, limit, total });
}

export async function POST(request) {
  const { auth, error } = requireAuth(request, ["OWNER", "MANAGER"]);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { data, errors } = parseProductInput(body);
  if (errors.length > 0) return fail(400, "VALIDATION_ERROR", errors.join("; "));

  const taken = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (taken) return fail(409, "SKU_TAKEN", "SKU sudah dipakai product lain");

  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        status: auth.role === "OWNER" ? "ACTIVE" : "PENDING_APPROVAL",
        createdById: auth.userId,
      },
    });
    return ok({ product: serializeProduct(product) }, 201);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(409, "SKU_TAKEN", "SKU sudah dipakai product lain");
    }
    throw err;
  }
}