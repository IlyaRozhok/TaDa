import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../app/store/slices/authSlice';
import { authAPI } from '../../../../app/lib/api';
import { UpdateUserData, User } from '../../../../entities/user/model/types';
import { normalizeDate } from '../../../../entities/user/lib/utils';

export const useProfileUpdate = (user: User | null) => {
  const dispatch = useDispatch();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFieldRef = useRef<{
    field: keyof UpdateUserData;
    value: unknown;
  } | null>(null);

  const saveSingleField = useCallback(
    async (field: keyof UpdateUserData, value: unknown) => {
      if (!user) return;

      try {
        // Get current value from user/profile
        const profile = user.role === "tenant" ? user.tenantProfile : user.operatorProfile;
        let currentValue: unknown;

        if (field === "email") {
          currentValue = user[field];
        } else if (field === "date_of_birth") {
          const currentDate = profile?.date_of_birth;
          if (currentDate) {
            try {
              const date = new Date(currentDate);
              currentValue = !isNaN(date.getTime())
                ? date.toISOString().split("T")[0]
                : "";
            } catch {
              currentValue = "";
            }
          } else {
            currentValue = "";
          }
        } else {
          currentValue = profile?.[field as keyof typeof profile];
        }

        // Check if value actually changed (normalize dates for comparison)
        let hasChanged = value !== currentValue;
        if (field === "date_of_birth" && !hasChanged) {
          hasChanged = normalizeDate(value as string) !== normalizeDate(currentValue as string);
        }

        if (!hasChanged) {
          return; // No change, skip save
        }

        const updateData: UpdateUserData = { [field]: value } as UpdateUserData;

        // Update profile via API and refresh state with returned user
        const response = await authAPI.updateProfile(updateData);
        const updatedUser = response.data;
        dispatch(updateUser(updatedUser));

      } catch (error) {
        console.error(`Failed to save field ${field as string}:`, error);
        // Silent fail - don't show toast
      }
    },
    [user, dispatch]
  );

  const handleInputChange = useCallback(
    (field: keyof UpdateUserData, value: string | number, onUpdate: (data: UpdateUserData) => void) => {
      // Update form data immediately
      onUpdate({ [field]: value } as UpdateUserData);

      // Auto-save the field after debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      pendingFieldRef.current = { field, value };

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingFieldRef.current) {
          saveSingleField(
            pendingFieldRef.current.field,
            pendingFieldRef.current.value
          );
          pendingFieldRef.current = null;
        }
      }, 500); // 500ms debounce
    },
    [saveSingleField]
  );

  const handleAvatarUpload = useCallback(
    async (file: File, onUpdate: (data: UpdateUserData) => void) => {
      try {
        const res = await authAPI.uploadAvatar(file);
        const url = res?.avatar_url || res?.user?.avatar_url || res?.url;
        if (url) {
          handleInputChange("avatar_url", url, onUpdate);
        }
      } catch (error) {
        console.error("Avatar upload failed:", error);
      }
    },
    [handleInputChange]
  );

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    handleInputChange,
    handleAvatarUpload,
    cleanup
  };
};
