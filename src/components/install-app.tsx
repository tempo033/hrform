"use client";

import React, { useEffect, useState } from "react";
import { MonitorDown, CheckCircle2, AppWindow, MousePointerClick, Share } from "lucide-react";
import { Badge, Dialog } from "./ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || localStorage.getItem("hr-app-installed") === "1") setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      localStorage.setItem("hr-app-installed", "1");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function trigger() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        localStorage.setItem("hr-app-installed", "1");
      }
      setDeferred(null);
    } else if (!installed) {
      setOpen(true);
    }
  }

  if (installed) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 md:flex">
        <CheckCircle2 className="h-3.5 w-3.5" />
        التطبيق مثبّت
      </span>
    );
  }

  return (
    <>
      <button
        onClick={trigger}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100"
      >
        <MonitorDown className="h-4 w-4" strokeWidth={2.2} />
        <span className="hidden sm:inline">تثبيت على الجهاز</span>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        icon={MonitorDown}
        title="تثبيت برنامج الموارد البشرية على جهازك"
        subtitle="يتم التثبيت خلال ثوانٍ من المتصفح — بلا ملفات خارجية"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-700/20 bg-emerald-50/70 px-4 py-3.5">
            <AppWindow className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="text-[12.5px] leading-relaxed text-emerald-900">
              <p className="font-bold">متصفح Chrome أو Edge (Windows)</p>
              <ol className="mt-1.5 list-decimal space-y-1 pr-4 font-medium">
                <li>افتح رابط النظام الحالي في المتصفح.</li>
                <li>اضغط قائمة النقاط <span className="font-bold">⋮</span> أعلى يمين المتصفح.</li>
                <li>اختر <span className="font-bold">«حفظ ومشاركة» ثم «تثبيت الصفحة كتطبيق»</span> (في Chrome)، أو <span className="font-bold">«التطبيقات» ثم «تثبيت»</span> (في Edge).</li>
                <li>اضغط «تثبيت» — سيظهر البرنامج بأيقونته على سطح المكتب وقائمة ابدأ.</li>
              </ol>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5">
            <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
            <p className="text-[12.5px] leading-relaxed text-stone-600">
              <span className="font-bold text-stone-800">طريقة أسرع:</span> عندما يكون التثبيت متاحاً يظهر زر
              «تثبيت على الجهاز» أعلى الشاشة، أو أيقونة التثبيت داخل شريط العنوان بجوار النجمة — اضغطها مرة واحدة
              واكتمل التثبيت.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5">
            <Share className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
            <p className="text-[12.5px] leading-relaxed text-stone-600">
              <span className="font-bold text-stone-800">أجهزة آبل (iPhone / iPad):</span> من متصفح Safari اضغط زر
              «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».
            </p>
          </div>

          <div className="rounded-xl bg-pine-950 px-4 py-3.5 text-[11.5px] leading-relaxed text-stone-300">
            <p className="font-bold text-emerald-300">ملاحظة فنية</p>
            <p className="mt-1">
              بعد التثبيت يعمل البرنامج كتطبيق مستقل بنافذة خاصة وأيقونة، ويقرأ البيانات من نفس عنوان الخادم
              (رابط النظام الحالي أو سيرفر الشركة) — لذلك يجب أن يبقى رابط النظام شغالاً أثناء الاستخدام.
            </p>
          </div>

          <Badge tone="stone">متوافق مع Windows وmacOS وAndroid وiOS</Badge>
        </div>
      </Dialog>
    </>
  );
}
