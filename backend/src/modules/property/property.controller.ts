import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { PropertyService } from "./property.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { FindPropertiesDto } from "./dto/find-properties.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@ApiTags("properties")
@Controller("properties")
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly s3Service: S3Service
  ) {}

  // Public endpoints - MUST be before protected routes
  @Get("public/all")
  @ApiOperation({ summary: "Get all public properties (no auth required)" })
  @ApiResponse({
    status: 200,
    description: "Public properties retrieved successfully",
  })
  async findAllPublic(@Query() query: FindPropertiesDto) {
    return this.propertyService.findAllPublic({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
    });
  }

  @Get("public/:id")
  @ApiOperation({ summary: "Get a public property by ID (no auth required)" })
  @ApiResponse({ status: 200, description: "Property found" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async findOnePublic(@Param("id") id: string) {
    return this.propertyService.findOne(id);
  }

  @Get("public")
  @ApiOperation({
    summary: "Get paginated public properties (no auth required)",
  })
  @ApiResponse({
    status: 200,
    description: "Public properties retrieved successfully",
  })
  async getPublicProperties(@Query() query: FindPropertiesDto) {
    return this.propertyService.findAllPublic({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
    });
  }

  // Protected endpoints below
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post("upload/photos")
  @Roles(UserRole.Admin, UserRole.Operator)
  @UseInterceptors(FilesInterceptor("photos", 10))
  @ApiOperation({ summary: "Upload property photos" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        photos: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Photos uploaded successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          key: { type: "string" },
        },
      },
    },
  })
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
          "property-photo"
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

  @Post("upload/video")
  @Roles(UserRole.Admin, UserRole.Operator)
  @UseInterceptors(FileInterceptor("video"))
  @ApiOperation({ summary: "Upload property video" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        video: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Video uploaded successfully",
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        key: { type: "string" },
      },
    },
  })
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
        "property-video"
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

  @Post("upload/documents")
  @Roles(UserRole.Admin, UserRole.Operator)
  @UseInterceptors(FileInterceptor("documents"))
  @ApiOperation({ summary: "Upload property documents" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        documents: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Documents uploaded successfully",
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        key: { type: "string" },
      },
    },
  })
  async uploadDocuments(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No file provided");
    }

    try {
      if (file.mimetype !== "application/pdf") {
        throw new Error(`Invalid file type. Only PDF files are allowed.`);
      }

      const fileKey = this.s3Service.generateFileKey(
        file.originalname,
        "property-documents"
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
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  // CRUD endpoints - after upload endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.Admin, UserRole.Operator)
  @ApiOperation({ summary: "Create a new property" })
  @ApiResponse({ status: 201, description: "Property created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Building not found" })
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertyService.create(createPropertyDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get()
  @Roles(UserRole.Admin, UserRole.Operator)
  @ApiOperation({ summary: "Get all properties" })
  @ApiResponse({
    status: 200,
    description: "Properties retrieved successfully",
  })
  async findAll(
    @Query("building_id") building_id?: string,
    @Query("operator_id") operator_id?: string
  ) {
    return await this.propertyService.findAllWithFreshUrls({ building_id, operator_id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(":id")
  @Roles(UserRole.Admin, UserRole.Operator)
  @ApiOperation({ summary: "Get a property by ID" })
  @ApiResponse({ status: 200, description: "Property found" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async findOne(@Param("id") id: string) {
    return await this.propertyService.findOneWithFreshUrls(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(":id")
  @Roles(UserRole.Admin, UserRole.Operator)
  @ApiOperation({ summary: "Update a property" })
  @ApiResponse({ status: 200, description: "Property updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Property not found" })
  update(
    @Param("id") id: string,
    @Body() updatePropertyDto: UpdatePropertyDto
  ) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete(":id")
  @Roles(UserRole.Admin, UserRole.Operator)
  @ApiOperation({ summary: "Delete a property" })
  @ApiResponse({ status: 200, description: "Property deleted successfully" })
  @ApiResponse({ status: 404, description: "Property not found" })
  remove(@Param("id") id: string) {
    return this.propertyService.remove(id);
  }
}
