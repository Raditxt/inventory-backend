export const SALE_STATUSES = ["PENDING", "SUCCESS", "CANCELLED"];
export const MAX_SALE_ITEMS = 50;

export function parseSaleInput(body) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { data: { items: [] }, errors: ["items wajib berupa array dan tidak boleh kosong"] };
  }
  if (body.items.length > MAX_SALE_ITEMS) {
    return { data: { items: [] }, errors: [`items maksimal ${MAX_SALE_ITEMS}`] };
  }

  const items = [];
  const errors = [];
  const seen = new Set(); // untuk mendeteksi productId kembar

  body.items.forEach((item, index) => {
    const label = `items[${index}]`;
    if (item === null || typeof item !== "object") {
      errors.push(`${label} harus berupa object`);
      return; // di dalam forEach, return berarti "lanjut ke item berikutnya"
    }

    let valid = true;
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      errors.push(`${label}.productId harus berupa bilangan bulat positif`);
      valid = false;
    } else if (seen.has(item.productId)) {
      errors.push(`${label}.productId duplikat, gabungkan qty-nya`);
      valid = false;
    } else {
      seen.add(item.productId);
    }

    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      errors.push(`${label}.qty harus berupa bilangan bulat > 0`);
      valid = false;
    }

    if (valid) items.push({ productId: item.productId, qty: item.qty });
  });

  return { data: { items }, errors };
}

export function parseCancelInput(body) {
  if (typeof body.reason !== "string" || body.reason.trim() === "") {
    return { data: {}, errors: ["reason wajib diisi"] };
  }
  if (body.reason.trim().length > 500) {
    return { data: {}, errors: ["reason maksimal 500 karakter"] };
  }
  return { data: { reason: body.reason.trim() }, errors: [] };
}