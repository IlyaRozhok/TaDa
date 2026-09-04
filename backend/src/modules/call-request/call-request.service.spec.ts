import { EventEmitter2 } from "@nestjs/event-emitter";

import { CallRequest } from "@/entities/call-request.entity";
import { NotificationEvents } from "@/modules/notifications/events/notification.events";
import { CallRequestService } from "./call-request.service";
import { CreateCallRequestDto } from "./dto/create-call-request.dto";

/**
 * `create()` echoes back whatever `save()` returns, so the double stamps the
 * row the way Postgres would — an id and a created_at the entity did not carry.
 */
function createRepositoryDouble() {
  const saved: CallRequest[] = [];

  const repository = {
    create: jest.fn((values: Partial<CallRequest>) => ({ ...values })),
    save: jest.fn(async (entity: Partial<CallRequest>) => {
      const row = {
        id: `call-${saved.length + 1}`,
        created_at: new Date("2026-08-18T10:00:00.000Z"),
        updated_at: new Date("2026-08-18T10:00:00.000Z"),
        ...entity,
      } as CallRequest;
      saved.push(row);
      return row;
    }),
    find: jest.fn().mockResolvedValue([]),
  };

  return { repository, saved };
}

function dto(overrides: Partial<CreateCallRequestDto> = {}): CreateCallRequestDto {
  return {
    reason: "looking_for_home",
    name: "  Jane Doe  ",
    contactMethod: "voice_call",
    phone: { countryCode: "GB", number: " 20 7946 0000 " },
    preferredTime: "  Weekday evenings  ",
    notes: "  Evenings work best  ",
    source: "tenant",
    ...overrides,
  };
}

/** The email-method counterpart: an address instead of a phone. */
function emailDto(
  overrides: Partial<CreateCallRequestDto> = {},
): CreateCallRequestDto {
  return dto({
    contactMethod: "email",
    phone: undefined,
    email: "  Jane@Example.com  ",
    ...overrides,
  });
}

describe("CallRequestService", () => {
  let repo: ReturnType<typeof createRepositoryDouble>;
  let emitter: { emit: jest.Mock };

  const build = () =>
    new CallRequestService(
      repo.repository as never,
      emitter as unknown as EventEmitter2,
    );

  beforeEach(() => {
    repo = createRepositoryDouble();
    emitter = { emit: jest.fn() };
  });

  describe("persistence", () => {
    it("stores the submission before anything is emitted", async () => {
      const order: string[] = [];
      repo.repository.save.mockImplementation(async (entity) => {
        order.push("save");
        return { id: "call-1", created_at: new Date(), ...entity } as CallRequest;
      });
      emitter.emit.mockImplementation(() => order.push("emit"));

      await build().create(dto());

      expect(order).toEqual(["save", "emit"]);
    });

    it("trims the free-text fields and keeps the slugs verbatim", async () => {
      await build().create(dto());

      expect(repo.saved[0]).toMatchObject({
        reason: "looking_for_home",
        name: "Jane Doe",
        contact_method: "voice_call",
        phone_country_code: "GB",
        phone_number: "20 7946 0000",
        preferred_time: "Weekday evenings",
        notes: "Evenings work best",
        source: "tenant",
      });
    });

    it("stores null rather than whitespace when no time was typed", async () => {
      await build().create(dto({ preferredTime: "   ", notes: "   " }));

      expect(repo.saved[0].preferred_time).toBeNull();
      expect(repo.saved[0].notes).toBeNull();
    });

    it("stores null when the optional fields are absent altogether", async () => {
      await build().create(dto({ preferredTime: undefined, notes: undefined }));

      expect(repo.saved[0].preferred_time).toBeNull();
      expect(repo.saved[0].notes).toBeNull();
    });

    it("stores no email when the method is a call", async () => {
      await build().create(dto());

      expect(repo.saved[0].email).toBeNull();
    });

    it("stores the address and no phone when the method is email", async () => {
      await build().create(emailDto());

      expect(repo.saved[0]).toMatchObject({
        contact_method: "email",
        phone_country_code: null,
        phone_number: null,
        email: "Jane@Example.com",
      });
    });

    // A client that leaves a stale phone behind when the visitor switches to
    // email must not have it persisted: the method decides, not the payload.
    it("ignores a phone that arrives alongside the email method", async () => {
      await build().create(
        emailDto({ phone: { countryCode: "GB", number: "20 7946 0000" } }),
      );

      expect(repo.saved[0].phone_country_code).toBeNull();
      expect(repo.saved[0].phone_number).toBeNull();
    });

    it("ignores an address that arrives alongside a call method", async () => {
      await build().create(dto({ email: "jane@example.com" }));

      expect(repo.saved[0].email).toBeNull();
    });
  });

  describe("notification event", () => {
    it("emits the reason label for the inbox alongside the stored slug", async () => {
      await build().create(dto());

      expect(emitter.emit).toHaveBeenCalledWith(
        NotificationEvents.CallRequested,
        expect.objectContaining({
          reason: "looking_for_home",
          reasonLabel: "I'm looking for a home",
          name: "Jane Doe",
          contactMethod: "voice_call",
          contactMethodLabel: "Voice call",
          phone: { countryCode: "GB", number: "20 7946 0000" },
          email: null,
          preferredTime: "Weekday evenings",
          notes: "Evenings work best",
          source: "tenant",
        }),
      );
    });

    it("emits the address and a null phone for the email method", async () => {
      await build().create(emailDto());

      expect(emitter.emit).toHaveBeenCalledWith(
        NotificationEvents.CallRequested,
        expect.objectContaining({
          contactMethod: "email",
          contactMethodLabel: "Email",
          phone: null,
          email: "Jane@Example.com",
        }),
      );
    });

    // `email` on the event is the visitor's own address — something support
    // reads, never somewhere we send. The recipient is the channel's business.
    it("carries no recipient — the channel resolves that from config", async () => {
      await build().create(emailDto());

      const [, event] = emitter.emit.mock.calls[0];
      expect(Object.keys(event)).not.toContain("recipient");
      expect(Object.keys(event)).not.toContain("to");
    });

    it("renders the same shared vocabulary for the operator landing", async () => {
      await build().create(dto({ reason: "connect_feed", source: "operator" }));

      expect(emitter.emit).toHaveBeenCalledWith(
        NotificationEvents.CallRequested,
        expect.objectContaining({
          reasonLabel: "I want to connect a property feed",
          source: "operator",
        }),
      );
    });
  });

  describe("admin listing", () => {
    it("returns every request newest first", async () => {
      await build().findAll();

      expect(repo.repository.find).toHaveBeenCalledWith({
        where: {},
        order: { created_at: "DESC" },
      });
    });

    it("narrows to one landing when a source is given", async () => {
      await build().findAll("operator");

      expect(repo.repository.find).toHaveBeenCalledWith({
        where: { source: "operator" },
        order: { created_at: "DESC" },
      });
    });
  });
});
