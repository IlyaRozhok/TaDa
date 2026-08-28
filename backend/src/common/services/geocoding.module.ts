import { Global, Module } from "@nestjs/common";
import { GeocodingService } from "./geocoding.service";

// Global singleton, same shape as S3Module: property and building writes
// both geocode, and a per-module provider would re-create the shadowing
// problem the S3 cleanup removed.
@Global()
@Module({
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
