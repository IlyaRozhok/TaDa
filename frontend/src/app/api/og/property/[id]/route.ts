import { NextResponse } from "next/server";
import { fetchPublicProperty } from "@/app/lib/serverApi";

/**
 * Stable image URL for link previews and structured data.
 *
 * Property photos are 24-hour presigned S3 URLs, so embedding them directly
 * in OpenGraph/JSON-LD breaks every preview a day after the page was built.
 * This route is the stable address: crawlers and unfurlers hit it whenever
 * they render the preview, and it redirects to a FRESH presigned URL each
 * time. The redirect itself may be cached briefly; the target outlives any
 * such cache by a wide margin (1h cache vs 24h signature).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await fetchPublicProperty(id);
  const photo = property?.photos?.[0];

  if (!photo) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.redirect(photo, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
