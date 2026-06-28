export class TenantCvSharedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
    public readonly shareUuid: string,
  ) {}
}
