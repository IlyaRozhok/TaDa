"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertiesAPI } from "../../../lib/api";
import { Property } from "../../../types";
import TenantUniversalHeader from "../../../components/TenantUniversalHeader";
import EnhancedPropertyCard from "../../../components/EnhancedPropertyCard";
import { MapPin, Phone, Globe, Mail } from "lucide-react";
import { useDebounce } from "../../../hooks/useDebounce";
import toast from "react-hot-toast";

export default function OperatorPropertiesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [operator, setOperator] = useState<{
    id: string;
    full_name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter properties based on search term
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter((property) => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
          property.title?.toLowerCase().includes(searchLower) ||
          property.address?.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower) ||
          property.property_type?.toLowerCase().includes(searchLower) ||
          property.furnishing?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredProperties(filtered);
    }
  }, [properties, debouncedSearchTerm]);

  useEffect(() => {
    const fetchOperatorProperties = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await propertiesAPI.getAllPublic();

        // Handle API response format
        let allProperties = [];
        if (response.data && response.data.data) {
          allProperties = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          allProperties = response.data;
        }

        // Filter properties by operator
        const operatorProperties = allProperties.filter(
          (prop: Property) => prop.operator?.id === id
        );

        if (operatorProperties.length > 0) {
          setOperator(operatorProperties[0].operator);
          setProperties(operatorProperties);
          setFilteredProperties(operatorProperties);
        } else {
          setError("No properties found for this operator");
        }
      } catch (err) {
        console.error("Error fetching operator properties:", err);
        setError("Failed to load operator properties");
        toast.error("Failed to load operator properties");
      } finally {
        setLoading(false);
      }
    };

    fetchOperatorProperties();
  }, [id]);

  // Filter properties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.property_type
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.furnishing?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          preferencesCount={0}
        />
        <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="h-6 bg-gray-200 rounded mb-8 w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          preferencesCount={0}
        />
        <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {error || "Operator not found"}
            </h2>
            <p className="text-gray-600">
              The operator you&apos;re looking for doesn&apos;t exist or has no
              properties.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={0}
      />

      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Operator Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs">
              <div className="text-center leading-tight">
                <div>AUTHOR</div>
                <div>KING&apos;S</div>
                <div>CROSS</div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">
                {operator.full_name}
              </h1>
              <p className="text-gray-600">Property operator</p>
            </div>
          </div>

          {/* Operator Details - styled like property details */}
          <div className="bg-white rounded-2xl border p-6 mb-8">
            <h2 className="text-xl font-semibold text-black mb-3">
              Official contact information
            </h2>
            <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Globe className="w-4 h-4" />
                  Official Site
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-black">
                    kingkong.com
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Phone className="w-4 h-4" />
                  Phone number
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-black">
                    +380934839533
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  Official Email
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-black">
                    {operator.email}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-black">
                    London, UK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-black">
              Listed Properties ({filteredProperties.length})
            </h2>
            <div className="text-sm text-gray-600">
              After you log in, our service gives you the best results tailored
              to your preferences
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <EnhancedPropertyCard
                key={property.id}
                property={property}
                matchScore={90} // Default match score
                onClick={() => router.push(`/app/properties/${property.id}`)}
                showShortlist={true}
                imageLoaded={true}
              />
            ))}
          </div>

          {filteredProperties.length === 0 && properties.length > 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No properties match your search
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or clear the search to see all
                properties.
              </p>
            </div>
          )}

          {properties.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No properties found
              </h3>
              <p className="text-gray-600">
                This operator hasn&apos;t listed any properties yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
