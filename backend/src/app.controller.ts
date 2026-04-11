import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "TADA is running!";
  }

  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-sentry')
  testSentry() {
    throw new Error('Sentry integration test');
  }

}
