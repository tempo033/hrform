"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  UserPen,
  Calculator,
  Phone,
  Mail,
  IdCard,
  FileSignature,
  Banknote,
  BadgeCheck,
  StickyNote,
} from "lucide-react";
import { Badge, Button, SlideOver } from "./ui";
import type { Employee } from "@/lib/types";
import { expiryInfo, fmtDate, fmtHijri, fmtMoney, serviceLabelFrom, totalWage } from "@/lib/format";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]).join(" ");
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-1 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-semibold text-stone-400">{label}</span>
      <span className="text-left text-[13px] font-medium text-stone-700">{children}</span>
    </div>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white">
      <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-2.5">
        <Icon className="h-4 w-4 text-emerald-700" />
        <h3 className="text-xs font-bold text-stone-600">{title}</h3>
      </div>
      <div className="px-3.5 py-1.5">{children}</div>
    </div>
  );
}

export default function EmployeeDrawer({
  employee,
  onClose,
  onEdit,
}: {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (e: Employee) => void;
}) {
  const e = employee;
  return (
    <SlideOver open={!!e} onClose={onClose}>
      {e && (
        <>
          <div className="relative overflow-hidden bg-pine-950 px-6 pt-6 pb-14 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{ background: "radial-gradient(70% 90% at 80% 0%, rgba(16,185,129,0.25), transparent 70%)" }}
            />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-lg font-bold shadow-lg ring-1 ring-white/20">
                  {initials(e.name)}
                </span>
                <div>
                  <h2 className="text-lg font-bold">{e.name}</h2>
                  <p className="mt-0.5 text-xs text-emerald-300/90">
                    {e.jobTitle || "—"} · {e.department || "بدون قسم"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/15">
                رقم وظيفي: <span className="tnum">{e.empNo}</span>
              </span>
              {e.status === "active" ? (
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">نشط — على رأس العمل</span>
              ) : (
                <span className="rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/30">منتهية خدمته</span>
              )}
              {e.onSponsorship && !e.isSaudi && (
                <span className="rounded-full bg-[#b8912f]/15 px-3 py-1 text-[11px] font-semibold text-[#e5c877] ring-1 ring-[#b8912f]/40">على كفالة الشركة</span>
              )}
            </div>
          </div>

          <div className="scrollbar-thin -mt-8 flex-1 space-y-4 overflow-y-auto px-5 pb-24">
            <Block title="بيانات الهوية والاتصال" icon={IdCard}>
              <InfoRow label="الجنسية">{e.nationality || "—"}</InfoRow>
              <InfoRow label={e.isSaudi ? "رقم الهوية الوطنية" : "رقم الإقامة"}>
                <span className="tnum">{e.idNumber || "—"}</span>
              </InfoRow>
              {e.phone && (
                <InfoRow label="الجوال">
                  <span className="tnum inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-stone-400" />
                    {e.phone}
                  </span>
                </InfoRow>
              )}
              {e.email && (
                <InfoRow label="البريد الإلكتروني">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-stone-400" />
                    {e.email}
                  </span>
                </InfoRow>
              )}
            </Block>

            {!e.isSaudi && (
              <Block title="الإقامة والكفالة" icon={BadgeCheck}>
                <InfoRow label="رقم الإقامة"><span className="tnum">{e.iqamaNumber ?? "—"}</span></InfoRow>
                <InfoRow label="تاريخ الانتهاء (ميلادي)"><span className="tnum">{fmtDate(e.iqamaExpiry)}</span></InfoRow>
                <InfoRow label="الموافق (هجري)">{fmtHijri(e.iqamaExpiry)}</InfoRow>
                <InfoRow label="حالة الصلاحية">
                  {(() => {
                    const info = expiryInfo(e.iqamaExpiry);
                    return (
                      <Badge
                        tone={info.state === "expired" ? "red" : info.state === "critical" ? "orange" : info.state === "warning" ? "amber" : info.state === "notice" ? "sky" : info.state === "ok" ? "emerald" : "stone"}
                        dot
                        pulse={info.state === "expired"}
                      >
                        {info.label}
                      </Badge>
                    );
                  })()}
                </InfoRow>
                <InfoRow label="الكفالة">{e.onSponsorship ? "على كفالة الشركة" : "كفالة خارجية"}</InfoRow>
              </Block>
            )}

            <Block title="التعيين والعقد" icon={FileSignature}>
              <InfoRow label="تاريخ المباشرة"><span className="tnum">{fmtDate(e.hireDate)}</span></InfoRow>
              <InfoRow label="مدة الخدمة">{serviceLabelFrom(e.hireDate)}</InfoRow>
              <InfoRow label="نوع العقد">{e.contractType}</InfoRow>
              <InfoRow label="بداية العقد"><span className="tnum">{fmtDate(e.contractStart)}</span></InfoRow>
              <InfoRow label="نهاية العقد">
                <span className="tnum">
                  {e.contractType === "غير محدد المدة" ? "غير محدد" : fmtDate(e.contractEnd)}
                </span>
              </InfoRow>
            </Block>

            <Block title="الأجر والبدلات الشهرية" icon={Banknote}>
              <InfoRow label="الراتب الأساسي"><span className="tnum">{fmtMoney(e.basicSalary)}</span></InfoRow>
              <InfoRow label="بدل السكن"><span className="tnum">{fmtMoney(e.housingAllowance)}</span></InfoRow>
              <InfoRow label="بدل النقل"><span className="tnum">{fmtMoney(e.transportAllowance)}</span></InfoRow>
              <InfoRow label="بدلات أخرى"><span className="tnum">{fmtMoney(e.otherAllowances)}</span></InfoRow>
              <div className="mt-1 mb-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-600/15">
                <span className="text-xs font-bold text-emerald-900">إجمالي الأجر</span>
                <span className="tnum text-[15px] font-bold text-emerald-800">{fmtMoney(totalWage(e))}</span>
              </div>
            </Block>

            {e.notes && (
              <Block title="ملاحظات" icon={StickyNote}>
                <p className="py-2 text-[13px] leading-relaxed text-stone-600">{e.notes}</p>
              </Block>
            )}
          </div>

          <div className="absolute right-0 bottom-0 left-0 flex items-center gap-2 border-t border-stone-200 bg-white/95 px-5 py-3.5 backdrop-blur">
            <Button icon={UserPen} variant="outline" className="flex-1" onClick={() => onEdit(e)}>
              تعديل البيانات
            </Button>
            <Link href={`/eos?emp=${e.id}`} className="flex-1">
              <Button icon={Calculator} className="w-full">
                حساب نهاية الخدمة
              </Button>
            </Link>
          </div>
        </>
      )}
    </SlideOver>
  );
}
