"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "unihub_pwa_install_dismissed_at";
const DISMISS_DAYS = 14;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 86400000) return;

    if (isIos()) {
      // سفاري ما يدعم beforeinstallprompt، نعرض تلميح بعد شوي من التصفح
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIosHelp(false);
  }

  async function install() {
    if (isIos()) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-white p-4 shadow-large sm:inset-x-auto sm:left-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl brand-gradient text-white">
            <Download size={20} />
          </div>
          <div className="flex-1">
            {!showIosHelp ? (
              <>
                <p className="text-sm font-bold text-text-primary">ثبّت UniHub على جهازك</p>
                <p className="text-xs text-text-secondary">وصول أسرع، وتجربة أشبه بتطبيق حقيقي.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-text-primary">للتثبيت على آيفون:</p>
                <p className="flex items-center gap-1 text-xs text-text-secondary">
                  اضغط زر المشاركة <Share size={12} className="inline" /> ثم "إضافة إلى الشاشة الرئيسية"
                </p>
              </>
            )}
          </div>
          {!showIosHelp && (
            <button onClick={install} className="shrink-0 rounded-btn brand-gradient px-3 py-2 text-xs font-bold text-white shadow-soft">
              تثبيت
            </button>
          )}
          <button onClick={dismiss} className="shrink-0 text-text-disabled hover:text-text-secondary">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
