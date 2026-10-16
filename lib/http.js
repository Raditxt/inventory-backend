// Semua response sukses: { data: ... }
// Semua response gagal:  { error: { code, message } }
export const ok = (data, status = 200) => Response.json({ data }, { status });

export const fail = (status, code, message) =>
  Response.json({ error: { code, message } }, { status });