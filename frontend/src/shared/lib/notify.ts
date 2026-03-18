export type NotifyType = "success" | "error" | "info";

export interface NotifyPayload {
  type: NotifyType;
  message: string;
}

const EVENT_NAME = "tada:notify";

function emit(payload: NotifyPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotifyPayload>(EVENT_NAME, { detail: payload }));
}

export const notify = {
  success(message: string) {
    emit({ type: "success", message });
  },
  error(message: string) {
    emit({ type: "error", message });
  },
  info(message: string) {
    emit({ type: "info", message });
  },
};

export function onNotify(handler: (payload: NotifyPayload) => void) {
  if (typeof window === "undefined") return () => {};

  const listener = (e: Event) => {
    const detail = (e as CustomEvent<NotifyPayload>).detail;
    if (!detail) return;
    handler(detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
