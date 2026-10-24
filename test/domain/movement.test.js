import assert from "node:assert";
import { MOVEMENT_TYPES, referenceTypeOf } from "../../src/domain/movement.js";

describe("referenceTypeOf", () => {
  it("memetakan jenis aktivitas ke tabel asal referenceId", () => {
    assert.strictEqual(referenceTypeOf("STOCK_IN"), "STOCK_IN");
    assert.strictEqual(referenceTypeOf("SALE"), "SALE");
    assert.strictEqual(referenceTypeOf("CANCEL_SALE"), "SALE");
    assert.strictEqual(referenceTypeOf("DAMAGED"), "ADJUSTMENT");
    assert.strictEqual(referenceTypeOf("ADJUSTMENT"), "ADJUSTMENT");
  });

  it("semua jenis aktivitas yang dikenal punya pemetaan", () => {
    for (const type of MOVEMENT_TYPES) {
      assert.notStrictEqual(referenceTypeOf(type), null, type);
    }
  });

  it("jenis tidak dikenal menghasilkan null, termasuk nama bawaan object", () => {
    assert.strictEqual(referenceTypeOf("LAIN"), null);
    assert.strictEqual(referenceTypeOf("toString"), null);
  });
});