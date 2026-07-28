import { IsIn } from "class-validator";

export class TestLoginDto {
  @IsIn(["tenant", "admin", "fresh-tenant"])
  role: "tenant" | "admin" | "fresh-tenant";
}
