import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class AppController {
  @Get("health")
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          example: "ok",
        },
        timestamp: {
          type: "string",
          format: "date-time",
        },
        uptime: {
          type: "number",
          example: 12345,
        },
      },
    },
  })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
