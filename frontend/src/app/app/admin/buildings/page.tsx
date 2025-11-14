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
        // Handle media files - prioritize uploaded files, then existing files, but don't send empty strings
        ...(uploadResult.uploadedUrls.logo
          ? { logo: uploadResult.uploadedUrls.logo }
          : formData.logo && formData.logo.trim()
          ? { logo: formData.logo }
          : { logo: null }),
        ...(uploadResult.uploadedUrls.video
          ? { video: uploadResult.uploadedUrls.video }
          : formData.video && formData.video.trim()
          ? { video: formData.video }
          : { video: null }),
        ...(uploadResult.uploadedUrls.photos.length > 0 ||
        (formData.photos && formData.photos.length > 0)
          ? {
              photos: [
                ...(formData.photos || []),
                ...uploadResult.uploadedUrls.photos,
              ],
            }
          : { photos: [] }),
        ...(uploadResult.uploadedUrls.documents
          ? { documents: uploadResult.uploadedUrls.documents }
          : formData.documents && formData.documents.trim()
          ? { documents: formData.documents }
          : { documents: null }),
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

  return (
    <SimpleDashboardRouter requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
        <UniversalHeader />

        <div className="flex">
          {renderSidebar()}
          <div className="flex-1 p-6 sm:p-8 bg-slate-50">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Buildings Management
                </h1>
                <p className="text-gray-600">
                  Manage residential buildings and complexes
                </p>
              </div>

              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Building
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search buildings by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Buildings List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading buildings...</p>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No buildings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuildings.map((building) => (
                  <div
                    key={building.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {building.photos && building.photos.length > 0 ? (
                        <img
                          src={building.photos[0]}
                          alt={building.name}
                          className="w-full h-full object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <div className="text-center">
                            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No photo</p>
                          </div>
                        </div>
                      )}
                      {building.logo && (
                        <div className="absolute top-2 left-2 w-12 h-12 bg-white rounded-full p-1 shadow-md">
                          <img
                            src={building.logo}
                            alt={`${building.name} logo`}
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                      )}
                      {building.video && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          Video
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {building.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {building.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span>{building.number_of_units} units</span>
                        <span className="capitalize">
                          {building.type_of_unit}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {building.tenant_type}
                        </span>
                        {building.is_concierge && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            Concierge
                          </span>
                        )}
                        {building.pet_policy && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            Pet Friendly
                          </span>
                        )}
                        {building.smoking_area && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                            Smoking Area
                          </span>
                        )}
                        {building.amenities &&
                          building.amenities.length > 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {building.amenities.length} amenit
                              {building.amenities.length === 1 ? "y" : "ies"}
                            </span>
                          )}
                        {building.photos.length > 0 && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                            {building.photos.length} photo
                            {building.photos.length === 1 ? "" : "s"}
                          </span>
                        )}
                        {building.logo && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            Logo
                          </span>
                        )}
                        {building.video && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            Video
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(building)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(building)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(building.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && viewingBuilding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {viewingBuilding.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {viewingBuilding.address}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Media Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photos */}
                  {viewingBuilding.photos &&
                    viewingBuilding.photos.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Photos ({viewingBuilding.photos.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {viewingBuilding.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-contain rounded-lg border border-gray-200 bg-gray-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Video */}
                  {viewingBuilding.video && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Video
                      </h3>
                      <video
                        src={viewingBuilding.video}
                        controls
                        className="w-full rounded-lg border border-gray-200"
                        style={{ maxHeight: "200px" }}
                      />
                    </div>
                  )}
                </div>

                {/* Documents */}
                {viewingBuilding.documents && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Documents
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Building Document
                          </p>
                          <p className="text-sm text-gray-600">PDF Document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (viewingBuilding.documents) {
                            // Try to open in new tab
                            const newWindow = window.open(
                              viewingBuilding.documents,
                              "_blank",
                              "noopener,noreferrer"
                            );
                            if (!newWindow) {
                              // Fallback: try to download
                              const link = document.createElement("a");
                              link.href = viewingBuilding.documents;
                              link.download = "building-document.pdf";
                              link.target = "_blank";
                              link.rel = "noopener,noreferrer";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Open PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Building Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Building Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Units:</span>
                        <span className="font-medium text-black">
                          {viewingBuilding.number_of_units}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Type:</span>
                        <span className="font-medium capitalize text-black">
                          {viewingBuilding.type_of_unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tenant Type:</span>
                        <span className="font-medium capitalize text-black">
                          {viewingBuilding.tenant_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Features
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            viewingBuilding.is_concierge
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-sm ${
                            viewingBuilding.is_concierge
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          Concierge
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            viewingBuilding.pet_policy
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-sm ${
                            viewingBuilding.pet_policy
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          Pet Friendly
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            viewingBuilding.smoking_area
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={`text-sm ${
                            viewingBuilding.smoking_area
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          Smoking Area
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {viewingBuilding.amenities &&
                  viewingBuilding.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Amenities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingBuilding.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Transport */}
                {(viewingBuilding.metro_stations?.length > 0 ||
                  viewingBuilding.commute_times?.length > 0 ||
                  viewingBuilding.local_essentials?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Location & Transport
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {viewingBuilding.metro_stations
                        ?.slice(0, 2)
                        .map((station, index) => (
                          <div
                            key={index}
                            className="text-center p-3 bg-blue-50 rounded-lg"
                          >
                            <div className="text-sm text-gray-600">Metro</div>
                            <div className="font-medium text-blue-700">
                              {station.label}
                            </div>
                            <div className="text-xs text-blue-600">
                              {station.destination} min
                            </div>
                          </div>
                        ))}
                      {viewingBuilding.commute_times
                        ?.slice(0, 2)
                        .map((time, index) => (
                          <div
                            key={index}
                            className="text-center p-3 bg-purple-50 rounded-lg"
                          >
                            <div className="text-sm text-gray-600">Commute</div>
                            <div className="font-medium text-purple-700">
                              {time.label}
                            </div>
                            <div className="text-xs text-purple-600">
                              {time.destination} min
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingBuilding);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Building
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBuilding ? "Edit Building" : "Create Building"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Units *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.number_of_units}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          number_of_units: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Type *
                    </label>
                    <select
                      required
                      value={formData.type_of_unit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type_of_unit: e.target
                            .value as Building["type_of_unit"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="studio">Studio</option>
                      <option value="1-bed">1 Bed</option>
                      <option value="2-bed">2 Bed</option>
                      <option value="3-bed">3 Bed</option>
                      <option value="Duplex">Duplex</option>
                      <option value="penthouse">Penthouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant Type *
                    </label>
                    <select
                      required
                      value={formData.tenant_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tenant_type: e.target
                            .value as Building["tenant_type"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="family">Family</option>
                      <option value="corporateLets">Corporate Lets</option>
                      <option value="sharers">Sharers</option>
                      <option value="student">Student</option>
                      <option value="elder">Elder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operator *
                    </label>
                    <select
                      required
                      value={formData.operator_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operator_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select Operator</option>
                      {operators.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.operatorProfile?.full_name ||
                            op.operatorProfile?.company_name ||
                            op.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Image)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLogoFile(file);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      Selecting a new logo will replace the current one
                    </p>
                    {logoFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {logoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogoFile(null)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {formData.logo && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Current logo:
                          </span>
                          <img
                            src={formData.logo}
                            alt="Current logo"
                            className="w-8 h-8 object-cover rounded"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, logo: "" }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove current logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video (Single file)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVideoFile(file);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      Selecting a new video will replace the current one
                    </p>
                    {videoFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {videoFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoFile(null)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {formData.video && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Current video:
                          </span>
                          <video
                            src={formData.video}
                            className="w-16 h-9 object-cover rounded"
                            controls={false}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, video: "" }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove current video"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setPhotoFiles((prev) => [...prev, ...files]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      Select multiple photos - they will be added to existing
                      ones
                    </p>
                    {photoFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {photoFiles.length} photo
                            {photoFiles.length > 1 ? "s" : ""} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setPhotoFiles([])}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                          {photoFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="text-sm text-gray-600 truncate">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.photos && formData.photos.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm text-gray-600">
                          Current photos ({formData.photos.length}):
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          {formData.photos.map((photoUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photoUrl}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-gray-50"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData((prev) => ({
                                    ...prev,
                                    photos: prev.photos.filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documents (PDF files)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setDocumentFiles((prev) => [...prev, ...files]);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      Select multiple PDF files - they will be added to existing
                      ones
                    </p>
                    {documentFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {documentFiles.length} PDF file
                            {documentFiles.length > 1 ? "s" : ""} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setDocumentFiles([])}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                          {documentFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="text-sm text-gray-600 truncate">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDocumentFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.documents && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Current document:
                          </span>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-700">
                              PDF Document
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, documents: "" }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove current document"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metro Stations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Metro Stations
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem("metro_stations")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Station
                    </button>
                  </div>
                  {formData.metro_stations.map((station, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Station name"
                        value={station.label}
                        onChange={(e) => {
                          const newStations = [...formData.metro_stations];
                          newStations[idx].label = e.target.value;
                          setFormData({
                            ...formData,
                            metro_stations: newStations,
                          });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Minutes"
                          min="0"
                          value={station.destination}
                          onChange={(e) => {
                            const newStations = [...formData.metro_stations];
                            newStations[idx].destination =
                              parseInt(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              metro_stations: newStations,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem("metro_stations", idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commute Times */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Commute Times
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem("commute_times")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Destination
                    </button>
                  </div>
                  {formData.commute_times.map((time, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Destination"
                        value={time.label}
                        onChange={(e) => {
                          const newTimes = [...formData.commute_times];
                          newTimes[idx].label = e.target.value;
                          setFormData({ ...formData, commute_times: newTimes });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Minutes"
                          min="0"
                          value={time.destination}
                          onChange={(e) => {
                            const newTimes = [...formData.commute_times];
                            newTimes[idx].destination =
                              parseInt(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              commute_times: newTimes,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem("commute_times", idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local Essentials */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Local Essentials
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem("local_essentials")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Place
                    </button>
                  </div>
                  {formData.local_essentials.map((essential, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Place name"
                        value={essential.label}
                        onChange={(e) => {
                          const newEssentials = [...formData.local_essentials];
                          newEssentials[idx].label = e.target.value;
                          setFormData({
                            ...formData,
                            local_essentials: newEssentials,
                          });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Meters"
                          min="0"
                          value={essential.destination}
                          onChange={(e) => {
                            const newEssentials = [
                              ...formData.local_essentials,
                            ];
                            newEssentials[idx].destination =
                              parseInt(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              local_essentials: newEssentials,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem("local_essentials", idx)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES_LIST.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                amenities: [...formData.amenities, amenity],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                amenities: formData.amenities.filter(
                                  (a) => a !== amenity
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`amenity-${amenity}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Amenities */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_concierge"
                      checked={formData.is_concierge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_concierge: e.target.checked,
                          concierge_hours: e.target.checked
                            ? formData.concierge_hours || { from: 8, to: 22 }
                            : null,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="is_concierge"
                      className="text-sm font-medium text-gray-700"
                    >
                      Concierge Service
                    </label>
                  </div>

                  {formData.is_concierge && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Opening Hour
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={formData.concierge_hours?.from || 8}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              concierge_hours: {
                                ...formData.concierge_hours!,
                                from: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Closing Hour
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={formData.concierge_hours?.to || 22}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              concierge_hours: {
                                ...formData.concierge_hours!,
                                to: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pet_policy"
                      checked={formData.pet_policy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pet_policy: e.target.checked,
                          pets: e.target.checked ? formData.pets || [] : null,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="pet_policy"
                      className="text-sm font-medium text-gray-700"
                    >
                      Pets Allowed
                    </label>
                  </div>

                  {formData.pet_policy && (
                    <div className="pl-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-600">
                          Allowed Pets
                        </label>
                        <button
                          type="button"
                          onClick={() => addArrayItem("pets")}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Pet
                        </button>
                      </div>
                      {(formData.pets || []).map((pet, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <select
                            value={pet.type}
                            onChange={(e) => {
                              const newPets = [...(formData.pets || [])];
                              newPets[idx].type = e.target.value as Pet["type"];
                              // Clear customType when switching away from "other"
                              if (e.target.value !== "other") {
                                delete newPets[idx].customType;
                              }
                              setFormData({ ...formData, pets: newPets });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          >
                            <option value="dog">Dog</option>
                            <option value="cat">Cat</option>
                            <option value="other">Other</option>
                          </select>

                          {pet.type === "other" ? (
                            <input
                              type="text"
                              placeholder="Enter pet type"
                              required
                              value={pet.customType || ""}
                              onChange={(e) => {
                                const newPets = [...(formData.pets || [])];
                                newPets[idx].customType = e.target.value;
                                setFormData({ ...formData, pets: newPets });
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 flex-1"
                            />
                          ) : (
                            <select
                              value={pet.size || "small"}
                              onChange={(e) => {
                                const newPets = [...(formData.pets || [])];
                                newPets[idx].size = e.target
                                  .value as Pet["size"];
                                setFormData({ ...formData, pets: newPets });
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => removeArrayItem("pets", idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smoking_area"
                      checked={formData.smoking_area}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          smoking_area: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="smoking_area"
                      className="text-sm font-medium text-gray-700"
                    >
                      Smoking Area
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      uploading.logo ||
                      uploading.video ||
                      uploading.photos ||
                      uploading.documents
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {uploading.logo ||
                    uploading.video ||
                    uploading.photos ||
                    uploading.documents
                      ? "Uploading Files..."
                      : editingBuilding
                      ? "Update"
                      : "Create"}{" "}
                    Building
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SimpleDashboardRouter>
  );
}
