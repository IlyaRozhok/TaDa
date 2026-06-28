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
        fileSize: 1024 * 1024 * 1024, // 1GB - практически без ограничений
      },
    }),
  ],
  controllers: [PropertyMediaController],
  providers: [PropertyMediaService, S3Service],
  exports: [PropertyMediaService],
})
export class PropertyMediaModule {}
