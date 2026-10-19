// Semua response sukses: { data: ... }
// Semua response gagal:  { error: { code, message } }
export const ok = (data, status = 200) => Response.json({ data }, { status });

export const fail = (status, code, message) =>
  Response.json({ error: { code, message } }, { status });

// Baca body JSON. Mengembalikan object, atau null kalau bukan object JSON yang valid.
export async function readJson(request) {
  try {
    const body = await request.json();
    // typeof null === "object" di JS, jadi null dan array harus dicek terpisah.
    const isPlainObject =
      body !== null && typeof body === "object" && !Array.isArray(body);
    return isPlainObject ? body : null;
  } catch {
    return null;
  }
}

// "12" -> 12, "abc" -> null, "0" -> null, "1.5" -> null
export function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Kode error Prisma untuk pelanggaran kolom unik (misal SKU kembar).
export const isUniqueViolation = (err) => err?.code === "P2002";