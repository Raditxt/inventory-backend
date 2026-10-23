import assert from "node:assert";
import {
  calcMarginPercent,
  calcProfitAfterLoss,
  fillDailySeries,
} from "../../src/domain/dashboard.js";

describe("calcMarginPercent", () => {
  it("menghitung persen margin dengan dua desimal", () => {
    assert.strictEqual(calcMarginPercent(181000, 35000), 19.34);
    assert.strictEqual(calcMarginPercent(100000, -20000), -20);
  });

  it("omzet 0 menghasilkan 0, bukan NaN", () => {
    assert.strictEqual(calcMarginPercent(0, 0), 0);
  });
});

describe("calcProfitAfterLoss", () => {
  it("laba kotor dikurangi kerugian, boleh negatif", () => {
    assert.strictEqual(calcProfitAfterLoss(35000, 220000), -185000);
  });
});

describe("fillDailySeries", () => {
  it("hari tanpa penjualan diisi nol", () => {
    const rows = [{ day: "2026-10-02", count: 2, omzet: 300, hpp: 180 }];
    const s = fillDailySeries(rows, "2026-10-01", "2026-10-03");
    assert.strictEqual(s.length, 3);
    assert.deepStrictEqual(s[0], { date: "2026-10-01", count: 0, omzet: 0, hpp: 0, grossProfit: 0 });
    assert.deepStrictEqual(s[1], { date: "2026-10-02", count: 2, omzet: 300, hpp: 180, grossProfit: 120 });
  });

  it("melewati pergantian bulan", () => {
    const s = fillDailySeries([], "2026-10-30", "2026-11-02");
    assert.deepStrictEqual(
      s.map((d) => d.date),
      ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]
    );
  });
});