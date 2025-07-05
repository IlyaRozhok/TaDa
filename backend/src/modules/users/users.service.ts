import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";

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
        "is_operator",
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
        "is_operator",
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
}
