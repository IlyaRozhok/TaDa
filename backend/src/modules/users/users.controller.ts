import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "../../entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Users")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    type: User,
  })
  async getProfile(@Req() req: any): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile updated successfully",
    type: User,
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete current user account" })
  @ApiResponse({
    status: 200,
    description: "User account deleted successfully",
  })
  async deleteAccount(@Req() req: any): Promise<{ message: string }> {
    await this.usersService.deleteAccount(req.user.id);
    return { message: "Account deleted successfully" };
  }
}
