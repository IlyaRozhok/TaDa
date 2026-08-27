import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CallRequest } from "@/entities/call-request.entity";
import { CallRequestController } from "./call-request.controller";
import { CallRequestService } from "./call-request.service";

@Module({
  imports: [TypeOrmModule.forFeature([CallRequest])],
  controllers: [CallRequestController],
  providers: [CallRequestService],
})
export class CallRequestModule {}
