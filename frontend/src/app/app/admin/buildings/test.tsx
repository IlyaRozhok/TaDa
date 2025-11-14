"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";
import UniversalHeader from "../../../components/UniversalHeader";
import { buildingsAPI } from "../../../lib/api";
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Save,
  Users,
  Shield,
  FileText,
  Eye,
} from "lucide-react";

interface MetroStation {
  label: string;
  destination: number;
}

interface CommuteTime {
  label: string;
  destination: number;
}

interface LocalEssential {
  label: string;
  destination: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ConciergeHours {
  from: number;
  to: number;
}

interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

interface Building {
  id: string;
  name: string;
  address: string;
  number_of_units: number;
  type_of_unit: "studio" | "1-bed" | "2-bed" | "3-bed" | "Duplex" | "penthouse";
  logo?: string;
  video?: string;
  photos: string[];
  documents: string;
  metro_stations: MetroStation[];
  commute_times: CommuteTime[];
  local_essentials: LocalEssential[];
  amenities?: string[];
  is_concierge: boolean;
  concierge_hours?: ConciergeHours | null;
  pet_policy: boolean;
  pets?: Pet[] | null;
  smoking_area: boolean;
  tenant_type: "corporateLets" | "sharers" | "student" | "family" | "elder";
  operator_id: string;
  created_at: string;
  updated_at: string;
  operator?: {
    email: string;
    operatorProfile?: {
      full_name?: string;
      company_name?: string;
    };
  };
}

const AMENITIES_LIST = [
  "Co-working",
  "Meeting rooms",
  "Lounge",
  "Cinema",
  "Roof terrace",
  "Courtyard",
  "Parking",
  "Bike storage",
  "Parcel room",
  "SLA Maintenance",
  "Events calendar",
  "Pet areas",
  "Kids room",
  "Garden",
];

interface Operator {
  id: string;
  email: string;
  operatorProfile?: {
    full_name?: string;
    company_name?: string;
  };
}

export default function BuildingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  console.log("🏢 BuildingsPage render:", {
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role,
    currentPath: pathname,
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [viewingBuilding, setViewingBuilding] = useState<Building | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    number_of_units: number;
    type_of_unit: Building["type_of_unit"];
    logo: string;
    video: string;
    photos: string[];
    documents: string;
    metro_stations: MetroStation[];
    commute_times: CommuteTime[];
    local_essentials: LocalEssential[];
    amenities: string[];
    is_concierge: boolean;
    concierge_hours: ConciergeHours | null;
    pet_policy: boolean;
    pets: Pet[] | null;
    smoking_area: boolean;
    tenant_type: Building["tenant_type"];
    operator_id: string;
  }>({
    name: "",
    address: "",
    number_of_units: 0,
    type_of_unit: "studio" as Building["type_of_unit"],
    logo: "",
    video: "",
    photos: [],
    documents: "",
    metro_stations: [{ label: "", destination: 0 }],
    commute_times: [{ label: "", destination: 0 }],
    local_essentials: [{ label: "", destination: 0 }],
    amenities: [] as string[],
    is_concierge: false,
    concierge_hours: null as ConciergeHours | null,
    pet_policy: false,
    pets: null as Pet[] | null,
    smoking_area: false,
    tenant_type: "family" as Building["tenant_type"],
    operator_id: "",
  });

  // File upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState({
    logo: false,
    video: false,
    photos: false,
    documents: false,
  });

  useEffect(() => {
    console.log("🏢 BuildingsPage useEffect:", {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : "",
    });

    // SimpleDashboardRouter already handles authentication and role checking
    // Only fetch data when user is authenticated and is admin
    if (isAuthenticated && user && user.role === "admin") {
      console.log("✅ Fetching buildings and operators");
      fetchBuildings();
      fetchOperators();
    } else {
      console.log("⏳ Waiting for user to load or not admin:", {
        isAuthenticated,
        hasUser: !!user,
        userRole: user?.role,
      });
    }
  }, [isAuthenticated, user]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingsAPI.getAll();
      setBuildings(response.data || []);
    } catch (error: unknown) {
      toast.error("Failed to load buildings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await buildingsAPI.getOperators();
      setOperators(response.data || []);
    } catch (error: unknown) {
      console.error("Failed to load operators:", error);
    }
  };

  const handleCreate = () => {
    setEditingBuilding(null);
    setFormData({
      name: "",
      address: "",
      number_of_units: 0,
      type_of_unit: "studio",
      logo: "",
      video: "",
      photos: [],
      documents: "",
      metro_stations: [{ label: "", destination: 0 }],
      commute_times: [{ label: "", destination: 0 }],
      local_essentials: [{ label: "", destination: 0 }],
      amenities: [],
      is_concierge: false,
      concierge_hours: null,
      pet_policy: false,
      pets: null,
      smoking_area: false,
      tenant_type: "family",
      operator_id: operators[0]?.id || "",
    });
    setShowModal(true);
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      address: building.address,
      number_of_units: building.number_of_units,
      type_of_unit: building.type_of_unit,
      logo: building.logo || "",
      video: building.video || "",
      photos: building.photos || [],
      documents: building.documents,
      metro_stations:
        building.metro_stations.length > 0
          ? building.metro_stations
          : [{ label: "", destination: 0 }],
      commute_times:
        building.commute_times.length > 0
          ? building.commute_times
          : [{ label: "", destination: 0 }],
      local_essentials:
        building.local_essentials.length > 0
          ? building.local_essentials
          : [{ label: "", destination: 0 }],
      amenities: building.amenities || [],
      is_concierge: building.is_concierge,
      concierge_hours: building.concierge_hours || null,
      pet_policy: building.pet_policy,
      pets: building.pets || null,
      smoking_area: building.smoking_area,
      tenant_type: building.tenant_type,
      operator_id: building.operator_id,
    });
    setShowModal(true);
  };

  const handleView = (building: Building) => {
    setViewingBuilding(building);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this building?")) return;

    try {
      await buildingsAPI.delete(id);
      toast.success("Building deleted successfully");
      fetchBuildings();
    } catch {
      toast.error("Failed to delete building");
    }
  };

  const validateFileUploads = (): string[] => {
    // No strict validation required - files are optional
    // Users can upload files or save without them
    return [];
  };

  const uploadAllFiles = async (): Promise<{
    uploadedUrls: {
      logo: string;
      video: string;
      photos: string[];
      documents: string;
    };
    hasErrors: boolean;
  }> => {
    const uploadPromises = [];
    const errors: string[] = [];
    const uploadedUrls = {
      logo: "",
      video: "",
      photos: [] as string[],
      documents: "",
    };

    // Upload logo if selected
    if (logoFile) {
      uploadPromises.push(
        buildingsAPI
          .uploadLogo(logoFile)
          .then((results: { url: string; key: string }) => {
            uploadedUrls.logo = results.url;
            setLogoFile(null);
            console.log("✅ Logo uploaded successfully");
          })
          .catch((error: unknown) => {
            console.error("❌ Logo upload failed:", error);
            const apiError = error as ApiError;
            const message =
              apiError.response?.data?.message ||
              apiError.message ||
              "Unknown error";
            errors.push(`Logo upload failed: ${message}`);
          })
      );
    }

    // Upload video if selected
    if (videoFile) {
      uploadPromises.push(
        buildingsAPI
          .uploadVideo(videoFile)
          .then((results: { url: string; key: string }) => {
            uploadedUrls.video = results.url;
            setVideoFile(null);
            console.log("✅ Video uploaded successfully");
          })
          .catch((error: unknown) => {
            console.error("❌ Video upload failed:", error);
            const apiError = error as ApiError;
            const message =
              apiError.response?.data?.message ||
              apiError.message ||
              "Unknown error";
            errors.push(`Video upload failed: ${message}`);
          })
      );
    }

    // Upload photos if selected
    if (photoFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadPhotos(photoFiles)
          .then((results: { url: string; key: string }[]) => {
            const newUrls = results.map((result) => result.url);
            uploadedUrls.photos = [...uploadedUrls.photos, ...newUrls];
            setPhotoFiles([]);
            console.log(`✅ ${results.length} photos uploaded successfully`);
          })
          .catch((error: unknown) => {
            console.error("❌ Photos upload failed:", error);
            const apiError = error as ApiError;
            const message =
              apiError.response?.data?.message ||
              apiError.message ||
              "Unknown error";
            errors.push(`Photos upload failed: ${message}`);
          })
      );
    }

    // Upload documents if selected
    if (documentFiles.length > 0) {
      uploadPromises.push(
        buildingsAPI
          .uploadDocuments(documentFiles)
          .then((results: { url: string; key: string }[]) => {
            if (results && results.length > 0) {
              uploadedUrls.documents = results[0].url;
            }
            setDocumentFiles([]);
            console.log(`✅ ${results.length} documents uploaded successfully`);
          })
          .catch((error: unknown) => {
            console.error("❌ Documents upload failed:", error);
            const apiError = error as ApiError;
            const message =
              apiError.response?.data?.message ||
              apiError.message ||
              "Unknown error";
            errors.push(`Documents upload failed: ${message}`);
          })
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.allSettled(uploadPromises);

      // Show errors if any occurred
      if (errors.length > 0) {
        console.error("Upload errors:", errors);
        toast.error(`Some uploads failed: ${errors.join("; ")}`);
      }
    }

    return {
      uploadedUrls,
      hasErrors: errors.length > 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate file uploads
      const fileErrors = validateFileUploads();
      if (fileErrors.length > 0) {
        toast.error(fileErrors.join(". "));
        return;
      }

      // Upload all selected files first
      setUploading({
        logo: !!logoFile,
        video: !!videoFile,
        photos: photoFiles.length > 0,
        documents: documentFiles.length > 0,
      });
      const uploadResult = await uploadAllFiles();
      setUploading({
        logo: false,
        video: false,
        photos: false,
        documents: false,
      });

      // If uploads failed but user wants to continue, show warning
      if (uploadResult.hasErrors) {
        const shouldContinue = confirm(
          "Some file uploads failed. Do you want to continue saving the building with the successfully uploaded files?"
        );
        if (!shouldContinue) {
          return;
        }
      }

      // Filter out empty metro stations, commute times, and local essentials
      const cleanedData = {
        ...formData,
        // Use uploaded media URLs, falling back to form data
        logo: uploadResult.uploadedUrls.logo || formData.logo || undefined,
        video: uploadResult.uploadedUrls.video || formData.video || undefined,
        photos:
          uploadResult.uploadedUrls.photos.length > 0
            ? uploadResult.uploadedUrls.photos
            : formData.photos.length > 0
            ? formData.photos
            : undefined,
        documents:
          uploadResult.uploadedUrls.documents ||
          formData.documents ||
          undefined,
        metro_stations: formData.metro_stations.filter(
          (m) => m.label.trim() !== ""
        ),
        commute_times: formData.commute_times.filter(
          (c) => c.label.trim() !== ""
        ),
        local_essentials: formData.local_essentials.filter(
          (l) => l.label.trim() !== ""
        ),
      };

      if (editingBuilding) {
        await buildingsAPI.update(editingBuilding.id, cleanedData);
        toast.success("Building updated successfully");
      } else {
        await buildingsAPI.create(cleanedData);
        toast.success("Building created successfully");
      }

      setShowModal(false);
      fetchBuildings();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const message =
        apiError.response?.data?.message || "Failed to save building";
      toast.error(message);
    }
  };

  const addArrayItem = (
    field:
      | "metro_stations"
      | "commute_times"
      | "local_essentials"
      | "photos"
      | "pets"
  ) => {
    if (field === "photos") {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ""],
      }));
    } else if (field === "pets") {
      setFormData((prev) => ({
        ...prev,
        pets: [...(prev.pets || []), { type: "dog", size: "small" }],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], { label: "", destination: 0 }],
      }));
    }
  };

  const removeArrayItem = (
    field:
      | "metro_stations"
      | "commute_times"
      | "local_essentials"
      | "photos"
      | "pets",
    index: number
  ) => {
    if (field === "photos") {
      setFormData((prev) => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      }));
    } else if (field === "pets") {
      setFormData((prev) => ({
        ...prev,
        pets: (prev.pets || []).filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const filteredBuildings = buildings.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSidebar = () => {
    const isBuildingsPage = pathname === "/app/admin/buildings";

    return (
      <div className="w-64 bg-white border-r border-slate-200 min-h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Admin Panel
              </h2>
              <p className="text-sm text-slate-600">System Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-50"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Users</span>
            </button>
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-50"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Properties</span>
            </button>
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-50"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">RS Properties</span>
            </button>
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-50"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Operators</span>
            </button>
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-50"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Res. Complexes</span>
            </button>
            <button
              onClick={() => router.push("/app/admin/buildings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isBuildingsPage
                  ? "bg-violet-50 text-violet-700 border border-violet-200"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Buildings (New)</span>
            </button>
          </nav>
        </div>
      </div>
    );
  };
  );
}
