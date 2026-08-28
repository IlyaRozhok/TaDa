import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CallRequest, CallRequestSource } from "@/entities/call-request.entity";
import {
  CallRequestedEvent,
  NotificationEvents,
} from "@/modules/notifications/events/notification.events";
import { CreateCallRequestDto } from "./dto/create-call-request.dto";
import {
  labelForPreferredTime,
  labelForReason,
} from "./call-request.vocabulary";

@Injectable()
export class CallRequestService {
  constructor(
    @InjectRepository(CallRequest)
    private readonly callRequestRepository: Repository<CallRequest>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Persist first, notify second.
   *
   * The row is the record; the email is a notification about it. Emitting
   * before the insert would let a submission exist only as an email that
   * nobody can reconcile against the admin panel — and the insert is the part
   * that is allowed to fail loudly, because the visitor can retry it.
   */
  async create(dto: CreateCallRequestDto): Promise<CallRequest> {
    const preferredTimes = dto.preferredTimes?.length
      ? dto.preferredTimes
      : null;
    const notes = dto.notes?.trim() || null;

    const saved = await this.callRequestRepository.save(
      this.callRequestRepository.create({
        reason: dto.reason,
        name: dto.name.trim(),
        phone_country_code: dto.phone.countryCode,
        phone_number: dto.phone.number.trim(),
        preferred_times: preferredTimes,
        notes,
        source: dto.source,
      }),
    );

    this.emitCallRequested(saved);

    return saved;
  }

  /**
   * Fire-and-forget, exactly like the booking-request producer: `emit` returns
   * before any listener finishes, so a failing mailbox cannot turn a saved
   * request into a 500.
   *
   * Labels are resolved here rather than in the template because this is the
   * only layer that knows the form's vocabulary — the notification module
   * stays a dumb renderer of whatever the producer handed it.
   */
  private emitCallRequested(request: CallRequest): void {
    this.eventEmitter.emit(NotificationEvents.CallRequested, {
      reason: request.reason,
      reasonLabel: labelForReason(request.reason),
      name: request.name,
      phone: {
        countryCode: request.phone_country_code,
        number: request.phone_number,
      },
      preferredTimes:
        request.preferred_times?.map(labelForPreferredTime) ?? null,
      notes: request.notes,
      source: request.source,
      requestedAt: request.created_at ?? new Date(),
    } satisfies CallRequestedEvent);
  }

  /** Every request, newest first — the admin panel's read-only listing. */
  async findAll(source?: CallRequestSource): Promise<CallRequest[]> {
    return this.callRequestRepository.find({
      where: source ? { source } : {},
      order: { created_at: "DESC" },
    });
  }
}
