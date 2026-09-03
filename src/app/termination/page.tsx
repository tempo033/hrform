"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  UserMinus,
  Banknote,
  CalendarX2,
  Eye,
  Trash2,
  X,
  ChevronDown,
  Save,
  FileWarning,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Select,
  SlideOver,
  Spinner,
  StatCard,
  TableShell,
  Td,
  Textarea,
  Th,
  cx,
} from "@/components/ui";
import type { Employee, TerminationRecord } from "@/lib/types";
import { calculateEOS, terminationLabel, TERMINATION_TYPES, type EosResult, type TerminationCode } from "@/lib/eos";
import { fmtDate, fmtMoney, isoDate, totalWage } from "@/lib/format";

const TYPE_TONES: Record<string, "red" | "amber" | "sky" | "stone" | "gold" | "orange"> = {
  resignation: "amber",
  employer_termination: "red",
  contract_end: "sky",
  mutual: "stone",
  article80: "orange",
  article87: "gold",
};

/* ------------- searchable employee picker ------------- */
function EmployeePicker({
  employees,
  value,
  onChange,
}: {
  employees: Employee[];
  value: Employee | null;
  onChange: (e: Employee | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = employees.filter((e) =>
    [e.name, e.empNo, e.jobTitle].join(" ").toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm transition-colors hover:border-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
      >
        {value ? (
          <span className="truncate font-medium text-stone-800">
            <span className="tnum text-stone-400">{value.empNo}</span> — {value.name}
          </span>
        ) : (
          <span className="text-stone-400">اختر الموظف…</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
          <div className="border-b border-stone-100 p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو الرقم الوظيفي…"
              className="w-full rounded-lg bg-stone-50 px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-stone-400">لا توجد نتائج</p>}
            {filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onChange(e);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-right transition-colors hover:bg-emerald-50"
              >
                <span>
                  <span className="block text-[13px] font-semibold text-stone-800">{e.name}</span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">{e.jobTitle || "—"}</span>
                </span>
                <span className="tnum text-xs font-bold text-pine-800">{e.empNo}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------- EOS breakdown rows (shared by drawer) ------------- */
function EosBreakdown({ r }: { r: EosResult }) {
  const rows: [string, React.ReactNode][] = [
    ["مدة الخدمة", r.serviceLabel],
    ["الأجر المعتمد في الاحتساب", <span className="tnum font-bold">{fmtMoney(r.wage)}</span>],
    [
      "السنوات الخمس الأولى",
      <span className="text-[12px]">
        <span className="tnum font-bold">{r.firstFiveMonths}</span> شهر × {fmtMoney(r.wage)} ={" "}
        <span className="tnum font-bold text-emerald-800">{fmtMoney(r.firstFiveAmount)}</span>
      </span>,
    ],
    [
      "ما بعد السنوات الخمس",
      <span className="text-[12px]">
        <span className="tnum font-bold">{r.afterFiveMonths}</span> شهر × {fmtMoney(r.wage)} ={" "}
        <span className="tnum font-bold text-emerald-800">{fmtMoney(r.afterFiveAmount)}</span>
      </span>,
    ],
    ["إجمالي المكافأة قبل النسبة", <span className="tnum font-bold">{fmtMoney(r.grossAmount)}</span>],
    ["نسبة الاستحقاق", <span className="text-[12px] font-semibold text-stone-600">{r.factorLabel}</span>],
  ];
  return (
    <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
      {rows.map(([label, val]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-xs font-semibold text-stone-400">{label}</span>
          <span className="text-left text-[13px] font-medium text-stone-700">{val}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 bg-emerald-50/70 px-4 py-3">
        <span className="text-[13px] font-bold text-emerald-900">صافي مكافأة نهاية الخدمة</span>
        <span className="tnum text-lg font-bold text-emerald-800">{fmtMoney(r.netAmount)}</span>
      </div>
    </div>
  );
}

export default function TerminationPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [terminations, setTerminations] = useState<TerminationRecord[] | null>(null);
  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [type, setType] = useState<TerminationCode>("employer_termination");
  const [noticeDate, setNoticeDate] = useState("");
  const [lastDay, setLastDay] = useState(isoDate());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<TerminationRecord | null>(null);
  const [deleting, setDeleting] = useState<TerminationRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function load() {
    const [e, t] = await Promise.all([fetch("/api/employees").then((r) => r.json()), fetch("/api/terminations").then((r) => r.json())]);
    setEmployees(Array.isArray(e) ? e : []);
    setTerminations(Array.isArray(t) ? t : []);
  }

  useEffect(() => {
    load();
  }, []);

  const activeEmployees = useMemo(() => (employees ?? []).filter((e) => e.status === "active"), [employees]);
  const preview: EosResult | null = useMemo(() => {
    if (!emp) return null;
    return calculateEOS(totalWage(emp), emp.hireDate ?? emp.contractStart, lastDay, type);
  }, [emp, lastDay, type]);

  const stats = useMemo(() => {
    const list = terminations ?? [];
    const totalAmount = list.reduce((s, t) => s + (t.eosAmount ?? 0), 0);
    const month = list.filter((t) => {
      const d = new Date(t.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { count: list.length, totalAmount, month };
  }, [terminations]);

  async function save() {
    setError(null);
    if (!emp) return setError("اختر الموظف أولاً");
    if (!lastDay) return setError("حدد تاريخ آخر يوم عمل");
    setSaving(true);
    try {
      const res = await fetch("/api/terminations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: emp.id, type, noticeDate: noticeDate || null, lastWorkingDay: lastDay, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "تعذر الحفظ");
      await load();
      setOpen(false);
      setEmp(null);
      setType("employer_termination");
      setNoticeDate("");
      setReason("");
      setLastDay(isoDate());
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/terminations/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
      setDeleting(null);
    } catch {
      alert("تعذر حذف السجل");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (employees === null || terminations === null) return <Spinner className="py-32" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="حالات الإنهاء الموثقة" value={stats.count} icon={UserMinus} tone="red" sub="إجمالي سجل انتهاء العلاقة" />
        <StatCard title="مكافآت نهاية الخدمة المستحقة" value={<span className="text-[22px]">{fmtMoney(stats.totalAmount)}</span>} icon={Banknote} tone="gold" sub="وفق الاحتساب النظامي وقت الإنهاء" />
        <StatCard title="حالات هذا الشهر" value={stats.month} icon={CalendarX2} tone="pine" sub="مسجلة خلال الشهر الحالي" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] leading-relaxed text-stone-500">
          عند تسجيل إنهاء العلاقة التعاقدية يُحسب النظام مكافأة نهاية الخدمة تلقائياً وفق نظام العمل السعودي،
          ويُنقل الموظف إلى حالة «منتهية خدمته».
        </p>
        <Button icon={UserMinus} onClick={() => setOpen(true)} disabled={activeEmployees.length === 0}>
          تسجيل إنهاء علاقة تعاقدية
        </Button>
      </div>

      <Card>
        {terminations.length === 0 ? (
          <EmptyState
            icon={FileWarning}
            title="لا توجد حالات إنهاء مسجلة"
            desc="سجّل أول حالة إنهاء علاقة تعاقدية وستظهر هنا مع تفاصيل مكافأة نهاية الخدمة"
            action={<Button size="sm" icon={UserMinus} onClick={() => setOpen(true)} disabled={activeEmployees.length === 0}>تسجيل إنهاء</Button>}
          />
        ) : (
          <TableShell minWidth={1000}>
            <thead>
              <tr>
                <Th>الموظف</Th>
                <Th>نوع الإنهاء</Th>
                <Th>تاريخ الإشعار</Th>
                <Th>آخر يوم عمل</Th>
                <Th>مكافأة نهاية الخدمة</Th>
                <Th>تاريخ التسجيل</Th>
                <Th className="text-center">إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {terminations.map((t) => (
                <tr key={t.id} className="cursor-pointer transition-colors hover:bg-red-50/30" onClick={() => setDetails(t)}>
                  <Td>
                    <div>
                      <p className="font-semibold text-stone-800">{t.employee?.name ?? "موظف محذوف"}</p>
                      <p className="text-[11px] text-stone-400">
                        {t.employee && <span className="tnum">{t.employee.empNo}</span>} · {t.employee?.jobTitle ?? "—"}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={TYPE_TONES[t.type] ?? "stone"}>{terminationLabel(t.type)}</Badge>
                  </Td>
                  <Td><span className="tnum text-xs">{fmtDate(t.noticeDate)}</span></Td>
                  <Td><span className="tnum text-xs font-semibold">{fmtDate(t.lastWorkingDay)}</span></Td>
                  <Td><span className="tnum font-bold text-emerald-800">{fmtMoney(t.eosAmount)}</span></Td>
                  <Td><span className="tnum text-xs text-stone-400">{fmtDate(t.createdAt)}</span></Td>
                  <Td>
                    <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <IconButton icon={Eye} label="عرض التفاصيل" onClick={() => setDetails(t)} />
                      <IconButton icon={Trash2} label="حذف السجل" tone="danger" onClick={() => setDeleting(t)} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      {/* register dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        wide
        icon={UserMinus}
        title="تسجيل إنهاء علاقة تعاقدية"
        subtitle="سيتم احتساب مكافأة نهاية الخدمة آلياً ونقل الموظف إلى حالة «منتهية خدمته»"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={save} loading={saving} icon={Save} variant="danger">حفظ وإنهاء العلاقة</Button>
          </>
        }
      >
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{error}</div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الموظف" required className="sm:col-span-2">
            <EmployeePicker employees={activeEmployees} value={emp} onChange={setEmp} />
          </Field>
          <Field label="نوع الإنهاء" required hint={TERMINATION_TYPES.find((t) => t.code === type)?.hint}>
            <Select value={type} onChange={(e) => setType(e.target.value as TerminationCode)}>
              {TERMINATION_TYPES.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="تاريخ الإشعار">
              <input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="tnum w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none" />
            </Field>
            <Field label="آخر يوم عمل" required>
              <input type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} className="tnum w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none" />
            </Field>
          </div>
          <Field label="سبب الإنهاء / ملاحظات" className="sm:col-span-2">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اختياري — يظهر في ملف الموظف" />
          </Field>
        </div>

        {emp && preview && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-stone-700">معاينة مكافأة نهاية الخدمة</h3>
              <Badge tone="gold">{preview.rule || "نظام العمل السعودي"}</Badge>
            </div>
            {preview.eligible ? (
              <EosBreakdown r={preview} />
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                {!emp.hireDate && !emp.contractStart
                  ? "لا يوجد تاريخ مباشرة لهذا الموظف — أضف تاريخ المباشرة من ملف الموظف لاحتساب المكافأة."
                  : "تعذر الاحتساب — تحقق من الأجر وتواريخ الخدمة."}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* details drawer */}
      <SlideOver open={!!details} onClose={() => setDetails(null)}>
        {details && (
          <>
            <div className="flex items-start justify-between bg-pine-950 px-6 py-5 text-white">
              <div>
                <h2 className="text-[16px] font-bold">{details.employee?.name ?? "موظف محذوف"}</h2>
                <p className="mt-1 text-xs text-emerald-300/90">{terminationLabel(details.type)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/15">
                    آخر يوم عمل: <span className="tnum">{fmtDate(details.lastWorkingDay)}</span>
                  </span>
                  {details.noticeDate && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/15">
                      الإشعار: <span className="tnum">{fmtDate(details.noticeDate)}</span>
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setDetails(null)} className="cursor-pointer rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {typeof details.eosDetails === "object" && details.eosDetails !== null ? (
                <EosBreakdown r={details.eosDetails as EosResult} />
              ) : (
                <div className="rounded-xl border border-stone-200 px-4 py-3 text-xs text-stone-500">
                  لا توجد تفاصيل احتساب محفوظة — المكافأة المسجلة: <span className="tnum font-bold">{fmtMoney(details.eosAmount)}</span>
                </div>
              )}
              {details.reason && (
                <div className="rounded-xl border border-stone-200 px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-stone-500">سبب الإنهاء / ملاحظات</p>
                  <p className="text-[13px] leading-relaxed text-stone-600">{details.reason}</p>
                </div>
              )}
              <p className="text-center text-[11px] text-stone-400">
                سُجل في النظام بتاريخ <span className="tnum">{fmtDate(details.createdAt)}</span>
              </p>
            </div>
          </>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={deleteBusy}
        title="حذف سجل الإنهاء"
        message={`سيتم حذف سجل إنهاء «${deleting?.employee?.name ?? ""}» وإعادة الموظف إلى حالة «نشط». هل تريد المتابعة؟`}
        confirmLabel="حذف السجل"
      />
    </div>
  );
}
