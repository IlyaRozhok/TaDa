import { toPreferencesEntityPartial } from "./preferences.mapper";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

describe("toPreferencesEntityPartial", () => {
  it("parses provided dates into Date instances", () => {
    const data = toPreferencesEntityPartial({
      move_in_date: "2026-09-01",
      move_out_date: "2027-03-01",
    } as UpdatePreferencesDto);

    expect(data.move_in_date).toEqual(new Date("2026-09-01"));
    expect(data.move_out_date).toEqual(new Date("2027-03-01"));
  });

  it("maps an explicit null date to null so the column can be cleared", () => {
    const data = toPreferencesEntityPartial({
      move_in_date: null,
      move_out_date: null,
    } as unknown as UpdatePreferencesDto);

    // null, NOT undefined — TypeORM drops undefined from the UPDATE, which
    // made a stored date impossible to remove.
    expect(data.move_in_date).toBeNull();
    expect(data.move_out_date).toBeNull();
  });

  it("omits date keys that were not provided, leaving stored values alone", () => {
    const data = toPreferencesEntityPartial({
      min_price: 1000,
    } as UpdatePreferencesDto);

    expect("move_in_date" in data).toBe(false);
    expect("move_out_date" in data).toBe(false);
  });

  it("drops a move-out equal to move-in without clearing the stored one", () => {
    const data = toPreferencesEntityPartial({
      move_in_date: "2026-09-01",
      move_out_date: "2026-09-01",
    } as UpdatePreferencesDto);

    expect(data.move_in_date).toEqual(new Date("2026-09-01"));
    expect("move_out_date" in data).toBe(false);
  });
});
