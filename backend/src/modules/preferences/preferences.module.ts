import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PreferencesService } from "./preferences.service";
import { PreferencesController } from "./preferences.controller";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { TenantCvModule } from "../tenant-cv/tenant-cv.module";

@Module({
  imports: [TypeOrmModule.forFeature([Preferences, User]), TenantCvModule],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
