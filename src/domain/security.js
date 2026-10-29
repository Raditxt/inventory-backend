export const MIN_JWT_SECRET_LENGTH = 32;

export function validateJwtSecret(secret) {
  if (typeof secret !== "string" || secret.trim() === "") {
    return "JWT_SECRET belum diisi di .env";
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    return `JWT_SECRET minimal ${MIN_JWT_SECRET_LENGTH} karakter (sekarang ${secret.length})`;
  }
  return null;
}