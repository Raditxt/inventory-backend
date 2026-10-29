export function createFailureLimiter({ max, windowMs, now = () => Date.now() }) {

  const entries = new Map(); 
  function prune(t) {
    if (entries.size < 1000) return;
    for (const [key, entry] of entries) {
      if (entry.resetAt <= t) entries.delete(key);
    }
  }

  function live(key, t) {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.resetAt <= t) {
      entries.delete(key);
      return null;
    }
    return entry;
  }

  return {
    check(key) {
      const t = now();
      const entry = live(key, t);
      if (entry && entry.count >= max) {
        return { blocked: true, retryAfterSec: Math.ceil((entry.resetAt - t) / 1000) };
      }
      return { blocked: false, retryAfterSec: 0 };
    },

    fail(key) {
      const t = now();
      prune(t);
      const entry = live(key, t);
      if (entry) entry.count += 1;
      else entries.set(key, { count: 1, resetAt: t + windowMs });
    },

    reset(key) {
      entries.delete(key);
    },
  };
}