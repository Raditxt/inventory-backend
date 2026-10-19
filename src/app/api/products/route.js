import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, readJson, isUniqueViolation } from "@/lib/http";
import { parseProductInput } from "@/validators/product";
import { serializeProduct } from "@/serializers/product";

const STATUSES = ["ACTIVE", "PENDING_APPROVAL"];

// GET /api/products?search=beras&category=Sembako&status=ACTIVE&page=1&limit=20
export async function GET(request) {
  const { error } = requireAuth(request);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim();
  const category = params.get("category");
  const status = params.get("status");

  // Number(null) = 0 dan Number("abc") = NaN. Keduanya falsy, jadi `||` memakai default.
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 100);

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

  // Dua query berjalan bersamaan, lalu keduanya ditunggu.
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return ok({ items: items.map(serializeProduct), page, limit, total });
}

// POST /api/products
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
        // Owner langsung aktif, manager menunggu approval.
        status: auth.role === "OWNER" ? "ACTIVE" : "PENDING_APPROVAL",
        createdById: auth.userId,
      },
    });
    return ok({ product: serializeProduct(product) }, 201);
  } catch (err) {
    // Jaga-jaga kalau dua request dengan SKU sama masuk bersamaan.
    if (isUniqueViolation(err)) {
      return fail(409, "SKU_TAKEN", "SKU sudah dipakai product lain");
    }
    throw err;
  }
}