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
    reason: "help_find_home",
    name: "  Jane Doe  ",
    email: " jane@example.com ",
    phone: { countryCode: "GB", number: " 20 7946 0000 " },
    preferredTimes: ["morning", "evening"],
    notes: "  Evenings work best  ",
    source: "tenant",
    ...overrides,
  };
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
        reason: "help_find_home",
        name: "Jane Doe",
        email: "jane@example.com",
        phone_country_code: "GB",
        phone_number: "20 7946 0000",
        preferred_times: ["morning", "evening"],
        notes: "Evenings work best",
        source: "tenant",
      });
    });

    it("stores null rather than an empty array when no time was picked", async () => {
      await build().create(dto({ preferredTimes: [], notes: "   " }));

      expect(repo.saved[0].preferred_times).toBeNull();
      expect(repo.saved[0].notes).toBeNull();
    });

    it("stores null when the optional fields are absent altogether", async () => {
      await build().create(
        dto({ preferredTimes: undefined, notes: undefined }),
      );

      expect(repo.saved[0].preferred_times).toBeNull();
      expect(repo.saved[0].notes).toBeNull();
    });
  });

  describe("notification event", () => {
    it("emits labels for the inbox alongside the stored slug", async () => {
      await build().create(dto());

      expect(emitter.emit).toHaveBeenCalledWith(
        NotificationEvents.CallRequested,
        expect.objectContaining({
          reason: "help_find_home",
          reasonLabel: "Help me find a home",
          name: "Jane Doe",
          email: "jane@example.com",
          phone: { countryCode: "GB", number: "20 7946 0000" },
          preferredTimes: ["Morning", "Evening"],
          notes: "Evenings work best",
          source: "tenant",
        }),
      );
    });

    it("carries no recipient — the channel resolves that from config", async () => {
      await build().create(dto());

      const [, event] = emitter.emit.mock.calls[0];
      expect(Object.keys(event)).not.toContain("recipient");
      expect(Object.keys(event)).not.toContain("to");
    });

    it("renders an operator-only reason from the operator vocabulary", async () => {
      await build().create(
        dto({ reason: "connect_feed", source: "operator" }),
      );

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
