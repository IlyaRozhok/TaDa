import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ShortlistController } from "./shortlist.controller";
import { ShortlistService } from "./shortlist.service";
import { Property } from "../../entities/property.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { User } from "../../entities/user.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { S3Module } from "../../common/services/s3.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Shortlist, TenantProfile, User]),
    ConfigModule,
    S3Module,
  ],
  controllers: [ShortlistController],
  providers: [ShortlistService],
  exports: [ShortlistService],
})
export class ShortlistModule {}
