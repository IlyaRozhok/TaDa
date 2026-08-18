import {
  ACCESS_TOKEN_TTL_DEFAULT,
  REFRESH_TOKEN_TTL_DEFAULT,
  accessTokenTtl,
  refreshTokenTtl,
  resolveTokenTtl,
  ttlToMs,
} from "./auth-tokens.config";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

describe("ttlToMs", () => {
  it("converts every unit the app accepts", () => {
    expect(ttlToMs("500ms")).toBe(500);
    expect(ttlToMs("30s")).toBe(30 * 1000);
    expect(ttlToMs("15m")).toBe(15 * MINUTE);
    expect(ttlToMs("12h")).toBe(12 * 60 * MINUTE);
    expect(ttlToMs("30d")).toBe(30 * DAY);
    expect(ttlToMs("2w")).toBe(14 * DAY);
  });

  it("reads a bare number as seconds, the way jsonwebtoken does", () => {
    expect(ttlToMs("3600")).toBe(3600 * 1000);
  });

  it("rejects a value it cannot turn into a lifetime", () => {
    expect(() => ttlToMs("soon")).toThrow();
    expect(() => ttlToMs("15 minutes")).toThrow();
    expect(() => ttlToMs("")).toThrow();
  });
});

describe("resolveTokenTtl", () => {
  it("takes the environment value and keeps the millisecond form in step", () => {
    expect(resolveTokenTtl("45m", ACCESS_TOKEN_TTL_DEFAULT)).toEqual({
      value: "45m",
      ms: 45 * MINUTE,
    });
  });

  it("falls back to the default when the variable is absent or blank", () => {
    const expected = { value: "30d", ms: 30 * DAY };

    expect(resolveTokenTtl(undefined, REFRESH_TOKEN_TTL_DEFAULT)).toEqual(expected);
    expect(resolveTokenTtl("   ", REFRESH_TOKEN_TTL_DEFAULT)).toEqual(expected);
  });

  it("ignores an unparseable value rather than letting it break signing", () => {
    expect(resolveTokenTtl("thirty days", REFRESH_TOKEN_TTL_DEFAULT)).toEqual({
      value: "30d",
      ms: 30 * DAY,
    });
  });
});

describe("token lifetimes from the environment", () => {
  const saved = {
    access: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh: process.env.JWT_REFRESH_EXPIRES_IN,
  };

  afterEach(() => {
    process.env.JWT_ACCESS_EXPIRES_IN = saved.access;
    process.env.JWT_REFRESH_EXPIRES_IN = saved.refresh;
  });

  it("works on a host that sets neither variable", () => {
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;

    expect(accessTokenTtl()).toEqual({ value: "15m", ms: 15 * MINUTE });
    expect(refreshTokenTtl()).toEqual({ value: "30d", ms: 30 * DAY });
  });

  it("lets a host shorten or lengthen either lifetime", () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "10s";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";

    expect(accessTokenTtl()).toEqual({ value: "10s", ms: 10 * 1000 });
    expect(refreshTokenTtl()).toEqual({ value: "7d", ms: 7 * DAY });
  });
});
