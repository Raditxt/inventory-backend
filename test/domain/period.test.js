import assert from "node:assert";
import {
  isValidDateString,
  addDays,
  todayInTz,
  parsePeriod,
  TZ_NAME,
} from "../../src/domain/period.js";

const params = (qs) => new URLSearchParams(qs);
const NOW = new Date("2026-10-21T05:00:00Z"); 

describe("isValidDateString", () => {
  it("menerima tanggal nyata, termasuk 29 Februari tahun kabisat", () => {
    assert.strictEqual(isValidDateString("2026-10-21"), true);
    assert.strictEqual(isValidDateString("2024-02-29"), true);
  });

  it("menolak tanggal yang tidak ada dan format yang salah", () => {
    for (const s of ["2026-02-29", "2026-02-31", "2026-13-01", "21-10-2026", "2026-1-5", "", "abc", null, undefined]) {
      assert.strictEqual(isValidDateString(s), false, String(s));
    }
  });
});

describe("addDays", () => {
  it("melewati batas bulan dan tahun", () => {
    assert.strictEqual(addDays("2026-12-31", 1), "2027-01-01");
    assert.strictEqual(addDays("2026-03-01", -1), "2026-02-28");
    assert.strictEqual(addDays("2026-10-21", -29), "2026-09-22");
  });
});

describe("todayInTz", () => {
  it("memakai tanggal Jakarta, bukan UTC", () => {
    assert.strictEqual(todayInTz(new Date("2026-10-20T17:30:00Z")), "2026-10-21"); // 00:30 WIB
    assert.strictEqual(todayInTz(new Date("2026-10-20T16:30:00Z")), "2026-10-20"); // 23:30 WIB
  });
});

describe("parsePeriod", () => {
  it("default: 30 hari terakhir sampai hari ini", () => {
    const r = parsePeriod(params(""), NOW);
    assert.deepStrictEqual(r.period, { from: "2026-09-22", to: "2026-10-21", timezone: TZ_NAME });
  });

  it("batas waktu: awal hari WIB sampai awal hari berikutnya (eksklusif)", () => {
    const r = parsePeriod(params("from=2026-10-01&to=2026-10-10"), NOW);
    assert.strictEqual(r.start.toISOString(), "2026-09-30T17:00:00.000Z");
    assert.strictEqual(r.end.toISOString(), "2026-10-10T17:00:00.000Z");
  });

  it("hanya `to`: from otomatis 29 hari sebelumnya", () => {
    const r = parsePeriod(params("to=2026-10-10"), NOW);
    assert.strictEqual(r.period.from, "2026-09-11");
  });

  it("366 hari boleh, 367 hari ditolak", () => {
    assert.ok(parsePeriod(params("from=2025-10-21&to=2026-10-21"), NOW).period);
    assert.ok(parsePeriod(params("from=2025-10-20&to=2026-10-21"), NOW).error);
  });

  it("menolak input salah", () => {
    for (const qs of ["from=2026-10-10&to=2026-10-01", "from=abc", "to=2026-02-31", "from="]) {
      const r = parsePeriod(params(qs), NOW);
      assert.ok(r.error, qs);
      assert.strictEqual(r.period, undefined);
    }
  });
});