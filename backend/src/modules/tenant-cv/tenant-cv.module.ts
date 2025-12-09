import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantCv } from "../../entities/tenant-cv.entity";
import { UsersModule } from "../users/users.module";
import { TenantCvService } from "./tenant-cv.service";
import { TenantCvController } from "./tenant-cv.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TenantCv]), UsersModule],
  providers: [TenantCvService],
  controllers: [TenantCvController],
  exports: [TenantCvService],
})
export class TenantCvModule {}
