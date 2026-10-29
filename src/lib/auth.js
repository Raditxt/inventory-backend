import jwt from "jsonwebtoken";
import { fail } from "@/lib/http";
import { validateJwtSecret } from "@/domain/security";

function getSecret() {
  const problem = validateJwtSecret(process.env.JWT_SECRET);
  if (problem) throw new Error(problem);
  return process.env.JWT_SECRET;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { algorithm: "HS256", expiresIn: "8h" });
}


export function getAuth(request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  const secret = getSecret();
  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

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