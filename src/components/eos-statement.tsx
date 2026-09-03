"use client";

import React from "react";
import type { Employee } from "@/lib/types";
import type { EosResult } from "@/lib/eos";
import { fmtDate, fmtHijri, fmtMoney } from "@/lib/format";

export default function EosStatement({
  employee,
  result,
  endDate,
}: {
  employee: Employee;
  result: EosResult;
  endDate: string;
}) {
  const refNo = `EOS-${employee.empNo}-${new Date().getFullYear()}`;
  return (
    <div dir="rtl" className="mx-auto max-w-[190mm] bg-white px-2 py-4 text-stone-800" style={{ fontFamily: "var(--font-plex), 'Segoe UI', Tahoma, sans-serif" }}>
      {/* header */}
      <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 2.5l2.6 2.6 3.7-1 1 3.7 2.2 3-2.2 3-1 3.7-3.7-1L12 19.5l-2.6-2.6-3.7 1-1-3.7-2.2-3 2.2-3 1-3.7 3.7 1z" strokeLinejoin="round" />
              <circle cx="12" cy="11" r="2.6" />
            </svg>
          </span>
          <div>
            <p className="text-[16px] font-bold">شركة البنية الأساسية للمقاولات ذ.م.م</p>
            <p className="text-[10px] text-stone-500">Al-Bunya Al-Asasiya Contracting Co. LLC</p>
            <p className="mt-0.5 text-[10px] text-stone-500">إدارة الموارد البشرية — شؤون الموظفين</p>
          </div>
        </div>
        <div className="text-left text-[10px] leading-relaxed text-stone-500">
          <p>رقم الكشف: <span className="font-bold text-stone-700">{refNo}</span></p>
          <p>التاريخ الهجري: {fmtHijri(new Date())}</p>
          <p>الموافق: {fmtDate(new Date())} م</p>
        </div>
      </div>

      <h1 className="mt-5 text-center text-[18px] font-bold text-emerald-900">كشف احتساب مكافأة نهاية الخدمة</h1>
      <p className="mt-1 text-center text-[10px] text-stone-500">
        وفق أحكام نظام العمل السعودي — {result.rule || "المواد (84 - 87)"} · نوع الحالة: {result.typeLabel}
      </p>

      {/* employee info */}
      <table className="mt-5 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            {[
              ["اسم الموظف", employee.name],
              ["الرقم الوظيفي", employee.empNo],
              ["الجنسية", employee.nationality || "—"],
            ].map(([l, v]) => (
              <td key={l} className="border border-stone-300 px-3 py-2">
                <span className="block text-[9px] font-semibold text-stone-400">{l}</span>
                <span className="mt-0.5 block font-bold">{v}</span>
              </td>
            ))}
          </tr>
          <tr>
            {[
              ["المسمى الوظيفي", employee.jobTitle || "—"],
              ["القسم", employee.department || "—"],
              ["رقم الهوية / الإقامة", employee.idNumber || "—"],
            ].map(([l, v]) => (
              <td key={l} className="border border-stone-300 px-3 py-2">
                <span className="block text-[9px] font-semibold text-stone-400">{l}</span>
                <span className="mt-0.5 block font-bold">{v}</span>
              </td>
            ))}
          </tr>
          <tr>
            {[
              ["تاريخ المباشرة", fmtDate(employee.hireDate ?? employee.contractStart)],
              ["تاريخ نهاية الخدمة المعتمد", fmtDate(endDate)],
              ["مدة الخدمة", result.serviceLabel],
            ].map(([l, v]) => (
              <td key={l} className="border border-stone-300 px-3 py-2">
                <span className="block text-[9px] font-semibold text-stone-400">{l}</span>
                <span className="mt-0.5 block font-bold">{v}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* calculation */}
      <table className="mt-4 w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="border border-stone-300 bg-stone-100 px-3 py-2 text-right font-bold text-stone-600">البيان</th>
            <th className="border border-stone-300 bg-stone-100 px-3 py-2 text-right font-bold text-stone-600">التفصيل</th>
            <th className="border border-stone-300 bg-stone-100 px-3 py-2 text-left font-bold text-stone-600">المبلغ (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-stone-300 px-3 py-2.5 font-bold">الأجر الشهري المعتمد (الفعلي)</td>
            <td className="border border-stone-300 px-3 py-2.5 text-stone-500">الأساسي + بدل السكن + بدل النقل + البدلات الأخرى</td>
            <td className="border border-stone-300 px-3 py-2.5 text-left font-bold">{fmtMoney(result.wage)}</td>
          </tr>
          <tr>
            <td className="border border-stone-300 px-3 py-2.5 font-bold">قسط السنوات الخمس الأولى</td>
            <td className="border border-stone-300 px-3 py-2.5 text-stone-500">{result.firstFiveMonths} شهر (نصف شهر عن كل سنة)</td>
            <td className="border border-stone-300 px-3 py-2.5 text-left font-bold">{fmtMoney(result.firstFiveAmount)}</td>
          </tr>
          <tr>
            <td className="border border-stone-300 px-3 py-2.5 font-bold">قسط ما بعد السنوات الخمس</td>
            <td className="border border-stone-300 px-3 py-2.5 text-stone-500">{result.afterFiveMonths} شهر (شهر كامل عن كل سنة)</td>
            <td className="border border-stone-300 px-3 py-2.5 text-left font-bold">{fmtMoney(result.afterFiveAmount)}</td>
          </tr>
          <tr>
            <td className="border border-stone-300 bg-stone-50 px-3 py-2.5 font-bold">إجمالي الاستحقاق قبل النسبة</td>
            <td className="border border-stone-300 bg-stone-50 px-3 py-2.5 text-stone-500">{result.grossMonths} شهر إجمالاً</td>
            <td className="border border-stone-300 bg-stone-50 px-3 py-2.5 text-left font-bold">{fmtMoney(result.grossAmount)}</td>
          </tr>
          <tr>
            <td className="border border-stone-300 px-3 py-2.5 font-bold">نسبة الاستحقاق وفق نوع الحالة</td>
            <td className="border border-stone-300 px-3 py-2.5 text-stone-500">{result.factorLabel}</td>
            <td className="border border-stone-300 px-3 py-2.5 text-left font-bold">
              {result.factor === 0 ? "0%" : result.factor === 1 ? "100%" : `${Math.round(result.factor * 100)}%`}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-emerald-800 bg-emerald-800 px-3 py-3 text-[13px] font-bold text-white">
              صافي مكافأة نهاية الخدمة المستحقة
            </td>
            <td className="border border-emerald-800 bg-emerald-800 px-3 py-3 text-left text-[15px] font-bold text-white">
              {fmtMoney(result.netAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 text-[9px] leading-relaxed text-stone-400">
        ملاحظة: أُعد هذا الكشف استناداً إلى البيانات المسجلة في نظام الموارد البشرية ووفق أحكام نظام العمل السعودي.
        تستحق المكافأة عن كسور السنة بنسبة ما قضى العامل في الخدمة، ولا يخل هذا الكشف بأي استحقاقات أخرى نظامية
        (بدل إجازات، أجور متأخرة، تعويضات) إن وجدت.
      </p>

      {/* signatures */}
      <div className="mt-10 grid grid-cols-3 gap-6 text-center text-[10px]">
        {["إدارة الموارد البشرية", "إدارة الشؤون المالية", "المدير العام"].map((role) => (
          <div key={role}>
            <p className="font-bold text-stone-600">{role}</p>
            <div className="mt-8 border-t border-stone-300 pt-1.5 text-stone-400">الاسم: ................................................ &nbsp;&nbsp; التوقيع: ............................ &nbsp;&nbsp; التاريخ: ..../..../......</div>
          </div>
        ))}
      </div>

      <p className="mt-8 border-t border-stone-200 pt-2 text-center text-[9px] text-stone-400">
        صدر هذا الكشف آلياً من نظام الموارد البشرية — شركة البنية الأساسية للمقاولات · {fmtDate(new Date())} م
      </p>
    </div>
  );
}
