import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { BuildingService } from "./building.service";
import { BuildingController } from "./building.controller";
import { Building } from "../../entities/building.entity";
import { Property } from "../../entities/property.entity";
import { User } from "../../entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Building, Property, User]),
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
  controllers: [BuildingController],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingModule {}
