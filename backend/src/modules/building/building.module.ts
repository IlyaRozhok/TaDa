import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { BuildingService } from "./building.service";
import { BuildingController } from "./building.controller";
import { Building } from "../../entities/building.entity";
import { Property } from "../../entities/property.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, Property, User]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [BuildingController],
  providers: [BuildingService, S3Service],
  exports: [BuildingService],
})
export class BuildingModule {}
