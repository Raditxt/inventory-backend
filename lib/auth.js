import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  // Lebih baik gagal keras di awal daripada menandatangani token dengan secret kosong.
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
    return null; // token salah, dimodifikasi, atau kedaluwarsa
  }
}