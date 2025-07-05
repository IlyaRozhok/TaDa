import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { PreferencesService } from "./preferences.service";
import { CreatePreferencesDto } from "./dto/create-preferences.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { Preferences } from "../../entities/preferences.entity";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";

@ApiTags("Preferences")
@Controller("preferences")
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  @Auth("tenant")
  @ApiOperation({ summary: "Save tenant preferences (create or update)" })
  @ApiResponse({
    status: 201,
    description: "Preferences saved successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 403,
    description: "Only tenants can set preferences",
  })
  async save(
    @CurrentUser() user: User,
    @Body() createPreferencesDto: CreatePreferencesDto
  ): Promise<Preferences> {
    return this.preferencesService.upsert(user.id, createPreferencesDto);
  }

  @Get()
  @Auth("tenant")
  @ApiOperation({ summary: "Get current user preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences retrieved successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async findMy(@CurrentUser() user: User): Promise<Preferences | null> {
    return this.preferencesService.findByUserId(user.id);
  }

  @Put()
  @Auth("tenant")
  @ApiOperation({ summary: "Update tenant preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences updated successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async update(
    @CurrentUser() user: User,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ): Promise<Preferences> {
    return this.preferencesService.update(user.id, updatePreferencesDto);
  }

  @Delete()
  @Auth("tenant")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete tenant preferences" })
  @ApiResponse({
    status: 204,
    description: "Preferences deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async delete(@CurrentUser() user: User): Promise<void> {
    return this.preferencesService.delete(user.id);
  }
}
