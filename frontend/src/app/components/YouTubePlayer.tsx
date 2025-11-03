"use client";

import { useCallback, useMemo, useState } from "react";

type YouTubePlayerProps = {
  videoId: string;
  title?: string;
  start?: number;
  className?: string;
  rounded?: boolean;
  autoPlayOnClick?: boolean;
  showControlsOnPlay?: boolean;
  /** aspect ratio string like "16:9" or "9:16"; default 16:9 */
  ratio?: string;
};

/**
 * Responsive, performant YouTube player with a lightweight thumbnail-first render.
 * - Renders a poster + play button until clicked
 * - Loads iframe only on interaction (better CLS/LCP)
 * - Uses youtube-nocookie domain
 */
export default function YouTubePlayer({
  videoId,
  title = "YouTube video",
  start = 0,
  className = "",
  rounded = true,
  autoPlayOnClick = true,
  showControlsOnPlay = true,
  ratio = "16:9",
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const poster = useMemo(() => {
    // Prefer webp if available; YouTube serves both
    return `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;
  }, [videoId]);

  const iframeSrc = useMemo(() => {
    // Detect mobile device
    const isMobile =
      typeof window !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
        window.innerWidth <= 768);

    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1", // Critical for mobile - allows inline playback
      enablejsapi: "1", // Helps with mobile compatibility
      start: String(start || 0),
      controls: showControlsOnPlay ? "1" : "0",
      fs: "1", // Allow fullscreen
      cc_load_policy: "0", // Don't show captions by default
    });

    // On mobile, mute is often required for autoplay, but we'll let user unmute
    if (autoPlayOnClick && isPlaying) {
      params.set("autoplay", "1");
      // Mute for autoplay to work on mobile
      params.set("mute", "1");
    }

    // Explicit origin helps YouTube render in some browsers/plugins
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      if (origin) params.set("origin", origin);
    } catch {}

    // Use main youtube embed for Shorts to avoid black screen
    // For Shorts, use standard embed format
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, start, isPlaying, autoPlayOnClick, showControlsOnPlay]);

  const onPlay = useCallback(() => setIsPlaying(true), []);

  const cssAspect = useMemo(() => {
    const parts = ratio.includes(":") ? ratio.split(":") : ["16", "9"];
    const w = Number(parts[0]) || 16;
    const h = Number(parts[1]) || 9;
    return `${w} / ${h}`;
  }, [ratio]);

  return (
    <div
      className={[
        // Aspect ratio responsive wrapper: 16:9 across breakpoints
        "relative w-full",
        "[&>*]:absolute [&>*]:inset-0",
        rounded ? "overflow-hidden rounded-2xl" : "",
        className || "",
      ].join(" ")}
      style={{ aspectRatio: cssAspect }}
    >
      {!isPlaying ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play video: ${title}`}
          className="group relative block h-full w-full focus:outline-none"
        >
          {/* Poster */}
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to HQ image if maxres not available
              const img = e.currentTarget as HTMLImageElement;
              img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />

          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/0" />

          {/* Play button */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/90 shadow-xl ring-1 ring-black/10 transition group-hover:scale-105">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5 text-black"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8 text-center">
          <p className="mb-4">Video unavailable in embedded player</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Open in YouTube
          </a>
        </div>
      ) : (
        <iframe
          title={title}
          src={iframeSrc}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          frameBorder="0"
          loading="lazy"
          onError={() => setLoadError(true)}
          onLoad={(e) => {
            // Check if iframe loaded successfully
            const iframe = e.currentTarget as HTMLIFrameElement;
            setTimeout(() => {
              try {
                // Try to detect if YouTube shows error
                const iframeDoc =
                  iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc?.body?.textContent?.includes("unavailable")) {
                  setLoadError(true);
                }
              } catch {
                // Cross-origin, can't check but assume it's working
              }
            }, 2000);
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      )}
    </div>
  );
}
