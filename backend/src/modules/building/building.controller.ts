import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { BuildingService } from "./building.service";
import { CreateBuildingDto } from "./dto/create-building.dto";
import { UpdateBuildingDto } from "./dto/update-building.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@ApiTags("buildings")
@Controller("buildings")
export class BuildingController {
  constructor(
    private readonly buildingService: BuildingService,
    private readonly s3Service: S3Service
  ) {}

  // Public endpoints - MUST be before protected routes
  @Get("public/:id")
  @ApiOperation({ summary: "Get a public building by ID (no auth required)" })
  @ApiResponse({ status: 200, description: "Building found" })
  @ApiResponse({ status: 404, description: "Building not found" })
  async findOnePublic(@Param("id") id: string) {
    return this.buildingService.findOnePublic(id);
  }

  // Protected endpoints below
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Create a new building" })
  @ApiResponse({ status: 201, description: "Building created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Operator not found" })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingService.create(createBuildingDto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Get all buildings" })
  @ApiResponse({ status: 200, description: "List of buildings" })
  async findAll(@Query("operator_id") operatorId?: string) {
    if (operatorId) {
      return await this.buildingService.findAllWithFreshUrls({
        operator_id: operatorId,
      });
    }
    return await this.buildingService.findAllWithFreshUrls();
  }

  @Get("operators")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Get all operators" })
  @ApiResponse({ status: 200, description: "List of operators" })
  getOperators() {
    return this.buildingService.getOperators();
  }

  @Get(":id")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Get a building by ID" })
  @ApiResponse({ status: 200, description: "Building found" })
  @ApiResponse({ status: 404, description: "Building not found" })
  async findOne(@Param("id") id: string) {
    return await this.buildingService.findOneWithFreshUrls(id);
  }

  @Patch(":id")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Update a building" })
  @ApiResponse({ status: 200, description: "Building updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Building not found" })
  update(
    @Param("id") id: string,
    @Body() updateBuildingDto: UpdateBuildingDto
  ) {
    return this.buildingService.update(id, updateBuildingDto);
  }

  @Delete(":id")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Delete a building" })
  @ApiResponse({ status: 200, description: "Building deleted successfully" })
  @ApiResponse({ status: 404, description: "Building not found" })
  @ApiResponse({
    status: 400,
    description: "Cannot delete building with associated properties",
  })
  async remove(@Param("id") id: string) {
    return await this.buildingService.remove(id);
  }

  @Post("upload/logo")
  @Roles(UserRole.Admin)
  @UseInterceptors(FileInterceptor("logo"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload building logo" })
  @ApiResponse({ status: 201, description: "Logo uploaded successfully" })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No file provided");
    }

    try {
      if (!file.mimetype.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      const fileKey = this.s3Service.generateFileKey(
        file.originalname,
        "building-logo"
      );
      const uploadResult = await this.s3Service.uploadFile(
        file.buffer,
        fileKey,
        file.mimetype,
        file.originalname
      );

      return {
        url: uploadResult.url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error(`Error uploading logo ${file.originalname}:`, error);
      throw new Error(`Failed to upload logo: ${error.message}`);
    }
  }

  @Post("upload/video")
  @Roles(UserRole.Admin)
  @UseInterceptors(FileInterceptor("video"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload building video" })
  @ApiResponse({ status: 201, description: "Video uploaded successfully" })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No file provided");
    }

    try {
      if (!file.mimetype.startsWith("video/")) {
        throw new Error("Invalid file type. Only videos are allowed.");
      }

      const fileKey = this.s3Service.generateFileKey(
        file.originalname,
        "building-video"
      );
      const uploadResult = await this.s3Service.uploadFile(
        file.buffer,
        fileKey,
        file.mimetype,
        file.originalname
      );

      return {
        url: uploadResult.url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error(`Error uploading video ${file.originalname}:`, error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  @Post("upload/photos")
  @Roles(UserRole.Admin)
  @UseInterceptors(FilesInterceptor("photos", 1000))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload building photos" })
  @ApiResponse({ status: 201, description: "Photos uploaded successfully" })
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadPromises = files.map(async (file) => {
      try {
        if (!file.mimetype.startsWith("image/")) {
          throw new Error(
            `Invalid file type for ${file.originalname}. Only images are allowed.`
          );
        }

        const fileKey = this.s3Service.generateFileKey(
          file.originalname,
          "building-photo"
        );
        const uploadResult = await this.s3Service.uploadFile(
          file.buffer,
          fileKey,
          file.mimetype,
          file.originalname
        );

        return {
          url: uploadResult.url,
          key: uploadResult.key,
        };
      } catch (error) {
        console.error(`Error uploading photo ${file.originalname}:`, error);
        throw new Error(
          `Failed to upload ${file.originalname}: ${error.message}`
        );
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Photo upload failed:", error);
      throw error;
    }
  }

  @Post("upload/documents")
  @Roles(UserRole.Admin)
  @UseInterceptors(FilesInterceptor("documents", 5))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload building documents" })
  @ApiResponse({ status: 201, description: "Documents uploaded successfully" })
  async uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const uploadPromises = files.map(async (file) => {
      try {
        if (file.mimetype !== "application/pdf") {
          throw new Error(
            `Invalid file type for ${file.originalname}. Only PDF files are allowed.`
          );
        }

        const fileKey = this.s3Service.generateFileKey(
          file.originalname,
          "building-document"
        );
        const uploadResult = await this.s3Service.uploadFile(
          file.buffer,
          fileKey,
          file.mimetype,
          file.originalname
        );

        return {
          url: uploadResult.url,
          key: uploadResult.key,
        };
      } catch (error) {
        console.error(`Error uploading document ${file.originalname}:`, error);
        throw new Error(
          `Failed to upload ${file.originalname}: ${error.message}`
        );
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Document upload failed:", error);
      throw error;
    }
  }
}
