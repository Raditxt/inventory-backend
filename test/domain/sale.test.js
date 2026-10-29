import assert from "node:assert";
import { calcLineTotal, calcTotal, calcTotalHpp, calcGrossProfit } from "../../src/domain/sale.js";

describe("hitungan penjualan", () => {
  it("calcTotal menjumlahkan harga x qty semua baris", () => {
    const lines = [{ price: 65000, qty: 2 }, { price: 17000, qty: 3 }];
    assert.strictEqual(calcTotal(lines), 181000);
  });

  it("calcTotalHpp menjumlahkan HPP x qty, mendukung desimal", () => {
    const lines = [{ hpp: 55000, qty: 2 }, { hpp: 12000.5, qty: 3 }];
    assert.strictEqual(calcTotalHpp(lines), 146001.5);
  });

  it("dibulatkan, bebas dari galat desimal JavaScript", () => {
    assert.strictEqual(calcLineTotal(0.1, 3), 0.3);
  });

  it("calcGrossProfit = omzet - HPP", () => {
    assert.strictEqual(calcGrossProfit(181000, 146000), 35000);
  });
});