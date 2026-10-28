"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Force update to remove any lingering old fetch handlers
          reg.update();
        })
        .catch((err) => {
          console.warn("SW registration skipped:", err);
        });
    }
  }, []);

  return null;
}
