import jwt from "jsonwebtoken";
import { fail } from "@/lib/http";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET belum diisi di .env");
  return secret;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "8h" });
}

// Mengembalikan payload token kalau valid, atau null kalau tidak.
export function getAuth(request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

// Pemakaian di endpoint:
//   const { auth, error } = requireAuth(request, ["OWNER"]);
//   if (error) return error;
// Kalau allowedRoles tidak diisi, semua user yang sudah login boleh.
export function requireAuth(request, allowedRoles) {
  const auth = getAuth(request);
  if (!auth) {
    return { error: fail(401, "UNAUTHORIZED", "Token tidak ada atau tidak valid") };
  }
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return { error: fail(403, "FORBIDDEN", "Role kamu tidak punya izin untuk aksi ini") };
  }
  return { auth };
}