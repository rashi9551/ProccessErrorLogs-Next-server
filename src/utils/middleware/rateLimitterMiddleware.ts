// src/utils/rateLimitMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter instance
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"), // 100 requests per 15 minutes
});

// Wrapper function to apply rate limiting
export function rateLimitMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Extract the IP address from the headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

    // Apply rate limiting
    const { success } = await ratelimit.limit(ip);

    // If the limit is exceeded, return a 429 response
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }

    // Otherwise, proceed to the handler
    return handler(req);
  };
}