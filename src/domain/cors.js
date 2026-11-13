// CORS_ORIGIN berisi satu origin atau beberapa origin dipisah koma, misalnya:
//   https://pos-invent.vercel.app,http://localhost:5173
// "*" berarti semua origin boleh (default untuk development).

export function parseAllowedOrigins(value) {
  return (value ?? "*")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

// Mengembalikan nilai untuk header Access-Control-Allow-Origin, atau null
// kalau origin tidak diizinkan (header tidak dikirim, browser memblokir).
export function resolveAllowOrigin(origin, allowed) {
  if (allowed.includes("*")) return "*";
  if (!origin) return null;
  return allowed.includes(origin) ? origin : null;
}
