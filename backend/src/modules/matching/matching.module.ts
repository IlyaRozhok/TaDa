import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";
import { MatchingService } from "./matching.service";
import { MatchingController } from "./matching.controller";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { MatchingCacheService } from "./services/matching-cache.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Preferences, User]),
    ConfigModule,
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    MatchingCalculationService,
    MatchingCacheService,
    S3Service,
  ],
  exports: [MatchingService, MatchingCalculationService],
})
export class MatchingModule {}
