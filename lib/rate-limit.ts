import { NextApiRequest, NextApiResponse } from "next";

interface RateLimitConfig {
    interval: number; // Interval in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

export function rateLimit(options: RateLimitConfig) {
    const tokenCache = new Map();
    let lastClearTime = Date.now();

    return {
        check: (res: NextApiResponse, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const now = Date.now();

                // Clear cache if interval has passed
                if (now - lastClearTime > options.interval) {
                    tokenCache.clear();
                    lastClearTime = now;
                }

                const tokenCount = tokenCache.get(token) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;

                res.setHeader("X-RateLimit-Limit", limit);
                res.setHeader(
                    "X-RateLimit-Remaining",
                    isRateLimited ? 0 : limit - currentUsage
                );

                if (isRateLimited) {
                    return reject(new Error("Rate limit exceeded"));
                }

                return resolve();
            }),
    };
}
