import assert from "node:assert";
import { validateJwtSecret, MIN_JWT_SECRET_LENGTH } from "../../src/domain/security.js";

describe("validateJwtSecret", () => {
  it("menolak secret yang kosong atau tidak ada", () => {
    for (const secret of [undefined, null, "", "   "]) {
      assert.match(validateJwtSecret(secret), /belum diisi/, String(secret));
    }
  });

  it("menolak secret yang terlalu pendek", () => {
    const message = validateJwtSecret("x".repeat(MIN_JWT_SECRET_LENGTH - 1));
    assert.match(message, /minimal 32/);
  });

  it("menerima secret 32 karakter atau lebih", () => {
    assert.strictEqual(validateJwtSecret("x".repeat(MIN_JWT_SECRET_LENGTH)), null);
    assert.strictEqual(validateJwtSecret("a".repeat(64)), null);
  });
});