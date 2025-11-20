import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
// Temporarily disabled old matching services - need to update to new Property structure
// import { MatchingMediaService } from "./services/matching-media.service";
// import { MatchingNotificationService } from "./services/matching-notification.service";
import { MatchingCacheService } from "./services/matching-cache.service";
// Enhanced services - temporarily disabled, need to update to new Property structure
// import { MatchingEnhancedController } from "./matching-enhanced.controller";
// import { MatchingEnhancedService } from "./matching-enhanced.service";
// import { MatchingCalculationEnhancedService } from "./services/matching-calculation-enhanced.service";
// import { MatchingFilterEnhancedService } from "./services/matching-filter-enhanced.service";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Preferences, User]),
    ConfigModule,
  ],
  controllers: [
    // MatchingEnhancedController - temporarily disabled
  ],
  providers: [
    // Support services
    // MatchingMediaService - temporarily disabled
    // MatchingNotificationService - temporarily disabled
    MatchingCacheService,
    // Enhanced services - temporarily disabled
    // MatchingEnhancedService,
    // MatchingCalculationEnhancedService,
    // MatchingFilterEnhancedService,
    S3Service,
  ],
  exports: [
    // MatchingEnhancedService - temporarily disabled
  ],
})
export class MatchingModule {}
