import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Like } from "typeorm";

import { User } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences"],
      select: [
        "id",
        "email",
        "full_name",
        "roles",
        "phone",
        "date_of_birth",
        "nationality",
        "age_range",
        "occupation",
        "industry",
        "work_style",
        "lifestyle",
        "pets",
        "smoker",
        "hobbies",
        "ideal_living_environment",
        "additional_info",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ["preferences"],
      select: [
        "id",
        "email",
        "full_name",
        "roles",
        "phone",
        "date_of_birth",
        "nationality",
        "age_range",
        "occupation",
        "industry",
        "work_style",
        "lifestyle",
        "pets",
        "smoker",
        "hobbies",
        "ideal_living_environment",
        "additional_info",
        "created_at",
        "updated_at",
      ],
    });
  }

  async deleteAccount(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findAllPaginated({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "created_at",
    order = "DESC",
  }) {
    const skip = (page - 1) * limit;
    const query = this.userRepository.createQueryBuilder("user");

    if (search) {
      query.where("user.full_name ILIKE :search OR user.email ILIKE :search", {
        search: `%${search}%`,
      });
    }

    query.orderBy(`user.${sortBy}`, order as any);
    query.skip(skip).take(limit);

    const [users, total] = await query.getManyAndCount();
    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminUpdateUser(id: string, dto: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (dto.full_name !== undefined) user.full_name = dto.full_name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.roles !== undefined) user.roles = dto.roles;
    return this.userRepository.save(user);
  }

  async adminCreateUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new Error("User with this email already exists");
    }
    const user = this.userRepository.create({
      full_name: dto.full_name,
      email: dto.email,
      roles: dto.roles,
      password: await bcrypt.hash(dto.password, 10),
    });
    return this.userRepository.save(user);
  }

  async adminDeleteUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
