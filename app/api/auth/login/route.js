import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_JSON", "Body harus berupa JSON yang valid");
  }

  const { email, password } = body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return fail(400, "VALIDATION_ERROR", "email dan password wajib berupa teks");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Satu pesan yang sama untuk "email tidak ada" dan "password salah",
  // supaya orang tidak bisa menebak email mana yang terdaftar.
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    return fail(401, "INVALID_CREDENTIALS", "Email atau password salah");
  }

  const token = signToken({ userId: user.id, role: user.role });

  // Susun object baru berisi field yang aman saja. passwordHash tidak ikut.
  return ok({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}