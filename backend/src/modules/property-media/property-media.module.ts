import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { PropertyMediaController } from "./property-media.controller";
import { PropertyMediaService } from "./property-media.service";
import { PropertyMedia } from "../../entities/property-media.entity";
import { Property } from "../../entities/property.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyMedia, Property]),
    ConfigModule,
    MulterModule.register({
      limits: {
        // nginx already caps the whole request body at 50 MB on prod and
        // stage (client_max_body_size 50M), so the previous 1 GB value only
        // meant "no limit of our own". Storage is in-memory: every accepted
        // file is buffered in RAM before validation, so both caps matter.
        fileSize: 50 * 1024 * 1024,
        files: 100,
      },
    }),
  ],
  controllers: [PropertyMediaController],
  providers: [PropertyMediaService, S3Service],
  exports: [PropertyMediaService],
})
export class PropertyMediaModule {}
