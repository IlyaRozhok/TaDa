export class BookingRequestCreatedEvent {
  constructor(
    public readonly requestId: string,
    public readonly tenantEmail: string,
    public readonly tenantName: string | null,
    public readonly propertyId: string,
    public readonly propertyTitle: string | null,
    public readonly dateFrom: string | null,
    public readonly dateTo: string | null,
  ) {}
}
