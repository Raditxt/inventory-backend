import { NextResponse } from "next/server";
import { parseAllowedOrigins, resolveAllowOrigin } from "./domain/cors.js";

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Expose-Headers": "Retry-After",
  "Access-Control-Max-Age": "86400",
};

function applyCors(headers, allowOrigin) {
  if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
  // Jawaban berbeda per origin, jadi cache (CDN/browser) harus membedakannya.
  if (allowOrigin !== "*") headers.append("Vary", "Origin");
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
}

export function proxy(request) {
  const allowOrigin = resolveAllowOrigin(request.headers.get("origin"), allowedOrigins);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyCors(response.headers, allowOrigin);
    return response;
  }

  const response = NextResponse.next();
  applyCors(response.headers, allowOrigin);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
