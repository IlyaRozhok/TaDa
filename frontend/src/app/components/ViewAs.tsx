"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import {
  useTranslation,
  translateWithFallback,
} from "@/app/hooks/useTranslation";
import { generalKeys } from "@/app/lib/translationsKeys/generalKeys";
import { VIEW_AS_PARAM } from "@/app/lib/viewAs";

/**
 * Reports the raw `?viewAs=` parameter to its parent.
 *
 * A component of its own, and rendered inside a local `<Suspense>` by the
 * page, for the same reason as `PageViewTracker`: `useSearchParams()` without
 * a boundary drags the whole tree it sits in out of static rendering. The
 * page holds the value in state; until this reports, the page treats it as
 * unknown and holds its scoring query back, so an admin never sees their own
 * feed flash up before the tenant's.
 */
export function ViewAsParamReader({
  onChange,
}: {
  onChange: (rawParam: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const rawParam = searchParams?.get(VIEW_AS_PARAM) ?? null;

  useEffect(() => {
    onChange(rawParam);
  }, [rawParam, onChange]);

  return null;
}

/**
 * The admin's reminder that the page is not theirs: whose preferences it is
 * scored against, that it is read-only, and the way out. Sticky, so it stays
 * in view on a long feed.
 */
export function ViewAsBanner({ tenantName }: { tenantName: string | null }) {
  const router = useRouter();
  const { t } = useTranslation();

  const title = translateWithFallback(t, generalKeys.viewAs.title, "Viewing as");
  const readOnly = translateWithFallback(
    t,
    generalKeys.viewAs.readOnly,
    "read-only",
  );
  const exit = translateWithFallback(t, generalKeys.viewAs.exit, "Exit");
  const name =
    tenantName ||
    translateWithFallback(t, generalKeys.viewAs.unnamed, "this tenant");

  return (
    <div
      role="status"
      data-testid="view-as-banner"
      className="sticky top-16 z-40 mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">
          {title} <span className="font-semibold">{name}</span>
          <span className="text-amber-700"> · {readOnly}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => router.push("/app/units")}
        className="flex-shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer"
      >
        {exit}
      </button>
    </div>
  );
}
