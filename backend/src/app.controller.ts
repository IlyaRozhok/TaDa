import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Public } from "@/common/decorators/public.decorator";

@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  getHello(): string {
    return "TADA is running!";
  }

  // Probed by the Docker healthcheck (docker-compose.yml) and by the deploy
  // pipeline. It must actually touch the database: a static "ok" cannot
  // distinguish "app up" from "app up, database unreachable", and the
  // migrate-before-serve deploy fix (LAUNCH_PLAN #4) depends on this signal
  // being truthful (LAUNCH_PLAN #5).
  @Get("health")
  @Public()
  async health() {
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      });
    }
    return {
      status: "ok",
      database: "up",
      timestamp: new Date().toISOString(),
    };
  }
}
