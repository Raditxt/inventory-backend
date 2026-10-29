// Zona waktu laporan. Jakarta (WIB, UTC+7) tidak mengenal DST, jadi offset-nya tetap.
// Kalau mau diganti (misal Makassar/WITA), ubah ketiga konstanta ini DAN
// 'Asia/Jakarta' di query SQL pada dashboard.service.js.
export const TZ_NAME = "Asia/Jakarta";
const TZ_OFFSET = "+07:00";
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_RANGE_DAYS = 366;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function todayInTz(now = new Date()) {
  return new Date(now.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  // Mengurangkan dua Date menghasilkan angka milidetik.
  const diff = new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`);
  return Math.round(diff / DAY_MS) + 1;
}

export function parsePeriod(params, now = new Date()) {
  const to = params.get("to") ?? todayInTz(now);
  if (!isValidDateString(to)) return { error: "to harus berformat YYYY-MM-DD dan tanggalnya valid" };

  const from = params.get("from") ?? addDays(to, -29);
  if (!isValidDateString(from)) return { error: "from harus berformat YYYY-MM-DD dan tanggalnya valid" };

  if (from > to) return { error: "from tidak boleh setelah to" };
  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    return { error: `rentang maksimal ${MAX_RANGE_DAYS} hari` };
  }

  const start = new Date(`${from}T00:00:00${TZ_OFFSET}`);
  const end = new Date(new Date(`${to}T00:00:00${TZ_OFFSET}`).getTime() + DAY_MS);
  return { period: { from, to, timezone: TZ_NAME }, start, end };
}