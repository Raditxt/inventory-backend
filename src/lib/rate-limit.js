import { createFailureLimiter } from "@/domain/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const g = globalThis;
g.__loginLimiters ??= {
  byAccount: createFailureLimiter({ max: 5, windowMs: WINDOW_MS }), // kunci: ip|email
  byIp: createFailureLimiter({ max: 20, windowMs: WINDOW_MS }), // kunci: ip
};
export const loginLimiters = g.__loginLimiters;

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}