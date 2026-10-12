import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

/**
 * Covers the phone write of `updateProfile`: whatever formatting the profile
 * form sends, the users row gets E.164, and "" still clears the number.
 */
describe("UsersService.updateProfile — phone", () => {
  let userRepository: { update: jest.Mock; findOne: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    userRepository = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const userQueryService = { findOneWithProfiles: jest.fn().mockResolvedValue({}) };

    service = new UsersService(
      userRepository as any,
      {} as any,
      {} as any,
      userQueryService as any,
      {} as any,
      {} as any,
    );
  });

  const writtenPhone = () => userRepository.update.mock.calls[0][1].phone;

  it("stores a formatted international number as E.164", async () => {
    await service.updateProfile("user-1", { phone: "+44 7041 230790" } as UpdateUserDto);

    expect(writtenPhone()).toBe("+447041230790");
  });

  it("stores E.164 unchanged", async () => {
    await service.updateProfile("user-1", { phone: "+4915123456789" } as UpdateUserDto);

    expect(writtenPhone()).toBe("+4915123456789");
  });

  it("clears the phone on an empty string", async () => {
    await service.updateProfile("user-1", { phone: "" } as UpdateUserDto);

    expect(writtenPhone()).toBe("");
  });

  it("does not touch the phone when the payload omits it", async () => {
    await service.updateProfile("user-1", { address: "1 High St" } as UpdateUserDto);

    expect(userRepository.update.mock.calls[0][1]).not.toHaveProperty("phone");
  });
});
