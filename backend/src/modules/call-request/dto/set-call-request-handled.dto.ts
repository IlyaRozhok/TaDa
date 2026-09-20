import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

/**
 * Body of `PATCH /call-requests/:id/handled`. A boolean rather than a
 * timestamp on the wire: the server stamps the moment itself, and `false`
 * lets an admin undo a mis-click by clearing the mark.
 */
export class SetCallRequestHandledDto {
  @ApiProperty({
    description: "true marks the request handled now, false re-opens it",
  })
  @IsBoolean()
  handled: boolean;
}
