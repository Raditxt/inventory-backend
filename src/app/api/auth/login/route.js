import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";
import { loginLimiters, getClientIp } from "@/lib/rate-limit";

const DUMMY_HASH = bcrypt.hashSync("password-palsu-untuk-perbandingan", 10);

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 200;

function tooMany(retryAfterSec) {
  const minutes = Math.ceil(retryAfterSec / 60);
  return fail(
    429,
    "TOO_MANY_ATTEMPTS",
    `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`,
    { "Retry-After": String(retryAfterSec) }
  );
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Body harus berupa object JSON");

  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string") {
    return fail(400, "VALIDATION_ERROR", "email dan password wajib berupa teks");
  }
  if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return fail(400, "VALIDATION_ERROR", "email atau password terlalu panjang");
  }

  const ip = getClientIp(request);
  const normalizedEmail = email.trim().toLowerCase();
  const accountKey = `${ip}|${normalizedEmail}`;

  const checks = [
    [loginLimiters.byAccount, accountKey],
    [loginLimiters.byIp, ip],
  ];
  for (const [limiter, key] of checks) {
    const status = limiter.check(key);
    if (status.blocked) return tooMany(status.retryAfterSec);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk) {
    loginLimiters.byAccount.fail(accountKey);
    loginLimiters.byIp.fail(ip);
    return fail(401, "INVALID_CREDENTIALS", "Email atau password salah");
  }

  loginLimiters.byAccount.reset(accountKey);
  const token = signToken({ userId: user.id, role: user.role });

  return ok({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}