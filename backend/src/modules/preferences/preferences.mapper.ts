import { CreatePreferencesDto } from "./dto/create-preferences.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { Preferences } from "../../entities/preferences.entity";

type PreferencesDto = CreatePreferencesDto | UpdatePreferencesDto;

export const toPreferencesEntityPartial = (
  dto: PreferencesDto
): Partial<Preferences> => {
  const { move_in_date, move_out_date, ...rest } = dto;
  const data: Partial<Preferences> = { ...rest };

  if (move_in_date) {
    data.move_in_date = new Date(move_in_date);
  } else if (Object.prototype.hasOwnProperty.call(dto, "move_in_date")) {
    data.move_in_date = move_in_date === null ? null : undefined;
  }

  if (move_out_date) {
    data.move_out_date = new Date(move_out_date);
  } else if (Object.prototype.hasOwnProperty.call(dto, "move_out_date")) {
    data.move_out_date = move_out_date === null ? null : undefined;
  }

  if (
    data.move_in_date &&
    data.move_out_date &&
    data.move_in_date instanceof Date &&
    data.move_out_date instanceof Date &&
    data.move_in_date.getTime() === data.move_out_date.getTime()
  ) {
    data.move_out_date = null;
  }

  return data;
};
