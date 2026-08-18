import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantCv } from "@/entities/tenant-cv.entity";
import { UsersModule } from "@/modules/users/users.module";
import { TenantCvService } from "./tenant-cv.service";
import { TenantCvController } from "./tenant-cv.controller";
import { S3Service } from "@/common/services/s3.service";

@Module({
  imports: [TypeOrmModule.forFeature([TenantCv]), UsersModule],
  providers: [TenantCvService, S3Service],
  controllers: [TenantCvController],
  exports: [TenantCvService],
})
export class TenantCvModule {}
