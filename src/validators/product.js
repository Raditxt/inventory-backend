const TEXT_FIELDS = ["sku", "name", "category", "unit"];


export function parseProductInput(body, { partial = false } = {}) {
  const data = {};
  const errors = [];

  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (value === undefined) {
      if (!partial) errors.push(`${field} wajib diisi`);
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${field} harus berupa teks yang tidak kosong`);
      continue;
    }
    data[field] = value.trim();
  }

  if (body.price === undefined) {
    if (!partial) errors.push("price wajib diisi");
  } else if (
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) || 
    body.price < 0
  ) {
    errors.push("price harus berupa angka >= 0");
  } else {
    data.price = body.price;
  }

  if (body.minStock !== undefined) {
    if (!Number.isInteger(body.minStock) || body.minStock < 0) {
      errors.push("minStock harus berupa bilangan bulat >= 0");
    } else {
      data.minStock = body.minStock;
    }
  }

  return { data, errors };
}