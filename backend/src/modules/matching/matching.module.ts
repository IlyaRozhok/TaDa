import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Property, Preferences, User])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
