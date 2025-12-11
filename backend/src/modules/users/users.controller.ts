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
  Query,
  Param,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserRole } from "../../entities/user.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { toUserResponse } from "./user.mapper";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { CreateUserDto } from "./dto/create-user.dto";
import { FileInterceptor } from "@nestjs/platform-express";

class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

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
    const user = await this.usersService.findOne(req.user.id);
    return toUserResponse(user) as any;
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
    @Req() req: Request & { user: User },
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    const user = await this.usersService.updateProfile(
      req.user.id,
      updateUserDto
    );
    return toUserResponse(user) as any;
  }

  @Post("avatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Upload avatar for current user" })
  @ApiResponse({
    status: 200,
    description: "Avatar uploaded successfully",
    type: User,
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Req() req: Request & { user: User },
    @UploadedFile() file: Express.Multer.File
  ): Promise<User> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const user = await this.usersService.uploadAvatar(req.user.id, file);
    return toUserResponse(user) as any;
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

  @Get("")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({ status: 200, description: "List of users", type: [User] })
  async getAllUsers(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("sortBy") sortBy: string = "created_at",
    @Query("order") order: "ASC" | "DESC" = "DESC"
  ) {
    const result = await this.usersService.findAllPaginated({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      sortBy,
      sortOrder: order,
    });

    return {
      ...result,
      users: result.users.map(toUserResponse),
    };
  }

  @Post("")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create user (admin only)" })
  @ApiResponse({ status: 201, description: "User created", type: User })
  async adminCreateUser(@Body() dto: CreateUserDto): Promise<User> {
    const user = await this.usersService.adminCreateUser(dto);
    return toUserResponse(user) as any;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update user by id (admin only)" })
  @ApiResponse({ status: 200, description: "User updated", type: User })
  async adminUpdateUser(
    @Param("id") id: string,
    @Body() dto: AdminUpdateUserDto
  ): Promise<User> {
    const user = await this.usersService.adminUpdateUser(id, dto);
    return toUserResponse(user) as any;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete user by id (admin only)" })
  @ApiResponse({ status: 200, description: "User deleted" })
  async adminDeleteUser(@Param("id") id: string): Promise<{ message: string }> {
    await this.usersService.adminDeleteUser(id);
    return { message: "User deleted" };
  }

  @Put(":id/role")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update user role" })
  @ApiResponse({ status: 200, description: "User role updated", type: User })
  async updateUserRole(
    @Param("id") id: string,
    @Body() updateData: { role: string },
    @Req() req: Request & { user: User }
  ): Promise<{ user: User; access_token?: string }> {
    if (req.user.id !== id && req.user.role !== UserRole.Admin) {
      throw new ForbiddenException("Unauthorized to update this role");
    }

    const user = await this.usersService.updateUserRole(id, updateData.role);
    return { user: toUserResponse(user) as any };
  }
}
