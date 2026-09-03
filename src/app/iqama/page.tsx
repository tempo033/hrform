"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, RefreshCcw, Save } from "lucide-react";
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, SearchBox, Spinner, TableShell, Td, Th, cx } from "@/components/ui";
import EmployeeDrawer from "@/components/employee-drawer";
import EmployeeForm from "@/components/employee-form";
import type { Employee } from "@/lib/types";
import { expiryInfo, fmtDate, fmtHijri, isoDate, type ExpiryState } from "@/lib/format";

type Filter = "all" | "expired" | "critical" | "warning" | "notice" | "ok";

const STATE_ORDER: Record<string, number> = { expired: 0, critical: 1, warning: 2, notice: 3, ok: 4, none: 5 };

export default function IqamaPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [renewing, setRenewing] = useState<Employee | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawerEmp, setDrawerEmp] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  const expats = useMemo(() => (employees ?? []).filter((e) => !e.isSaudi && e.status === "active"), [employees]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: expats.length, expired: 0, critical: 0, warning: 0, notice: 0, ok: 0 };
    for (const e of expats) {
      const s = expiryInfo(e.iqamaExpiry).state;
      if (s !== "none") c[s] += 1;
    }
    return c;
  }, [expats]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expats
      .filter((e) => {
        const s = expiryInfo(e.iqamaExpiry).state;
        if (filter !== "all" && s !== filter) return false;
        if (!q) return true;
        return [e.name, e.empNo, e.iqamaNumber ?? "", e.nationality].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const sa = STATE_ORDER[expiryInfo(a.iqamaExpiry).state];
        const sb = STATE_ORDER[expiryInfo(b.iqamaExpiry).state];
        if (sa !== sb) return sa - sb;
        return (a.iqamaExpiry ?? "9999") < (b.iqamaExpiry ?? "9999") ? -1 : 1;
      });
  }, [expats, filter, query]);

  function openRenew(e: Employee) {
    setRenewing(e);
    const base = e.iqamaExpiry && e.iqamaExpiry > isoDate() ? new Date(e.iqamaExpiry) : new Date();
    base.setFullYear(base.getFullYear() + 1);
    setRenewDate(isoDate(base));
  }

  async function saveRenewal() {
    if (!renewing || !renewDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${renewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partial: true, iqamaExpiry: renewDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEmployees((list) => (list ?? []).map((x) => (x.id === data.id ? data : x)));
      setRenewing(null);
    } catch {
      alert("تعذر حفظ التجديد");
    } finally {
      setSaving(false);
    }
  }

  if (employees === null) return <Spinner className="py-32" />;

  const chips: { key: Filter; label: string; tone: string; active: string }[] = [
    { key: "all", label: "الكل", tone: "bg-white text-stone-600 ring-stone-200", active: "bg-pine-900 text-white" },
    { key: "expired", label: "منتهية", tone: "bg-white text-red-600 ring-red-200", active: "bg-red-600 text-white" },
    { key: "critical", label: "خلال 30 يوماً", tone: "bg-white text-orange-600 ring-orange-200", active: "bg-orange-500 text-white" },
    { key: "warning", label: "خلال 60 يوماً", tone: "bg-white text-amber-600 ring-amber-200", active: "bg-amber-500 text-white" },
    { key: "notice", label: "خلال 90 يوماً", tone: "bg-white text-sky-600 ring-sky-200", active: "bg-sky-600 text-white" },
    { key: "ok", label: "سارية", tone: "bg-white text-emerald-700 ring-emerald-200", active: "bg-emerald-700 text-white" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {chips.filter((c) => c.key !== "all").map((c) => (
          <Card
            key={c.key}
            onClick={() => setFilter(filter === c.key ? "all" : c.key)}
            className={cx("cursor-pointer p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md", filter === c.key && "ring-2 ring-emerald-700")}
          >
            <p className={cx("tnum text-2xl font-bold", c.key === "expired" ? "text-red-600" : c.key === "critical" ? "text-orange-500" : c.key === "warning" ? "text-amber-500" : c.key === "notice" ? "text-sky-600" : "text-emerald-700")}>
              {counts[c.key]}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-stone-500">{c.label}</p>
          </Card>
        ))}
        <Card className="flex flex-col items-center justify-center bg-pine-950 p-4 text-center text-white">
          <p className="tnum text-2xl font-bold text-emerald-300">{counts.all}</p>
          <p className="mt-1 text-[11px] font-semibold text-stone-400">إجمالي المقيمين</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchBox value={query} onChange={setQuery} placeholder="بحث بالاسم أو رقم الإقامة…" className="w-full sm:w-80" />
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cx("cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-semibold ring-1 transition-all", filter === c.key ? c.active : c.tone)}
            >
              {c.label}
              <span className={cx("tnum mr-1.5 rounded-full px-1.5 text-[10px]", filter === c.key ? "bg-white/20" : "bg-stone-100 text-stone-500")}>
                {counts[c.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="لا توجد إقامات ضمن هذا التصنيف" desc="المقيمون غير السعوديين النشطين يظهرون هنا مرتبين حسب أولوية التجديد" />
        ) : (
          <TableShell minWidth={1050}>
            <thead>
              <tr>
                <Th>الموظف</Th>
                <Th>الجنسية</Th>
                <Th>رقم الإقامة</Th>
                <Th>تاريخ الانتهاء</Th>
                <Th>الموافق هجرياً</Th>
                <Th>المدة المتبقية</Th>
                <Th>الحالة</Th>
                <Th className="text-center">تجديد</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const info = expiryInfo(e.iqamaExpiry);
                const tone = info.state === "expired" ? "red" : info.state === "critical" ? "orange" : info.state === "warning" ? "amber" : info.state === "notice" ? "sky" : info.state === "ok" ? "emerald" : "stone";
                return (
                  <tr key={e.id} onClick={() => setDrawerEmp(e)} className="cursor-pointer transition-colors hover:bg-emerald-50/40">
                    <Td>
                      <div>
                        <p className="font-semibold text-stone-800">{e.name}</p>
                        <p className="text-[11px] text-stone-400">
                          <span className="tnum">{e.empNo}</span> · {e.jobTitle || "—"}
                        </p>
                      </div>
                    </Td>
                    <Td>{e.nationality || "—"}</Td>
                    <Td><span className="tnum text-xs font-bold text-pine-800">{e.iqamaNumber ?? e.idNumber ?? "—"}</span></Td>
                    <Td><span className="tnum text-xs font-semibold">{fmtDate(e.iqamaExpiry)}</span></Td>
                    <Td><span className="text-[11px] text-stone-500">{fmtHijri(e.iqamaExpiry)}</span></Td>
                    <Td>
                      {info.days === null ? (
                        <span className="text-xs text-stone-400">—</span>
                      ) : info.days < 0 ? (
                        <span className="tnum text-sm font-bold text-red-600">-{Math.abs(info.days)} يوم</span>
                      ) : (
                        <span className={cx("tnum text-sm font-bold", info.text)}>{info.days} يوم</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={tone} dot pulse={info.state === "expired"}>
                        {info.state === "expired" ? "منتهية" : info.state === "critical" ? "حرجة" : info.state === "warning" ? "تجديد قريب" : info.state === "notice" ? "قيد المتابعة" : info.state === "ok" ? "سارية" : "غير مسجلة"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-center" onClick={(ev) => ev.stopPropagation()}>
                        <Button size="sm" variant="outline" icon={RefreshCcw} onClick={() => openRenew(e)}>
                          تسجيل تجديد
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Card>

      <Dialog
        open={!!renewing}
        onClose={() => setRenewing(null)}
        icon={RefreshCcw}
        title={`تجديد إقامة — ${renewing?.name ?? ""}`}
        subtitle={`الإقامة الحالية ${renewing?.iqamaExpiry ? `تنتهي في ${fmtDate(renewing.iqamaExpiry)}` : "غير مسجلة الانتهاء"}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenewing(null)} disabled={saving}>إلغاء</Button>
            <Button onClick={saveRenewal} loading={saving} icon={Save}>حفظ التجديد</Button>
          </>
        }
      >
        <Field label="تاريخ انتهاء الإقامة الجديد" required hint="يتم الاقتراح تلقائياً بإضافة سنة من اليوم أو من تاريخ انتهاء ساري">
          <Input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} className="tnum" />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "+ سنة من اليوم", fn: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); setRenewDate(isoDate(d)); } },
            { label: "+ سنتان من اليوم", fn: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); setRenewDate(isoDate(d)); } },
            { label: "+ سنة من الانتهاء الحالي", fn: () => { const d = renewing?.iqamaExpiry ? new Date(renewing.iqamaExpiry) : new Date(); d.setFullYear(d.getFullYear() + 1); setRenewDate(isoDate(d)); } },
          ].map((p) => (
            <button
              key={p.label}
              onClick={p.fn}
              className="cursor-pointer rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-bold text-stone-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Dialog>

      <EmployeeDrawer
        employee={drawerEmp}
        onClose={() => setDrawerEmp(null)}
        onEdit={(emp) => {
          setDrawerEmp(null);
          setEditing(emp);
          setFormOpen(true);
        }}
      />
      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={(saved) => setEmployees((list) => (list ?? []).map((x) => (x.id === saved.id ? saved : x)))}
      />
    </div>
  );
}
