import assert from "node:assert";
import { parseAdjustmentInput } from "../../src/validators/adjustment.js";

const valid = { productId: 1, type: "DAMAGED", qtyChange: -3, reason: "  Karung sobek " };

describe("parseAdjustmentInput", () => {
  it("menerima input valid dan merapikan reason", () => {
    const { data, errors } = parseAdjustmentInput(valid);
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(data.reason, "Karung sobek");
  });

  it("DAMAGED harus negatif, tapi CORRECTION boleh positif", () => {
    assert.strictEqual(parseAdjustmentInput({ ...valid, qtyChange: 3 }).errors.length, 1);
    const okInput = parseAdjustmentInput({ ...valid, type: "CORRECTION", qtyChange: 3 });
    assert.deepStrictEqual(okInput.errors, []);
  });

  it("menolak qtyChange 0 dan desimal", () => {
    for (const qtyChange of [0, 1.5]) {
      assert.strictEqual(parseAdjustmentInput({ ...valid, qtyChange }).errors.length, 1);
    }
  });

  it("menolak type tidak dikenal dan reason kosong", () => {
    assert.strictEqual(parseAdjustmentInput({ ...valid, type: "LAIN" }).errors.length, 1);
    assert.strictEqual(parseAdjustmentInput({ ...valid, reason: "   " }).errors.length, 1);
  });
});