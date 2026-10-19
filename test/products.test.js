import assert from "node:assert";
import { parseProductInput } from "../lib/products.js";

const valid = {
  sku: " BRS-001 ",
  name: "Beras 5kg",
  category: "Sembako",
  unit: "karung",
  price: 65000,
  minStock: 10,
};

describe("parseProductInput", () => {
  it("menerima input valid dan merapikan spasi", () => {
    const { data, errors } = parseProductInput(valid);
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(data.sku, "BRS-001");
  });

  it("menolak price negatif dan NaN", () => {
    assert.strictEqual(parseProductInput({ ...valid, price: -1 }).errors.length, 1);
    assert.strictEqual(parseProductInput({ ...valid, price: NaN }).errors.length, 1);
  });

  it("mode create: 5 field wajib kosong menghasilkan 5 error", () => {
    assert.strictEqual(parseProductInput({}).errors.length, 5);
  });

  it("mode partial: boleh hanya sebagian field", () => {
    const { data, errors } = parseProductInput({ name: "Beras Premium" }, { partial: true });
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(data, { name: "Beras Premium" });
  });

  it("mengabaikan field di luar whitelist (status, stock, avgCost)", () => {
    const { data } = parseProductInput({ ...valid, status: "ACTIVE", stock: 999, avgCost: 1 });
    assert.strictEqual(data.status, undefined);
    assert.strictEqual(data.stock, undefined);
    assert.strictEqual(data.avgCost, undefined);
  });
});