import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

/**
 * Covers the phone write of `updateProfile`: whatever formatting the profile
 * form sends, the users row gets E.164 and its country; "" clears both to
 * NULL (never "", which the planned E.164 CHECK constraint would reject).
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

  const written = () => userRepository.update.mock.calls[0][1];

  it("stores a formatted international number as E.164 with its country", async () => {
    await service.updateProfile("user-1", { phone: "+44 7123 456789" } as UpdateUserDto);

    expect(written()).toMatchObject({ phone: "+447123456789", phone_country: "GB" });
  });

  it("stores E.164 unchanged, country derived from the number", async () => {
    await service.updateProfile("user-1", { phone: "+4915123456789" } as UpdateUserDto);

    expect(written()).toMatchObject({ phone: "+4915123456789", phone_country: "DE" });
  });

  it("clears phone and country to NULL on an empty string", async () => {
    await service.updateProfile("user-1", { phone: "" } as UpdateUserDto);

    expect(written()).toMatchObject({ phone: null, phone_country: null });
  });

  it("does not touch the phone when the payload omits it", async () => {
    await service.updateProfile("user-1", { address: "1 High St" } as UpdateUserDto);

    expect(written()).not.toHaveProperty("phone");
    expect(written()).not.toHaveProperty("phone_country");
  });
});
