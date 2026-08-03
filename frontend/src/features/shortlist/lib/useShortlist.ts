import { useSelector } from "react-redux";
import {
  useAddToShortlistMutation,
  useGetShortlistQuery,
  useRemoveFromShortlistMutation,
} from "@/store/api/shortlist.api";
import { selectUser } from "@/store/slices/authSlice";
import { Property } from "@/app/types";

/**
 * `/shortlist` is tenant- and admin-only. Other roles — and signed-out
 * visitors on a public property page — must not fire it at all: a 401 there
 * would sign the reader out through the base query's 401 handling.
 */
const canUseShortlist = (role: string | undefined): boolean =>
  role === "tenant" || role === "admin";

/**
 * The shortlist itself. Everything that needs the list reads it through this
 * hook, so the role gate lives in exactly one place and RTK Query dedupes the
 * request across however many cards are on screen.
 */
export const useShortlistProperties = () => {
  const user = useSelector(selectUser);

  return useGetShortlistQuery(undefined, {
    skip: !canUseShortlist(user?.role),
    // The mutations keep the cache in step, so this only picks up changes made
    // in another tab or on another device.
    refetchOnMountOrArgChange: 60,
  });
};

/** The heart on a property card. */
export const useShortlist = (property: Property, showShortlist: boolean) => {
  const { data: shortlistProperties } = useShortlistProperties();
  const [addToShortlist, { isLoading: adding }] = useAddToShortlistMutation();
  const [removeFromShortlist, { isLoading: removing }] =
    useRemoveFromShortlistMutation();

  const isShortlisted = Boolean(
    shortlistProperties?.some((item) => item.id === property.id),
  );

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showShortlist || !property?.id) {
      return;
    }

    try {
      if (isShortlisted) {
        await removeFromShortlist(property.id).unwrap();
        return;
      }

      await addToShortlist({ propertyId: property.id, property }).unwrap();
    } catch (error: unknown) {
      // The optimistic patch has already been rolled back, so the heart is back
      // where it was; nothing renders this message today.
      console.error("Shortlist toggle failed:", error);
    }
  };

  return {
    isShortlisted,
    loading: adding || removing,
    handleShortlistToggle,
  };
};

export default useShortlist;
