import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Hello World!";
  }

  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("debug/s3-config")
  getS3Config() {
    return {
      AWS_REGION: process.env.AWS_REGION || 'undefined',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'undefined',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'undefined',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'undefined',
    };
  }
}
