import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HUBSPOT_API_BASE, HUBSPOT_TIMEOUT_MS, readHubspotConfig } from "./hubspot.config";

/** A non-2xx answer from HubSpot. The body is kept short: it is logged. */
export class HubspotApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    method: string,
    path: string,
  ) {
    super(`HubSpot ${method} ${path} → ${status}: ${body.slice(0, 500)}`);
  }
}

export interface HubspotContact {
  id: string;
  properties: Record<string, string | null>;
}

/** The CRM objects the sync gives custom properties to. */
export type HubspotObjectType = "contacts" | "deals";

export interface HubspotPropertyDefinition {
  name: string;
  label: string;
  type: "string" | "date";
  fieldType: "text" | "date";
  groupName: string;
  description: string;
}

export interface HubspotPipelineStage {
  id: string;
  displayOrder: number;
}

export interface HubspotPipeline {
  id: string;
  displayOrder: number;
  stages: HubspotPipelineStage[];
}

/** HubSpot's own id for the deal → contact association. */
const DEAL_TO_CONTACT_ASSOCIATION = 3;

/**
 * The few HubSpot CRM v3 calls the sync needs, over `fetch` with a timeout.
 * Every failure throws (HubspotApiError or a network/abort error): the
 * notification service records it and the retry worker tries again, so
 * nothing here ever reaches the request that caused the event.
 */
@Injectable()
export class HubspotClient {
  constructor(private readonly configService: ConfigService) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const { token } = readHubspotConfig(this.configService);
    if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");

    const response = await fetch(`${HUBSPOT_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(HUBSPOT_TIMEOUT_MS),
    });

    const text = await response.text();
    if (!response.ok) throw new HubspotApiError(response.status, text, method, path);
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** The contact with this email, or null. */
  async findContact(email: string): Promise<HubspotContact | null> {
    const result = await this.request<{ results: HubspotContact[] }>(
      "POST",
      "/crm/v3/objects/contacts/search",
      {
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        properties: ["email", "phone", "lifecyclestage"],
        limit: 1,
      },
    );
    return result.results[0] ?? null;
  }

  async createContact(properties: Record<string, string>): Promise<HubspotContact> {
    return this.request<HubspotContact>("POST", "/crm/v3/objects/contacts", { properties });
  }

  async updateContact(id: string, properties: Record<string, string>): Promise<void> {
    await this.request("PATCH", `/crm/v3/objects/contacts/${encodeURIComponent(id)}`, {
      properties,
    });
  }

  /** True if the property exists on the object; throws on 403 (no schema scope). */
  async propertyExists(objectType: HubspotObjectType, name: string): Promise<boolean> {
    try {
      await this.request("GET", `/crm/v3/properties/${objectType}/${encodeURIComponent(name)}`);
      return true;
    } catch (error) {
      if (error instanceof HubspotApiError && error.status === 404) return false;
      throw error;
    }
  }

  async createProperty(objectType: HubspotObjectType, definition: HubspotPropertyDefinition): Promise<void> {
    await this.request("POST", `/crm/v3/properties/${objectType}`, definition);
  }

  async getDealPipelines(): Promise<HubspotPipeline[]> {
    const result = await this.request<{ results: HubspotPipeline[] }>(
      "GET",
      "/crm/v3/pipelines/deals",
    );
    return result.results;
  }

  /** Creates the deal already associated with the contact; returns its id. */
  async createDeal(properties: Record<string, string>, contactId: string): Promise<string> {
    const deal = await this.request<{ id: string }>("POST", "/crm/v3/objects/deals", {
      properties,
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: DEAL_TO_CONTACT_ASSOCIATION,
            },
          ],
        },
      ],
    });
    return deal.id;
  }
}
