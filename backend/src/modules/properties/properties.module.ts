import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PropertiesService } from "./properties.service";
import { PropertiesController } from "./properties.controller";
import { Property } from "../../entities/property.entity";
import { Favourite } from "../../entities/favourite.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { MatchingModule } from "../matching/matching.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Favourite, Shortlist, User]),
    MatchingModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
