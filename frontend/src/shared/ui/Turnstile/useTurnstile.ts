"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, invisible, in front of sending an SMS code.
 *
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY nothing loads and `getToken()`
 * resolves `undefined` — the backend skips the check too while its secret is
 * unset, so development and the stub work without Cloudflare. With the key,
 * the widget renders into `containerRef` and `getToken()` runs a challenge,
 * normally with no visible step, resolving its one-time token.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_TIMEOUT_MS = 30_000;

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** The Turnstile script, loaded once per page. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load"));
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    readyRef.current = loadTurnstile().then((api) => {
      if (cancelled || !containerRef.current) return;
      const id = api.render(containerRef.current, {
        sitekey: SITE_KEY,
        // Invisible unless Cloudflare insists on an interaction.
        appearance: "interaction-only",
        execution: "execute",
        callback: (token: string) => {
          pendingRef.current?.resolve(token);
          pendingRef.current = null;
        },
        "error-callback": () => {
          pendingRef.current?.reject(new Error("Turnstile challenge failed"));
          pendingRef.current = null;
        },
      });
      widgetRef.current = { api, id };
    });

    return () => {
      cancelled = true;
      if (widgetRef.current) widgetRef.current.api.remove(widgetRef.current.id);
      widgetRef.current = null;
    };
  }, []);

  /** A fresh single-use token, or `undefined` while Turnstile is not configured. */
  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!SITE_KEY) return undefined;
    await readyRef.current;
    const widget = widgetRef.current;
    if (!widget) throw new Error("Turnstile is not ready");

    return new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pendingRef.current = null;
        reject(new Error("Turnstile timed out"));
      }, TOKEN_TIMEOUT_MS);
      pendingRef.current = {
        resolve: (token) => {
          window.clearTimeout(timer);
          resolve(token);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };
      // Tokens are single-use: reset before each challenge.
      widget.api.reset(widget.id);
      widget.api.execute(widget.id);
    });
  }, []);

  return { containerRef, getToken, enabled: Boolean(SITE_KEY) };
}
