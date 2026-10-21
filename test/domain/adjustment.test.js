import assert from "node:assert";
import { calcLossValue } from "../../src/domain/adjustment.js";

describe("calcLossValue", () => {
  it("barang rusak: jumlah x HPP, tanda minus diabaikan", () => {
    assert.strictEqual(calcLossValue("DAMAGED", -3, 55000), 165000);
  });

  it("koreksi stok tidak dihitung sebagai kerugian", () => {
    assert.strictEqual(calcLossValue("CORRECTION", -2, 55000), null);
  });

  it("dibulatkan 2 desimal", () => {
    assert.strictEqual(calcLossValue("DAMAGED", -3, 33.333), 100);
  });
});