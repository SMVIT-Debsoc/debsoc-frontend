import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { cacheStats } from "@/lib/server/cache/cache";
import { getRedis, isRedisConfigured } from "@/lib/server/cache/redis";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["TechHead", "President"] });
  if ("response" in guard) return guard.response;

  let redisReachable = false;
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      redisReachable = true;
    } catch {
      redisReachable = false;
    }
  }

  return ok({
    redisConfigured: isRedisConfigured(),
    redisReachable,
    stats: cacheStats,
  });
}
