import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { S3Service } from "@/common/services/s3.service";
import { MatchingService } from "./matching.service";
import { MatchingController } from "./matching.controller";
import { MatchingCalculationService } from "./services/matching-calculation.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Preferences]),
    ConfigModule,
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    MatchingCalculationService,
    S3Service,
  ],
  exports: [MatchingService, MatchingCalculationService],
})
export class MatchingModule {}
