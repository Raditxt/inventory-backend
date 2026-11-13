import assert from "node:assert";
import { parseAllowedOrigins, resolveAllowOrigin } from "../../src/domain/cors.js";

describe("parseAllowedOrigins", () => {
  it("default ke * kalau env kosong", () => {
    assert.deepStrictEqual(parseAllowedOrigins(undefined), ["*"]);
  });

  it("memecah daftar, membuang spasi dan garis miring di akhir", () => {
    assert.deepStrictEqual(
      parseAllowedOrigins(" https://pos-invent.vercel.app/ , http://localhost:5173,"),
      ["https://pos-invent.vercel.app", "http://localhost:5173"]
    );
  });
});

describe("resolveAllowOrigin", () => {
  const allowed = ["https://pos-invent.vercel.app", "http://localhost:5173"];

  it("memantulkan origin yang ada di daftar", () => {
    assert.strictEqual(resolveAllowOrigin("http://localhost:5173", allowed), "http://localhost:5173");
    assert.strictEqual(
      resolveAllowOrigin("https://pos-invent.vercel.app", allowed),
      "https://pos-invent.vercel.app"
    );
  });

  it("menolak origin di luar daftar dan request tanpa origin", () => {
    assert.strictEqual(resolveAllowOrigin("https://jahat.example", allowed), null);
    assert.strictEqual(resolveAllowOrigin(null, allowed), null);
  });

  it("* mengizinkan semua origin", () => {
    assert.strictEqual(resolveAllowOrigin("https://apa.saja", ["*"]), "*");
  });
});
