import assert from "node:assert";
import { parseSaleInput, parseCancelInput } from "../../src/validators/sale.js";

const valid = { items: [{ productId: 1, qty: 2 }, { productId: 2, qty: 3 }] };

describe("parseSaleInput", () => {
  it("menerima input valid", () => {
    const { data, errors } = parseSaleInput(valid);
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(data.items, valid.items);
  });

  it("menolak items kosong, hilang, atau bukan array", () => {
    for (const body of [{}, { items: [] }, { items: "x" }]) {
      assert.strictEqual(parseSaleInput(body).errors.length, 1);
    }
  });

  it("menolak qty 0 dan desimal, dan productId berupa string", () => {
    for (const item of [
      { productId: 1, qty: 0 },
      { productId: 1, qty: 1.5 },
      { productId: "1", qty: 1 },
    ]) {
      assert.strictEqual(parseSaleInput({ items: [item] }).errors.length, 1);
    }
  });

  it("menolak productId kembar", () => {
    const body = { items: [{ productId: 1, qty: 1 }, { productId: 1, qty: 2 }] };
    assert.strictEqual(parseSaleInput(body).errors.length, 1);
  });

  it("menolak lebih dari 50 item", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ productId: i + 1, qty: 1 }));
    assert.strictEqual(parseSaleInput({ items }).errors.length, 1);
  });
});

describe("parseCancelInput", () => {
  it("menerima reason dan merapikan spasi", () => {
    const { data, errors } = parseCancelInput({ reason: "  Customer batal " });
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(data.reason, "Customer batal");
  });

  it("menolak reason kosong atau terlalu panjang", () => {
    assert.strictEqual(parseCancelInput({}).errors.length, 1);
    assert.strictEqual(parseCancelInput({ reason: "   " }).errors.length, 1);
    assert.strictEqual(parseCancelInput({ reason: "x".repeat(501) }).errors.length, 1);
  });
});