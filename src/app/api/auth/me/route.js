import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function GET(request) {
  const auth = getAuth(request);
  if (!auth) return fail(401, "UNAUTHORIZED", "Token tidak ada atau tidak valid");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return fail(401, "UNAUTHORIZED", "User tidak ditemukan");

  return ok({ user });
}