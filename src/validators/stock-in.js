// Hanya menerima angka sungguhan. "5" (string) ditolak karena FE
// seharusnya mengirim number, bukan teks.
export function parseStockInInput(body) {
  const data = {};
  const errors = [];

  if (!Number.isInteger(body.productId) || body.productId <= 0) {
    errors.push("productId harus berupa bilangan bulat positif");
  } else {
    data.productId = body.productId;
  }

  if (!Number.isInteger(body.qty) || body.qty <= 0) {
    errors.push("qty harus berupa bilangan bulat > 0");
  } else {
    data.qty = body.qty;
  }

  if (
    typeof body.unitCost !== "number" ||
    !Number.isFinite(body.unitCost) ||
    body.unitCost < 0
  ) {
    errors.push("unitCost harus berupa angka >= 0");
  } else {
    data.unitCost = body.unitCost;
  }

  return { data, errors };
}