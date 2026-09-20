"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
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
 * What the banner knows about the tenant. Only `id` is guaranteed: the feed
 * sends the rest in `viewingAs`, but the detail page has nothing but the id
 * from its URL, and the feed shows the id alone until its first response.
 */
export interface ViewAsBannerTenant {
  id: string;
  full_name?: string | null;
  tenant_cv_share_uuid?: string | null;
}

/**
 * The admin's reminder that the page is not theirs: whose preferences it is
 * scored against — the name linking to their public CV when they have shared
 * one, and the full id so there is no doubt which account — that it is
 * read-only, and the way out. Sticky, so it stays in view on a long feed.
 */
export function ViewAsBanner({ tenant }: { tenant: ViewAsBannerTenant }) {
  const router = useRouter();
  const { t } = useTranslation();

  const title = translateWithFallback(
    t,
    generalKeys.viewAs.title,
    "Viewing as",
  );
  const readOnly = translateWithFallback(
    t,
    generalKeys.viewAs.readOnly,
    "read-only",
  );
  const exit = translateWithFallback(t, generalKeys.viewAs.exit, "Exit");
  const name =
    tenant.full_name ||
    translateWithFallback(t, generalKeys.viewAs.unnamed, "this tenant");
  const cvShareUuid = tenant.tenant_cv_share_uuid;

  return (
    <div
      role="status"
      data-testid="view-as-banner"
      className="sticky top-16 z-40 mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        {/* Wraps rather than truncates: the full id has to stay readable. */}
        <span className="min-w-0">
          {title}{" "}
          {cvShareUuid ? (
            // Only a shared CV has a public page; without one the name stays
            // plain text rather than linking to a 404.
            <a
              href={`/cv/${encodeURIComponent(cvShareUuid)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-950 hover:decoration-amber-700"
            >
              {name}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : (
            <span className="font-semibold">{name}</span>
          )}{" "}
          <span
            className="font-mono text-xs text-amber-700 [overflow-wrap:anywhere]"
            data-testid="view-as-tenant-id"
          >
            ({tenant.id})
          </span>
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
