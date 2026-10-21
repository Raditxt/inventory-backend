export const ADJUSTMENT_TYPES = ["DAMAGED", "CORRECTION"];
export const ADJUSTMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export function parseAdjustmentInput(body) {
  const data = {};
  const errors = [];

  if (!Number.isInteger(body.productId) || body.productId <= 0) {
    errors.push("productId harus berupa bilangan bulat positif");
  } else {
    data.productId = body.productId;
  }

  if (!ADJUSTMENT_TYPES.includes(body.type)) {
    errors.push(`type harus salah satu dari: ${ADJUSTMENT_TYPES.join(", ")}`);
  } else {
    data.type = body.type;
  }

  if (!Number.isInteger(body.qtyChange) || body.qtyChange === 0) {
    errors.push("qtyChange harus berupa bilangan bulat dan tidak boleh 0");
  } else if (data.type === "DAMAGED" && body.qtyChange > 0) {
    errors.push("qtyChange untuk DAMAGED harus negatif (stok berkurang)");
  } else {
    data.qtyChange = body.qtyChange;
  }

  if (typeof body.reason !== "string" || body.reason.trim() === "") {
    errors.push("reason wajib diisi");
  } else if (body.reason.trim().length > 500) {
    errors.push("reason maksimal 500 karakter");
  } else {
    data.reason = body.reason.trim();
  }

  return { data, errors };
}