import assert from "node:assert";
import { parseStockInInput } from "../../src/validators/stock-in.js";

const valid = { productId: 1, qty: 10, unitCost: 50000 };

describe("parseStockInInput", () => {
  it("menerima input valid", () => {
    const { data, errors } = parseStockInInput(valid);
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(data, valid);
  });

  it("menolak qty 0, negatif, dan desimal", () => {
    for (const qty of [0, -1, 1.5]) {
      assert.strictEqual(parseStockInInput({ ...valid, qty }).errors.length, 1);
    }
  });

  it("menolak unitCost negatif, string, dan NaN", () => {
    for (const unitCost of [-1, "5000", NaN]) {
      assert.strictEqual(parseStockInInput({ ...valid, unitCost }).errors.length, 1);
    }
  });

  it("menolak productId kosong atau berupa string", () => {
    assert.strictEqual(parseStockInInput({ qty: 1, unitCost: 1 }).errors.length, 1);
    assert.strictEqual(parseStockInInput({ ...valid, productId: "1" }).errors.length, 1);
  });
});