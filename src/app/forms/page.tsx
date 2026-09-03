"use client";

import React, { useState } from "react";
import {
  FileSignature,
  ClipboardCheck,
  CalendarDays,
  BadgeCheck,
  CircleDollarSign,
  ExternalLink,
  Maximize2,
  ClipboardList,
  Printer,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, cx } from "@/components/ui";

const BASE = "https://form-hr-nu.vercel.app/";

interface HrForm {
  code: string;
  anchor: string;
  title: string;
  en: string;
  tag: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
}

const FORMS: HrForm[] = [
  {
    code: "offer",
    anchor: "#form-offer",
    title: "عرض عمل",
    en: "Job Offer",
    tag: "التوظيف",
    desc: "خطاب عرض العمل الرسمي متضمناً بيانات الوظيفة والحزمة المالية وبونص الأداء والأحكام العامة وصفحة الإقرار والاعتماد.",
    icon: FileSignature,
    tone: "bg-emerald-700/10 text-emerald-700",
  },
  {
    code: "joining",
    anchor: "#form-joining",
    title: "مباشرة عمل",
    en: "New Staff Joining Form",
    tag: "التوظيف",
    desc: "نموذج مباشرة العمل للموظف الجديد: البيانات الشخصية، جهة الاتصال للطوارئ، الحزمة المالية، وبيانات التعيين مع الاعتمادات.",
    icon: ClipboardCheck,
    tone: "bg-sky-600/10 text-sky-700",
  },
  {
    code: "leave",
    anchor: "#form-leave",
    title: "طلب إجازة",
    en: "Leave Request",
    tag: "الإجازات",
    desc: "طلب الإجازة مع تواريخ البداية والنهاية وملاحظات الخروج والعودة، وبيانات الموظف البديل واعتماد الإدارة والموارد البشرية.",
    icon: CalendarDays,
    tone: "bg-amber-500/10 text-amber-600",
  },
  {
    code: "clearance",
    anchor: "#form-clearance",
    title: "إخلاء طرف",
    en: "Employee Clearance Form",
    tag: "نهاية الخدمة",
    desc: "نموذج إخلاء الطرف بتوقيع الإدارات ذات العلاقة (المالية، الحاسب، الحركة، المستودعات، الموارد البشرية) والإدارة العليا.",
    icon: BadgeCheck,
    tone: "bg-red-500/10 text-red-600",
  },
  {
    code: "salary",
    anchor: "#form-salary",
    title: "طلب إعادة نظر في الراتب",
    en: "Salary Review Request",
    tag: "الرواتب",
    desc: "خطاب طلب مراجعة الراتب الحالي مع سرد الإنجازات والمساهمات، واعتماد المدير المباشر والموارد البشرية والإدارة العليا.",
    icon: CircleDollarSign,
    tone: "bg-[#b8912f]/10 text-[#8a6a1d]",
  },
];

export default function FormsPage() {
  const [selected, setSelected] = useState<HrForm>(FORMS[0]);

  return (
    <div className="space-y-6">
      {/* intro */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-gradient-to-l from-emerald-50/80 to-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/25">
              <ClipboardList className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-stone-800">منظومة النماذج الإلكترونية المعتمدة</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-stone-500">
                النماذج الرسمية لشركة البنية الأساسية للمقاولات — اختر النموذج، املأ الحقول القابلة للتحرير مباشرة داخل
                الصفحة، ثم اطبع أو صدّر PDF من أزرار الموقع. تظهر النماذج داخل النظام ويمكن فتحها في نافذة مستقلة.
              </p>
            </div>
          </div>
          <a href={BASE} target="_blank" rel="noreferrer">
            <span className="inline-flex items-center gap-2 rounded-lg bg-pine-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-pine-950">
              <ExternalLink className="h-4 w-4" />
              فتح المنظومة كاملة
            </span>
          </a>
        </div>
      </div>

      {/* form cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {FORMS.map((f) => {
          const active = selected.code === f.code;
          return (
            <button
              key={f.code}
              onClick={() => setSelected(f)}
              className={cx(
                "group cursor-pointer rounded-2xl border bg-white p-5 text-right transition-all duration-300",
                active
                  ? "-translate-y-0.5 border-emerald-700/40 shadow-lg shadow-emerald-900/10 ring-2 ring-emerald-700/30"
                  : "border-stone-200/80 hover:-translate-y-0.5 hover:border-emerald-700/25 hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", f.tone)}>
                  <f.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <Badge tone="stone">{f.tag}</Badge>
              </div>
              <p className="mt-3.5 text-[14px] font-bold text-stone-800">{f.title}</p>
              <p className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">{f.en}</p>
              <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-stone-500">{f.desc}</p>
            </button>
          );
        })}
      </div>

      {/* viewer */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-5 py-3.5">
          <span className={cx("flex h-9 w-9 items-center justify-center rounded-lg", selected.tone)}>
            <selected.icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-stone-800">نموذج: {selected.title}</h3>
            <p className="text-[11px] text-stone-400">املأ الحقول مباشرة ثم استخدم أزرار الطباعة داخل النموذج</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold text-stone-600 transition-colors hover:border-emerald-600 hover:text-emerald-700"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة
            </button>
            <a
              href={`${BASE}${selected.anchor}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-emerald-800"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              فتح في نافذة جديدة
            </a>
          </div>
        </div>
        <div className="bg-stone-100/70 p-1.5">
          <iframe
            key={selected.anchor}
            src={`${BASE}${selected.anchor}`}
            title={selected.title}
            className="h-[74vh] w-full rounded-xl border border-stone-200 bg-white"
          />
        </div>
      </Card>
    </div>
  );
}
