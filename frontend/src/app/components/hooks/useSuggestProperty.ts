import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  suggestProperty,
  clearErrors,
  TenantRow,
} from "../../store/slices/operatorSlice";
import toast from "react-hot-toast";

export function useSuggestProperty() {
  const dispatch = useDispatch<AppDispatch>();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);

  const handleSuggestProperty = useCallback((tenant: TenantRow) => {
    setSelectedTenant(tenant);
    setShowSuggestModal(true);
  }, []);

  const handleSuggestSubmit = useCallback(
    async (propertyId: string) => {
      if (!selectedTenant) return;

      try {
        await dispatch(
          suggestProperty({ tenantId: selectedTenant.id, propertyId })
        ).unwrap();
        toast.success("Property suggested successfully!");
        setShowSuggestModal(false);
        setSelectedTenant(null);
      } catch (error) {
        toast.error(error as string);
      }
    },
    [selectedTenant, dispatch]
  );

  const handleCloseSuggestModal = useCallback(() => {
    setShowSuggestModal(false);
    setSelectedTenant(null);
    dispatch(clearErrors());
  }, [dispatch]);

  return {
    showSuggestModal,
    selectedTenant,
    handleSuggestProperty,
    handleSuggestSubmit,
    handleCloseSuggestModal,
  };
}
