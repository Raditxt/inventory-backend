import assert from "node:assert";
import { weightedAverageCost } from "../../src/domain/cost.js";

describe("weightedAverageCost", () => {
  it("merata-ratakan harga beli yang berbeda", () => {
    assert.strictEqual(weightedAverageCost(10, 1000, 10, 2000), 1500);
  });

  it("stok kosong: HPP = harga barang masuk", () => {
    assert.strictEqual(weightedAverageCost(0, 0, 5, 3000), 3000);
  });

  it("tidak error kalau total qty 0", () => {
    assert.strictEqual(weightedAverageCost(0, 800, 0, 0), 800);
  });
});