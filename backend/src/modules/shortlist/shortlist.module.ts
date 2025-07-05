import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ShortlistController } from "./shortlist.controller";
import { ShortlistService } from "./shortlist.service";
import { Shortlist } from "../../entities/shortlist.entity";
import { Property } from "../../entities/property.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Shortlist, Property])],
  controllers: [ShortlistController],
  providers: [ShortlistService],
  exports: [ShortlistService],
})
export class ShortlistModule {}
