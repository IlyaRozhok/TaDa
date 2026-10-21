import {
  advanceLifecycle,
  contactProperties,
  cvUrl,
  dealLinkProperties,
  dealName,
  propertyUrl,
  siteBase,
  splitName,
} from "./hubspot.mapping";

describe("advanceLifecycle", () => {
  it("sets the stage on a contact without one", () => {
    expect(advanceLifecycle(null, "lead")).toBe("lead");
    expect(advanceLifecycle("", "salesqualifiedlead")).toBe("salesqualifiedlead");
  });

  it("moves forward only", () => {
    expect(advanceLifecycle("lead", "marketingqualifiedlead")).toBe("marketingqualifiedlead");
    expect(advanceLifecycle("marketingqualifiedlead", "salesqualifiedlead")).toBe("salesqualifiedlead");
  });

  it("never knocks a contact back or rewrites the same stage", () => {
    expect(advanceLifecycle("salesqualifiedlead", "lead")).toBeNull();
    expect(advanceLifecycle("salesqualifiedlead", "marketingqualifiedlead")).toBeNull();
    expect(advanceLifecycle("customer", "salesqualifiedlead")).toBeNull();
    expect(advanceLifecycle("lead", "lead")).toBeNull();
  });

  it("leaves a stage it does not know alone", () => {
    expect(advanceLifecycle("other", "lead")).toBeNull();
    expect(advanceLifecycle("1234567", "salesqualifiedlead")).toBeNull();
  });
});

describe("contactProperties", () => {
  const all = new Set(["tada_nationality", "tada_source", "tada_cv_url", "tada_signup_date"]);
  const facts = {
    email: " Jane@Example.com ",
    firstName: "Jane",
    lastName: "Doe",
    phone: "+447123456789",
    nationality: "Canada",
    source: "tenant",
    cvUrl: "https://ta-da.co/cv/abc",
    signupDate: new Date("2026-10-19T12:30:00Z"),
  };

  it("maps every fact, the email lower-cased, the date as YYYY-MM-DD", () => {
    expect(contactProperties(facts, all)).toEqual({
      email: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      phone: "+447123456789",
      tada_nationality: "Canada",
      tada_source: "tenant",
      tada_cv_url: "https://ta-da.co/cv/abc",
      tada_signup_date: "2026-10-19",
    });
  });

  it("leaves out custom properties the portal does not have", () => {
    expect(contactProperties(facts, new Set(["tada_source"]))).toEqual({
      email: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      phone: "+447123456789",
      tada_source: "tenant",
    });
  });

  it("never sends an empty value that would blank a field", () => {
    expect(contactProperties({ email: "a@b.co", firstName: " ", lastName: null, phone: "" }, all)).toEqual({
      email: "a@b.co",
    });
  });
});

describe("helpers", () => {
  it("splits a full name", () => {
    expect(splitName("Jane Mary Doe")).toEqual({ first: "Jane", last: "Mary Doe" });
    expect(splitName("  Jane ")).toEqual({ first: "Jane", last: "" });
    expect(splitName(null)).toEqual({ first: "", last: "" });
  });

  it("builds the public CV link, never without a share id", () => {
    expect(cvUrl("abc-123")).toBe("https://ta-da.co/cv/abc-123");
    expect(cvUrl(null)).toBeNull();
  });

  it("names booking deals by contact and property", () => {
    expect(dealName("Jane Doe", "Flat 2B")).toBe("Jane Doe — Booking: Flat 2B");
    expect(dealName(" ", null)).toBe("Unknown contact — Booking: property");
  });
});

describe("deal links", () => {
  it("builds the public CV and property URLs on the given site", () => {
    expect(siteBase("https://stage.ta-da.co/")).toBe("https://stage.ta-da.co");
    expect(siteBase(undefined)).toBe("https://ta-da.co");
    expect(cvUrl("abc", "https://stage.ta-da.co")).toBe("https://stage.ta-da.co/cv/abc");
    expect(propertyUrl("p-1")).toBe("https://ta-da.co/app/properties/p-1");
    expect(propertyUrl(null)).toBeNull();
  });

  it("sends only links that have a value and exist in the portal", () => {
    const links = { cvUrl: "https://ta-da.co/cv/abc", propertyUrl: "https://ta-da.co/app/properties/p-1" };
    expect(dealLinkProperties(links, new Set(["tada_cv_url", "tada_property_url"]))).toEqual({
      tada_cv_url: links.cvUrl,
      tada_property_url: links.propertyUrl,
    });
    expect(dealLinkProperties(links, new Set(["tada_property_url"]))).toEqual({ tada_property_url: links.propertyUrl });
    expect(dealLinkProperties({ cvUrl: null }, new Set(["tada_cv_url"]))).toEqual({});
  });
});
