"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  UploadCloud,
  Download,
  FileSpreadsheet,
  SquarePen,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  SearchBox,
  Spinner,
  TableShell,
  Td,
  Th,
  cx,
} from "@/components/ui";
import EmployeeForm from "@/components/employee-form";
import ImportDialog from "@/components/import-dialog";
import EmployeeDrawer from "@/components/employee-drawer";
import type { Employee } from "@/lib/types";
import { expiryInfo, fmtDate, fmtMoney, totalWage } from "@/lib/format";

type FilterKey = "all" | "saudi" | "expat" | "sponsorship" | "terminated";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "saudi", label: "السعوديون" },
  { key: "expat", label: "غير السعوديين" },
  { key: "sponsorship", label: "على الكفالة" },
  { key: "terminated", label: "منتهية خدمتهم" },
];

function iqamaCell(e: Employee) {
  if (e.isSaudi) return <span className="text-xs text-stone-400">مواطن سعودي</span>;
  const info = expiryInfo(e.iqamaExpiry);
  const tone = info.state === "expired" ? "red" : info.state === "critical" ? "orange" : info.state === "warning" ? "amber" : info.state === "notice" ? "sky" : info.state === "ok" ? "emerald" : "stone";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tnum text-xs font-semibold text-stone-700">{fmtDate(e.iqamaExpiry)}</span>
      <Badge tone={tone} dot pulse={info.state === "expired"}>{info.label}</Badge>
    </div>
  );
}

export default function EmployeesClient() {
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [drawerEmp, setDrawerEmp] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
    } else if (searchParams.get("import") === "1") {
      setImportOpen(true);
    }
  }, [searchParams]);

  const counts = useMemo(() => {
    return {
      all: employees.length,
      saudi: employees.filter((e) => e.isSaudi && e.status === "active").length,
      expat: employees.filter((e) => !e.isSaudi && e.status === "active").length,
      sponsorship: employees.filter((e) => e.onSponsorship && !e.isSaudi && e.status === "active").length,
      terminated: employees.filter((e) => e.status === "terminated").length,
    };
  }, [employees]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (filter === "saudi" && (!e.isSaudi || e.status !== "active")) return false;
      if (filter === "expat" && (e.isSaudi || e.status !== "active")) return false;
      if (filter === "sponsorship" && (!e.onSponsorship || e.isSaudi || e.status !== "active")) return false;
      if (filter === "terminated" && e.status !== "terminated") return false;
      if (filter === "all" && false) return false;
      if (!q) return true;
      return [e.name, e.empNo, e.idNumber, e.jobTitle, e.department, e.nationality]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [employees, query, filter]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/employees/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEmployees((list) => list.filter((e) => e.id !== deleting.id));
      if (drawerEmp?.id === deleting.id) setDrawerEmp(null);
      setDeleting(null);
    } catch {
      alert("تعذر حذف الموظف");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchBox value={query} onChange={setQuery} placeholder="بحث بالاسم أو الرقم الوظيفي أو الهوية…" className="w-full sm:w-80" />
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cx(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                filter === f.key
                  ? "bg-pine-900 text-white shadow-sm"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-emerald-600/40",
              )}
            >
              {f.label}
              <span className={cx("tnum mr-1.5 rounded-full px-1.5 text-[10px]", filter === f.key ? "bg-white/15" : "bg-stone-100")}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/employees/template">
            <Button variant="outline" size="sm" icon={FileSpreadsheet}>نموذج الإكسل</Button>
          </a>
          <Button variant="outline" size="sm" icon={UploadCloud} onClick={() => setImportOpen(true)}>
            استيراد Excel
          </Button>
          <a href="/api/employees/export">
            <Button variant="outline" size="sm" icon={Download}>تصدير</Button>
          </a>
          <Button
            size="sm"
            icon={UserPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* table */}
      <Card>
        {loading ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={employees.length === 0 ? "لا يوجد موظفون بعد" : "لا توجد نتائج مطابقة"}
            desc={
              employees.length === 0
                ? "ابدأ بإضافة موظف جديد يدوياً أو استرد دفعة كاملة من ملف Excel"
                : "جرّب تعديل كلمة البحث أو تغيير عامل التصفية"
            }
            action={
              employees.length === 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <Button size="sm" icon={UserPlus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                    إضافة موظف
                  </Button>
                  <Button size="sm" variant="outline" icon={UploadCloud} onClick={() => setImportOpen(true)}>
                    استيراد من Excel
                  </Button>
                </div>
              )
            }
          />
        ) : (
          <TableShell minWidth={1150}>
            <thead>
              <tr>
                <Th>الرقم الوظيفي</Th>
                <Th>الموظف</Th>
                <Th>الجنسية</Th>
                <Th>رقم الهوية / الإقامة</Th>
                <Th>تاريخ المباشرة</Th>
                <Th>العقد</Th>
                <Th>إجمالي الأجر</Th>
                <Th>انتهاء الإقامة</Th>
                <Th>الحالة</Th>
                <Th className="text-center">إجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setDrawerEmp(e)}
                  className={cx("cursor-pointer transition-colors hover:bg-emerald-50/40", e.status === "terminated" && "opacity-60")}
                >
                  <Td><span className="tnum font-bold text-pine-800">{e.empNo}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pine-900/[0.06] text-[11px] font-bold text-pine-800">
                        {e.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join(" ")}
                      </span>
                      <div>
                        <p className="font-semibold text-stone-800">{e.name}</p>
                        <p className="text-[11px] text-stone-400">{e.jobTitle || "—"} · {e.department || "بدون قسم"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {e.nationality || "—"}
                      {e.onSponsorship && !e.isSaudi && <Badge tone="gold">على الكفالة</Badge>}
                    </div>
                  </Td>
                  <Td><span className="tnum text-xs">{e.idNumber || "—"}</span></Td>
                  <Td><span className="tnum text-xs">{fmtDate(e.hireDate)}</span></Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{e.contractType}</span>
                      {e.contractType === "محدد المدة" && e.contractEnd && (
                        <span className="tnum text-[11px] text-stone-400">حتى {fmtDate(e.contractEnd)}</span>
                      )}
                    </div>
                  </Td>
                  <Td><span className="tnum font-semibold text-emerald-800">{fmtMoney(totalWage(e))}</span></Td>
                  <Td>{iqamaCell(e)}</Td>
                  <Td>
                    {e.status === "active" ? (
                      <Badge tone="emerald" dot>نشط</Badge>
                    ) : (
                      <Badge tone="red">منتهية خدمته</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-center gap-0.5" onClick={(ev) => ev.stopPropagation()}>
                      <IconButton icon={Eye} label="عرض الملف" onClick={() => setDrawerEmp(e)} />
                      <IconButton
                        icon={SquarePen}
                        label="تعديل"
                        tone="emerald"
                        onClick={() => {
                          setEditing(e);
                          setFormOpen(true);
                        }}
                      />
                      <IconButton icon={Trash2} label="حذف" tone="danger" onClick={() => setDeleting(e)} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={(saved) => {
          setEmployees((list) => {
            const idx = list.findIndex((e) => e.id === saved.id);
            if (idx === -1) return [...list, saved].sort((a, b) => a.empNo.localeCompare(b.empNo, "ar"));
            const copy = [...list];
            copy[idx] = saved;
            return copy;
          });
        }}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={load} />
      <EmployeeDrawer
        employee={drawerEmp}
        onClose={() => setDrawerEmp(null)}
        onEdit={(emp) => {
          setDrawerEmp(null);
          setEditing(emp);
          setFormOpen(true);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletingBusy}
        title="حذف الموظف"
        message={`سيتم حذف «${deleting?.name}» نهائياً من النظام مع جميع سجلاته المرتبطة (عمليات الإنهاء والمستحقات). هل أنت متأكد؟`}
        confirmLabel="حذف نهائي"
      />
    </div>
  );
}
