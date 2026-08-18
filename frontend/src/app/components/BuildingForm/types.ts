import type { Building as ApiBuilding } from "@/store/api/buildings.api";

export interface MetroStation {
  label: string;
  destination?: number;
}

export interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

/**
 * Narrower than `AdminUser` from `@/store/api/users.api`: the dropdown reads
 * `operatorProfile`, which the wire may carry but the admin type does not
 * declare. Kept local for that one optional field.
 */
export interface Operator {
  id: string;
  full_name?: string;
  email: string;
  operatorProfile?: {
    company_name?: string;
    full_name?: string;
  };
}

export interface BuildingFormData {
  name: string;
  description: string;
  address: string;
  number_of_units: number | null;
  type_of_unit: string[];
  logo: string;
  video: string;
  photos: string[];
  documents: string;
  metro_stations: MetroStation[];
  areas: string[];
  districts: string[];
  amenities: string[];
  pet_policy: boolean;
  pets: Pet[] | null;
  tenant_type: string[];
  family_status: string[];
  occupation: string[];
  children: string[];
  operator_id: string | null;
}

/** What `uploadAllFiles` resolves to: the uploaded URLs plus an error flag. */
export interface BuildingUploadResult {
  uploadedUrls: {
    logo: string;
    video: string;
    photos: string[];
    documents: string;
  };
  hasErrors: boolean;
}

/**
 * Edit-mode tracking of existing media the user marked for removal. Create
 * mode has nothing to remove, so its payload builder ignores this argument.
 */
export interface EditMediaState {
  removedPhotos: string[];
  removedLogo: boolean;
  removedVideo: boolean;
  removedDocuments: boolean;
}

export interface BuildingFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** The parent owns the RTK mutation; the form hands it the built payload. */
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
  /** The building being edited; prefills the form in edit mode. */
  building?: ApiBuilding | null;
  /** Mode-specific payload builder, supplied by the thin modal wrapper. */
  buildPayload: (
    formData: BuildingFormData,
    uploadResult: BuildingUploadResult,
    media: EditMediaState,
  ) => any;
}
