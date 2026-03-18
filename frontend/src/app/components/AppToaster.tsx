"use client";

import { useEffect, useState } from "react";
import GlassmorphismToast from "./GlassmorphismToast";
import { onNotify, type NotifyType } from "@/shared/lib/notify";

export default function AppToaster() {
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: NotifyType; message: string }>
  >([]);

  useEffect(() => {
    return onNotify(({ type, message }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setNotifications((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    });
  }, []);

  return (
    <GlassmorphismToast
      notifications={notifications}
      onCloseNotification={(id) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    />
  );
}
