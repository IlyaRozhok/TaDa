import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
// Temporarily disabled - need to update to new Property structure
// import { OperatorController } from "./operator.controller";
// import { OperatorService } from "./operator.service";
import { Property } from "../../entities/property.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { Preferences } from "../../entities/preferences.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Property, Shortlist, User, Preferences])],
  controllers: [
    // OperatorController - temporarily disabled
  ],
  providers: [
    // OperatorService - temporarily disabled
  ],
})
export class OperatorModule {}
