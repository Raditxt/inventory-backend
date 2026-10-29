import assert from "node:assert";
import { createFailureLimiter } from "../../src/domain/rate-limit.js";

function setup(max = 3, windowMs = 60000) {
  const clock = { t: 0 };
  const limiter = createFailureLimiter({ max, windowMs, now: () => clock.t });
  return { clock, limiter };
}

describe("createFailureLimiter", () => {
  it("tidak memblokir sebelum batas tercapai", () => {
    const { limiter } = setup();
    limiter.fail("a");
    limiter.fail("a");
    assert.strictEqual(limiter.check("a").blocked, false);
  });

  it("memblokir setelah batas, dan melaporkan sisa waktu", () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.fail("a");
    assert.deepStrictEqual(limiter.check("a"), { blocked: true, retryAfterSec: 60 });
    clock.t = 30000;
    assert.strictEqual(limiter.check("a").retryAfterSec, 30);
  });

  it("terbuka lagi setelah jendela waktu lewat", () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.fail("a");
    clock.t = 60000;
    assert.strictEqual(limiter.check("a").blocked, false);
    limiter.fail("a"); // jendela baru dimulai dari nol
    assert.strictEqual(limiter.check("a").blocked, false);
  });

  it("reset menghapus catatan kegagalan", () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.fail("a");
    limiter.reset("a");
    assert.strictEqual(limiter.check("a").blocked, false);
  });

  it("tiap key dihitung sendiri-sendiri", () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.fail("a");
    assert.strictEqual(limiter.check("a").blocked, true);
    assert.strictEqual(limiter.check("b").blocked, false);
  });
});