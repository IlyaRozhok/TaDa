import { isValidPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("stores every formatting of the same UK number as one E.164 value", () => {
    for (const input of [
      "+447041230790",
      "+44 70 4123 0790",
      "+44 (0)7041 230790",
      " +447041 230790 ",
    ]) {
      expect(normalizePhone(input)).toBe("+447041230790");
    }
  });

  it("reads a national number in the given country, trunk 0 dropped", () => {
    expect(normalizePhone("07041230790", "GB")).toBe("+447041230790");
    expect(normalizePhone("07911 123456", "gb")).toBe("+447911123456");
    expect(normalizePhone("015123456789", "DE")).toBe("+4915123456789");
  });

  it("returns null for a blank value", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });

  it("keeps an unparseable value rather than dropping it", () => {
    expect(normalizePhone(" +447041 23079 ")).toBe("+447041 23079");
  });
});

describe("isValidPhone", () => {
  it("accepts complete international numbers", () => {
    expect(isValidPhone("+447911123456")).toBe(true);
    expect(isValidPhone("+12015550123")).toBe(true);
  });

  it("rejects truncated, short, junk and non-string values", () => {
    expect(isValidPhone("+447041 23079")).toBe(false);
    expect(isValidPhone("+44123")).toBe(false);
    expect(isValidPhone("not a phone")).toBe(false);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone(447911123456)).toBe(false);
  });

  it("needs a country for a national number", () => {
    expect(isValidPhone("07911123456")).toBe(false);
    expect(isValidPhone("07911123456", "GB")).toBe(true);
    expect(isValidPhone("07911123456", "XX")).toBe(false);
  });
});
