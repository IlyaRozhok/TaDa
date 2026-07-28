import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD", undefined),
          db: configService.get<number>("REDIS_DB", 0),
          keyPrefix: "tada:",
          retryStrategy: (times) => {
            if (times > 10) return null; // stop retrying after 10 attempts
            return Math.min(times * 200, 2000);
          },
        });

        client.on("error", (err) => {
          console.error("Redis connection error:", err.message);
        });

        client.on("connect", () => {
          console.log("Redis connected successfully");
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
