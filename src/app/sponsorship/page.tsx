"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IdCard, ArrowLeftRight, Landmark, ShieldCheck, AlarmClockCheck } from "lucide-react";
import { Badge, Card, EmptyState, SearchBox, Spinner, StatCard, TableShell, Td, Th, cx } from "@/components/ui";
import EmployeeDrawer from "@/components/employee-drawer";
import EmployeeForm from "@/components/employee-form";
import type { Employee } from "@/lib/types";
import { expiryInfo, fmtDate, serviceLabelFrom } from "@/lib/format";

type Tab = "company" | "external" | "all";

export default function SponsorshipPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [tab, setTab] = useState<Tab>("company");
  const [query, setQuery] = useState("");
  const [drawerEmp, setDrawerEmp] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  const expats = useMemo(() => (employees ?? []).filter((e) => !e.isSaudi && e.status === "active"), [employees]);
  const onCompany = expats.filter((e) => e.onSponsorship);
  const onExternal = expats.filter((e) => !e.onSponsorship);

  const visible = useMemo(() => {
    const base = tab === "company" ? onCompany : tab === "external" ? onExternal : expats;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((e) => [e.name, e.empNo, e.iqamaNumber ?? "", e.nationality].join(" ").toLowerCase().includes(q))
      : base;
    return [...filtered].sort((a, b) => (a.iqamaExpiry ?? "9999") < (b.iqamaExpiry ?? "9999") ? -1 : 1);
  }, [tab, onCompany, onExternal, expats, query]);

  async function toggleSponsorship(e: Employee) {
    setBusyId(e.id);
    try {
      const res = await fetch(`/api/employees/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partial: true, onSponsorship: !e.onSponsorship }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setEmployees((list) => (list ?? []).map((x) => (x.id === data.id ? data : x)));
    } catch {
      alert("تعذر تحديث حالة الكفالة");
    } finally {
      setBusyId(null);
    }
  }

  if (employees === null) return <Spinner className="py-32" />;

  const expiredOnCompany = onCompany.filter((e) => expiryInfo(e.iqamaExpiry).state === "expired").length;
  const soonOnCompany = onCompany.filter((e) => ["critical", "warning", "notice"].includes(expiryInfo(e.iqamaExpiry).state)).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="على كفالة الشركة" value={onCompany.length} icon={Landmark} tone="gold" sub="مقيمون مسجلون باسم المنشأة" />
        <StatCard title="كفالة خارجية" value={onExternal.length} icon={ShieldCheck} tone="pine" sub="منقولة خدماتهم أو على كفالة أخرى" />
        <StatCard title="إقامات منتهية (على الكفالة)" value={expiredOnCompany} icon={AlarmClockCheck} tone="red" sub="تستوجب تجديداً فورياً" />
        <StatCard title="تنتهي خلال 90 يوماً" value={soonOnCompany} icon={IdCard} tone="orange" sub="من المقيمين على كفالة الشركة" />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SearchBox value={query} onChange={setQuery} placeholder="بحث بالاسم أو رقم الإقامة…" className="w-full sm:w-80" />
        <div className="flex items-center gap-1.5">
          {([
            { key: "company", label: "على كفالة الشركة", count: onCompany.length },
            { key: "external", label: "كفالة خارجية", count: onExternal.length },
            { key: "all", label: "جميع المقيمين", count: expats.length },
          ] as { key: Tab; label: string; count: number }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                tab === t.key ? "bg-pine-900 text-white shadow-sm" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-emerald-600/40",
              )}
            >
              {t.label}
              <span className={cx("tnum mr-1.5 rounded-full px-1.5 text-[10px]", tab === t.key ? "bg-white/15" : "bg-stone-100")}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={IdCard} title="لا توجد سجلات" desc="المقيمون غير السعوديين يظهرون هنا حسب حالة الكفالة" />
        ) : (
          <TableShell minWidth={1050}>
            <thead>
              <tr>
                <Th>الموظف</Th>
                <Th>الجنسية</Th>
                <Th>رقم الإقامة</Th>
                <Th>انتهاء الإقامة</Th>
                <Th>مدة الخدمة</Th>
                <Th>حالة الكفالة</Th>
                <Th className="text-center">إجراء</Th>
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
                    <Td><span className="tnum text-xs font-semibold">{e.iqamaNumber ?? e.idNumber ?? "—"}</span></Td>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <span className="tnum text-xs font-semibold">{fmtDate(e.iqamaExpiry)}</span>
                        <Badge tone={tone} dot pulse={info.state === "expired"}>{info.label}</Badge>
                      </div>
                    </Td>
                    <Td><span className="text-xs">{serviceLabelFrom(e.hireDate)}</span></Td>
                    <Td>
                      {e.onSponsorship ? <Badge tone="gold" dot>على كفالة الشركة</Badge> : <Badge tone="stone" dot>كفالة خارجية</Badge>}
                    </Td>
                    <Td>
                      <div className="flex justify-center" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          disabled={busyId === e.id}
                          onClick={() => toggleSponsorship(e)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-600 transition-all hover:border-[#b8912f]/60 hover:text-[#8a6a1d] disabled:opacity-40"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          {e.onSponsorship ? "نقل إلى كفالة خارجية" : "نقل إلى كفالة الشركة"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Card>

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
