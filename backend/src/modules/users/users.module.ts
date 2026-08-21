import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";

import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UserProfileService } from "./services/user-profile.service";
import { UserRoleService } from "./services/user-role.service";
import { UserQueryService } from "./services/user-query.service";
import { UserAdminService } from "./services/user-admin.service";
import { User } from "@/entities/user.entity";
import { TenantProfile } from "@/entities/tenant-profile.entity";
import { OperatorProfile } from "@/entities/operator-profile.entity";
import { Preferences } from "@/entities/preferences.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TenantProfile, OperatorProfile, Preferences]),
    // The avatar route had NO multer limit at all — multer defaults to
    // unlimited fileSize with in-memory storage, so the 5 MB check in
    // UsersService ran only after the whole body was buffered in RAM.
    // The limit matches that existing validation.
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserProfileService,
    UserRoleService,
    UserQueryService,
    UserAdminService,
  ],
  exports: [UsersService, UserQueryService],
})
export class UsersModule {}
