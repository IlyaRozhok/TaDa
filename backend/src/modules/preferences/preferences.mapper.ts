import { CreatePreferencesDto } from "./dto/create-preferences.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { Preferences } from "../../entities/preferences.entity";

type PreferencesDto = CreatePreferencesDto | UpdatePreferencesDto;

export const toPreferencesEntityPartial = (
  dto: PreferencesDto
): Partial<Preferences> => {
  const { move_in_date, move_out_date, ...rest } = dto;
  const data: Partial<Preferences> = { ...rest };

  // An explicitly provided empty date means "clear it" and must map to `null`:
  // TypeORM's save() silently skips `undefined`, so mapping the clear to
  // undefined made the stored date impossible to remove.
  if (move_in_date) {
    data.move_in_date = new Date(move_in_date);
  } else if (Object.prototype.hasOwnProperty.call(dto, "move_in_date")) {
    data.move_in_date = null;
  }

  if (move_out_date) {
    data.move_out_date = new Date(move_out_date);
  } else if (Object.prototype.hasOwnProperty.call(dto, "move_out_date")) {
    data.move_out_date = null;
  }

  // A move-out equal to move-in is a UI artifact, not a real end date. Dropping
  // the key (rather than writing null) leaves any stored move_out_date alone.
  if (
    data.move_in_date &&
    data.move_out_date &&
    data.move_in_date instanceof Date &&
    data.move_out_date instanceof Date &&
    data.move_in_date.getTime() === data.move_out_date.getTime()
  ) {
    delete data.move_out_date;
  }

  return data;
};
