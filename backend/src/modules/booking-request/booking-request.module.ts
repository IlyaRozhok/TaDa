import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingRequest } from "../../entities/booking-request.entity";
import { Property } from "../../entities/property.entity";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { BookingRequestService } from "./booking-request.service";
import { BookingRequestController } from "./booking-request.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BookingRequest, Property, TenantCv])],
  controllers: [BookingRequestController],
  providers: [BookingRequestService],
})
export class BookingRequestModule {}
