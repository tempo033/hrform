"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Calculator, Printer, UserMinus, CheckCircle2, ScrollText } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, cx } from "@/components/ui";
import EosStatement from "@/components/eos-statement";
import type { Employee } from "@/lib/types";
import { calculateEOS, TERMINATION_TYPES, type TerminationCode } from "@/lib/eos";
import { fmtDate, fmtHijri, fmtMoney, isoDate } from "@/lib/format";

export default function EosClient() {
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [empId, setEmpId] = useState<number | null>(null);
  const [type, setType] = useState<TerminationCode>("employer_termination");
  const [endDate, setEndDate] = useState(isoDate());
  const [basic, setBasic] = useState("0");
  const [housing, setHousing] = useState("0");
  const [transport, setTransport] = useState("0");
  const [other, setOther] = useState("0");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d: Employee[]) => {
        const list = Array.isArray(d) ? d : [];
        setEmployees(list);
        const pre = Number(searchParams.get("emp"));
        const found = list.find((e) => e.id === pre);
        setEmpId(found ? found.id : list[0]?.id ?? null);
      });
  }, [searchParams]);

  const employee = useMemo(() => (employees ?? []).find((e) => e.id === empId) ?? null, [employees, empId]);

  // تعبئة الأجر تلقائياً عند تغيير الموظف
  useEffect(() => {
    if (employee) {
      setBasic(String(employee.basicSalary));
      setHousing(String(employee.housingAllowance));
      setTransport(String(employee.transportAllowance));
      setOther(String(employee.otherAllowances));
      setSaved(false);
    }
  }, [employee]);

  const wage = (parseFloat(basic) || 0) + (parseFloat(housing) || 0) + (parseFloat(transport) || 0) + (parseFloat(other) || 0);

  const result = useMemo(() => {
    if (!employee) return null;
    return calculateEOS(wage, employee.hireDate ?? employee.contractStart, endDate, type);
  }, [employee, wage, endDate, type]);

  async function saveAsTermination() {
    if (!employee || saving) return;
    if (!confirm("سيتم تسجيل إنهاء علاقة تعاقدية لهذا الموظف بهذه المعطيات ونقله إلى حالة «منتهية خدمته». متابعة؟")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/terminations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id, type, noticeDate: null, lastWorkingDay: endDate, reason: "مسجل من حاسبة نهاية الخدمة" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "تعذر الحفظ");
      setSaved(true);
      setEmployees((list) => (list ?? []).map((e) => (e.id === employee.id ? { ...e, status: "terminated" } : e)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (employees === null) return <Spinner className="py-32" />;

  if (employees.length === 0) {
    return <EmptyState icon={Calculator} title="لا يوجد موظفون" desc="أضف موظفين أولاً لتتمكن من احتساب مكافآت نهاية الخدمة" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      {/* inputs */}
      <div className="space-y-4 xl:col-span-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
              <Calculator className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-stone-800">مدخلات الاحتساب</h3>
              <p className="text-[11px] text-stone-400">وفق المواد (84، 85، 80، 87) من نظام العمل</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="الموظف" required>
              <Select value={empId ?? ""} onChange={(e) => setEmpId(Number(e.target.value))}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empNo} — {e.name} {e.status === "terminated" ? "(منتهية خدمته)" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="نوع الحالة" required>
                <Select value={type} onChange={(e) => setType(e.target.value as TerminationCode)}>
                  {TERMINATION_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>{t.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="تاريخ نهاية الخدمة" required>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="tnum" />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-stone-600">الأجر والبدلات الشهرية (قابلة للتعديل)</p>
                <span className="text-[10px] text-stone-400">معبأة من ملف الموظف</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الأساسي">
                  <Input type="number" min="0" step="any" value={basic} onChange={(e) => setBasic(e.target.value)} className="tnum text-left" />
                </Field>
                <Field label="بدل السكن">
                  <Input type="number" min="0" step="any" value={housing} onChange={(e) => setHousing(e.target.value)} className="tnum text-left" />
                </Field>
                <Field label="بدل النقل">
                  <Input type="number" min="0" step="any" value={transport} onChange={(e) => setTransport(e.target.value)} className="tnum text-left" />
                </Field>
                <Field label="بدلات أخرى">
                  <Input type="number" min="0" step="any" value={other} onChange={(e) => setOther(e.target.value)} className="tnum text-left" />
                </Field>
              </div>
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-stone-100 px-3 py-2">
                <span className="text-[11px] font-bold text-stone-500">الأجر الفعلي المعتمد</span>
                <span className="tnum text-sm font-bold text-pine-900">{fmtMoney(wage)}</span>
              </div>
            </div>
          </div>
        </Card>

        {employee && (
          <Card className="bg-pine-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold">{employee.name}</p>
                <p className="mt-0.5 text-[11px] text-stone-400">{employee.jobTitle || "—"} · {employee.department || "بدون قسم"}</p>
              </div>
              <Badge tone="gold">{employee.empNo}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/[0.06] px-3 py-2">
                <p className="text-stone-400">تاريخ المباشرة</p>
                <p className="tnum mt-0.5 font-bold text-stone-100">{fmtDate(employee.hireDate ?? employee.contractStart)}</p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-3 py-2">
                <p className="text-stone-400">الحالة</p>
                <p className="mt-0.5 font-bold text-stone-100">{employee.status === "active" ? "على رأس العمل" : "منتهية خدمته"}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* result */}
      <div className="xl:col-span-3">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <ScrollText className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-[14px] font-bold text-stone-800">كشف الاحتساب</h3>
              {result && <Badge tone="gold">{result.rule}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" icon={Printer} onClick={() => window.print()} disabled={!result?.eligible}>
                طباعة الكشف
              </Button>
              {saved ? (
                <Badge tone="emerald" dot>تم تسجيل الإنهاء</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  icon={UserMinus}
                  onClick={saveAsTermination}
                  loading={saving}
                  disabled={!result?.eligible || employee?.status === "terminated"}
                >
                  تسجيل كإنهاء علاقة
                </Button>
              )}
            </div>
          </div>

          {!employee || !result ? (
            <EmptyState icon={Calculator} title="اختر موظفاً" desc="حدد الموظف ومعطيات الحالة لعرض كشف الاحتساب التفصيلي" />
          ) : !result.eligible ? (
            <EmptyState
              icon={Calculator}
              title="تعذر الاحتساب"
              desc={!employee.hireDate && !employee.contractStart ? "لا يوجد تاريخ مباشرة مسجل لهذا الموظف — أضفه من ملف الموظف أولاً" : "تحقق من الأجر المعتمد وتواريخ الخدمة"}
            />
          ) : (
            <div className="px-6 py-6">
              {/* headline */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-stone-50 px-4 py-3.5 ring-1 ring-stone-100">
                  <p className="text-[11px] font-semibold text-stone-400">مدة الخدمة</p>
                  <p className="mt-1 text-[15px] font-bold text-stone-800">{result.serviceLabel}</p>
                  <p className="tnum mt-0.5 text-[10px] text-stone-400">{result.serviceDays.toLocaleString("en")} يوماً</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3.5 ring-1 ring-stone-100">
                  <p className="text-[11px] font-semibold text-stone-400">إجمالي الاستحقاق قبل النسبة</p>
                  <p className="tnum mt-1 text-[15px] font-bold text-stone-800">{fmtMoney(result.grossAmount)}</p>
                  <p className="tnum mt-0.5 text-[10px] text-stone-400">{result.grossMonths} شهر</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3.5 ring-1 ring-stone-100">
                  <p className="text-[11px] font-semibold text-stone-400">نسبة الاستحقاق</p>
                  <p className="tnum mt-1 text-[15px] font-bold text-stone-800">
                    {result.factor === 1 ? "100%" : result.factor === 0 ? "0%" : `${Math.round(result.factor * 100)}%`}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-stone-400">{result.factorLabel}</p>
                </div>
              </div>

              {/* formula breakdown */}
              <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
                <table className="w-full">
                  <tbody className="divide-y divide-stone-100">
                    <tr className="bg-stone-50/70">
                      <td className="px-4 py-3 text-xs font-bold text-stone-500">بند الاحتساب</td>
                      <td className="px-4 py-3 text-xs font-bold text-stone-500">القاعدة النظامية</td>
                      <td className="px-4 py-3 text-left text-xs font-bold text-stone-500">المبلغ</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-stone-700">السنوات الخمس الأولى</td>
                      <td className="px-4 py-3.5 text-[12px] text-stone-500">
                        نصف أجر شهر عن كل سنة — <span className="tnum font-bold text-stone-700">{result.firstFiveMonths}</span> شهر × {fmtMoney(result.wage)}
                      </td>
                      <td className="px-4 py-3.5 text-left"><span className="tnum text-[13px] font-bold text-stone-800">{fmtMoney(result.firstFiveAmount)}</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-stone-700">ما بعد السنوات الخمس</td>
                      <td className="px-4 py-3.5 text-[12px] text-stone-500">
                        أجر شهر كامل عن كل سنة — <span className="tnum font-bold text-stone-700">{result.afterFiveMonths}</span> شهر × {fmtMoney(result.wage)}
                      </td>
                      <td className="px-4 py-3.5 text-left"><span className="tnum text-[13px] font-bold text-stone-800">{fmtMoney(result.afterFiveAmount)}</span></td>
                    </tr>
                    <tr className="bg-stone-50/50">
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-stone-700">معامل نوع الحالة</td>
                      <td className="px-4 py-3.5 text-[12px] text-stone-500">{result.factorLabel}</td>
                      <td className="px-4 py-3.5 text-left"><span className="tnum text-[13px] font-bold text-stone-800">× {result.factor === 1 ? "1.00" : result.factor === 0 ? "0" : result.factor.toFixed(2)}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* net */}
              <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-800 to-pine-900 px-6 py-5 text-white">
                <svg className="pointer-events-none absolute -left-6 -bottom-8 h-36 w-36 text-white/[0.06]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1l2.8 2.8L19 2.7l1.1 4.2L24 9l-3.9 1.1L21.2 14 17 13l-2 3.9-2-3.9-4.2 1.1L9.9 10 6 8.9l3.9-2.1L8.8 2.9 13 4z" />
                </svg>
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-emerald-200">صافي مكافأة نهاية الخدمة المستحقة</p>
                    <p className="tnum mt-1 text-[32px] leading-none font-bold">{fmtMoney(result.netAmount)}</p>
                  </div>
                  <div className="text-left text-[11px] leading-relaxed text-emerald-200/80">
                    <p>{fmtHijri(endDate)}</p>
                    <p className="tnum">حتى {fmtDate(endDate)} م</p>
                  </div>
                </div>
              </div>

              {result.factor === 0 && type === "resignation" && (
                <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2.5 text-[11.5px] font-semibold leading-relaxed text-amber-800 ring-1 ring-amber-200">
                  تنبيه: في حالة الاستقالة لا تستحق المكافأة إلا بعد إتمام سنتين من الخدمة وفق المادة (85).
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* print portal */}
      {mounted && employee && result?.eligible &&
        createPortal(<EosStatement employee={employee} result={result} endDate={endDate} />, document.getElementById("print-portal")!)}
    </div>
  );
}
