"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // نسجّل الـ SW بعد اكتمال تحميل الصفحة حتى ما يأخر أول تحميل
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // فشل التسجيل (مثلاً بيئة تطوير محلية بدون https) - نتجاهل بصمت
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
