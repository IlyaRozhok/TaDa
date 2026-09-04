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
  EMAIL_CONTACT_METHOD,
  labelForContactMethod,
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
    const preferredTime = dto.preferredTime?.trim() || null;
    const notes = dto.notes?.trim() || null;

    // Exactly one contact channel is stored, chosen by the method rather than
    // by what the payload happens to carry: a client that left a stale phone
    // behind when the visitor switched to email must not have it persisted.
    const wantsEmail = dto.contactMethod === EMAIL_CONTACT_METHOD;

    const saved = await this.callRequestRepository.save(
      this.callRequestRepository.create({
        reason: dto.reason,
        name: dto.name.trim(),
        contact_method: dto.contactMethod,
        phone_country_code: wantsEmail ? null : (dto.phone?.countryCode ?? null),
        phone_number: wantsEmail ? null : (dto.phone?.number.trim() ?? null),
        email: wantsEmail ? (dto.email?.trim() ?? null) : null,
        preferred_time: preferredTime,
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
      contactMethod: request.contact_method,
      contactMethodLabel: labelForContactMethod(request.contact_method),
      // Whichever channel the row actually carries. The template renders one
      // line or the other; the notification service keys its dedupe off the
      // same value, so both read the same fact.
      phone:
        request.phone_country_code && request.phone_number
          ? {
              countryCode: request.phone_country_code,
              number: request.phone_number,
            }
          : null,
      email: request.email,
      preferredTime: request.preferred_time,
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
