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
  let emitter: { emit: jest.Mock };

  beforeEach(() => {
    userRepository = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const userQueryService = { findOneWithProfiles: jest.fn().mockResolvedValue({}) };
    emitter = { emit: jest.fn() };

    service = new UsersService(
      userRepository as any,
      {} as any,
      {} as any,
      userQueryService as any,
      {} as any,
      {} as any,
      emitter as any,
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
    expect(written()).not.toHaveProperty("phone_verified_at");
  });

  it("keeps the SMS verification when the profile re-saves the same number", async () => {
    userRepository.findOne.mockResolvedValueOnce({ id: "user-1", phone: "+447123456789" });
    await service.updateProfile("user-1", { phone: "+44 7123 456789" } as UpdateUserDto);

    expect(written()).not.toHaveProperty("phone_verified_at");
  });

  it("clears the SMS verification when the number changes", async () => {
    userRepository.findOne.mockResolvedValueOnce({ id: "user-1", phone: "+447123456789" });
    await service.updateProfile("user-1", { phone: "+447400883369" } as UpdateUserDto);

    expect(written()).toMatchObject({ phone: "+447400883369", phone_verified_at: null });
  });
});

describe("UsersService.updateProfile — contact-changed event", () => {
  let userRepository: { update: jest.Mock; findOne: jest.Mock };
  let emitter: { emit: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    userRepository = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue({
        id: "user-1",
        phone: "+447123456789",
        first_name: "Jane",
        last_name: "Doe",
      }),
    };
    emitter = { emit: jest.fn() };
    service = new UsersService(
      userRepository as any,
      {} as any,
      {} as any,
      { findOneWithProfiles: jest.fn().mockResolvedValue({}) } as any,
      {} as any,
      {} as any,
      emitter as any,
    );
  });

  it("announces a changed phone", async () => {
    await service.updateProfile("user-1", { phone: "+44 7400 123456" } as UpdateUserDto);

    expect(emitter.emit).toHaveBeenCalledWith(
      "user.contact-changed",
      expect.objectContaining({ userId: "user-1", changed: ["phone"] }),
    );
  });

  it("announces changed names", async () => {
    await service.updateProfile("user-1", { first_name: "Janet", last_name: "Doe" } as UpdateUserDto);

    expect(emitter.emit).toHaveBeenCalledWith(
      "user.contact-changed",
      expect.objectContaining({ changed: ["first_name"] }),
    );
  });

  it("stays quiet when the save changes none of them", async () => {
    await service.updateProfile("user-1", {
      phone: "+44 7123 456789",
      first_name: "Jane",
      last_name: "Doe",
      address: "1 New Road",
    } as UpdateUserDto);

    expect(userRepository.update).toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it("stays quiet for a save that touches no contact field", async () => {
    await service.updateProfile("user-1", { address: "1 New Road" } as UpdateUserDto);

    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
