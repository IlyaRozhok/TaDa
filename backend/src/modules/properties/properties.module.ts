import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { PropertyService } from "../property/property.service";
import { PropertyController } from "../property/property.controller";
import { Property } from "../../entities/property.entity";
import { Building } from "../../entities/building.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Building]),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for videos
      },
    }),
  ],
  controllers: [PropertyController],
  providers: [PropertyService, S3Service],
  exports: [PropertyService],
})
export class PropertiesModule {}
