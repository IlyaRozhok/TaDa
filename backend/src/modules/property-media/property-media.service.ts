import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PropertyMedia } from "../../entities/property-media.entity";
import { Property } from "../../entities/property.entity";
import { S3Service } from "../../common/services/s3.service";

@Injectable()
export class PropertyMediaService {
  constructor(
    @InjectRepository(PropertyMedia)
    private readonly propertyMediaRepository: Repository<PropertyMedia>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Get media with fresh presigned URL
   */
  async getMediaWithPresignedUrl(mediaId: string): Promise<PropertyMedia> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    media.url = await this.s3Service.getPresignedUrl(media.s3_key);

    return media;
  }

  /**
   * Get all media for a property with fresh presigned URLs
   */
  async getAllPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    const media = await this.propertyMediaRepository.find({
      where: { property_id: propertyId },
      order: { order_index: "ASC" },
    });

    await Promise.all(
      media.map(async (item) => {
        item.url = await this.s3Service.getPresignedUrl(item.s3_key);
      })
    );

    return media;
  }

  /**
   * Upload media file for property
   */
  async uploadFile(
    propertyId: string,
    userId: string,
    file: Express.Multer.File,
    orderIndex?: number,
    userRole?: string
  ): Promise<PropertyMedia> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    this.ensureOwnerOrAdmin(property.operator_id, userId, userRole);

    if (!this.s3Service.isValidFileType(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only images and videos are allowed."
      );
    }

    const fileKey = this.s3Service.generateFileKey(
      file.originalname,
      "property-media"
    );

    const s3Result = await this.s3Service.uploadFile(
      file.buffer,
      fileKey,
      file.mimetype,
      file.originalname
    );

    if (orderIndex === undefined) {
      const maxOrderIndex = await this.propertyMediaRepository
        .createQueryBuilder("media")
        .select("MAX(media.order_index)", "maxOrder")
        .where("media.property_id = :propertyId", { propertyId })
        .getRawOne();

      orderIndex = (maxOrderIndex?.maxOrder || -1) + 1;
    }

    const media = this.propertyMediaRepository.create({
      property_id: propertyId,
      url: s3Result.url,
      s3_key: s3Result.key,
      type: this.s3Service.getFileType(file.mimetype),
      mime_type: file.mimetype,
      original_filename: file.originalname,
      file_size: file.size,
      order_index: orderIndex,
    });

    return this.propertyMediaRepository.save(media);
  }

  /**
   * Get all media for a property
   */
  async getPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    return await this.propertyMediaRepository.find({
      where: { property_id: propertyId },
      order: { order_index: "ASC", created_at: "ASC" },
    });
  }

  /**
   * Delete media file
   */
  async deleteMedia(
    mediaId: string,
    userId: string,
    userRole?: string
  ): Promise<void> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
      relations: ["property"],
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    this.ensureOwnerOrAdmin(media.property.operator_id, userId, userRole);

    // Delete from S3
    await this.s3Service.deleteFile(media.s3_key);

    // Delete from database
    await this.propertyMediaRepository.remove(media);
  }

  /**
   * Update media order
   */
  async updateMediaOrder(
    propertyId: string,
    userId: string,
    mediaOrders: { id: string; order_index: number }[],
    userRole?: string
  ): Promise<PropertyMedia[]> {
    // Verify property ownership
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    this.ensureOwnerOrAdmin(property.operator_id, userId, userRole);

    // Update order for each media
    for (const mediaOrder of mediaOrders) {
      await this.propertyMediaRepository.update(
        { id: mediaOrder.id, property_id: propertyId },
        { order_index: mediaOrder.order_index }
      );
    }

    return await this.getPropertyMedia(propertyId);
  }

  private ensureOwnerOrAdmin(
    operatorId: string,
    userId: string,
    userRole?: string
  ) {
    if (userRole === "admin") return;
    if (operatorId !== userId) {
      throw new ForbiddenException(
        "You can only manage media for your own properties"
      );
    }
  }
}
