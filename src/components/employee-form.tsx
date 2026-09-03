"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Save, UserPen, UserPlus } from "lucide-react";
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea, cx } from "./ui";
import type { Employee } from "@/lib/types";
import { SAUDI_RE, fmtMoney } from "@/lib/format";

export interface EmployeeFormState {
  empNo: string;
  name: string;
  nationality: string;
  idNumber: string;
  iqamaNumber: string;
  iqamaExpiry: string;
  passportNumber: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  contractType: string;
  contractStart: string;
  contractEnd: string;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  phone: string;
  email: string;
  onSponsorship: boolean;
  notes: string;
}

const emptyForm: EmployeeFormState = {
  empNo: "",
  name: "",
  nationality: "",
  idNumber: "",
  iqamaNumber: "",
  iqamaExpiry: "",
  passportNumber: "",
  jobTitle: "",
  department: "",
  hireDate: "",
  contractType: "محدد المدة",
  contractStart: "",
  contractEnd: "",
  basicSalary: "",
  housingAllowance: "",
  transportAllowance: "",
  otherAllowances: "",
  phone: "",
  email: "",
  onSponsorship: true,
  notes: "",
};

function fromEmployee(e: Employee): EmployeeFormState {
  return {
    empNo: e.empNo,
    name: e.name,
    nationality: e.nationality,
    idNumber: e.idNumber,
    iqamaNumber: e.iqamaNumber ?? "",
    iqamaExpiry: e.iqamaExpiry ?? "",
    passportNumber: e.passportNumber ?? "",
    jobTitle: e.jobTitle,
    department: e.department,
    hireDate: e.hireDate ?? "",
    contractType: e.contractType,
    contractStart: e.contractStart ?? "",
    contractEnd: e.contractEnd ?? "",
    basicSalary: e.basicSalary ? String(e.basicSalary) : "",
    housingAllowance: e.housingAllowance ? String(e.housingAllowance) : "",
    transportAllowance: e.transportAllowance ? String(e.transportAllowance) : "",
    otherAllowances: e.otherAllowances ? String(e.otherAllowances) : "",
    phone: e.phone ?? "",
    email: e.email ?? "",
    onSponsorship: e.onSponsorship,
    notes: e.notes ?? "",
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-2 first:mt-0">
      <span className="h-4 w-1 rounded-full bg-emerald-700" />
      <h3 className="text-[13px] font-bold text-stone-700">{children}</h3>
    </div>
  );
}

export default function EmployeeForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (e: Employee) => void;
  initial?: Employee | null;
}) {
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? fromEmployee(initial) : emptyForm);
      setError(null);
      setSaving(false);
    }
  }, [open, initial]);

  const isSaudi = SAUDI_RE.test(form.nationality);

  const set = <K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const total = useMemo(() => {
    return (
      (parseFloat(form.basicSalary) || 0) +
      (parseFloat(form.housingAllowance) || 0) +
      (parseFloat(form.transportAllowance) || 0) +
      (parseFloat(form.otherAllowances) || 0)
    );
  }, [form.basicSalary, form.housingAllowance, form.transportAllowance, form.otherAllowances]);

  async function submit() {
    setError(null);
    if (!form.empNo.trim()) return setError("الرقم الوظيفي مطلوب");
    if (!form.name.trim()) return setError("اسم الموظف مطلوب");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (isSaudi) payload.onSponsorship = false;
      if (!payload.iqamaNumber && !isSaudi) payload.iqamaNumber = form.idNumber;
      const res = await fetch(initial ? `/api/employees/${initial.id}` : "/api/employees", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "تعذر الحفظ");
      onSaved(data as Employee);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      icon={initial ? UserPen : UserPlus}
      title={initial ? `تعديل بيانات الموظف — ${initial.name}` : "إضافة موظف جديد"}
      subtitle={
        initial
          ? `الرقم الوظيفي ${initial.empNo} — آخر تحديث ${new Date(initial.updatedAt).toLocaleDateString("ar-SA")}`
          : "أدخل بيانات الموظف وسيظهر تلقائياً في قوائم الإقامات والكفالة وحساب نهاية الخدمة"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={submit} loading={saving} icon={Save}>
            {initial ? "حفظ التعديلات" : "حفظ الموظف"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <SectionTitle>البيانات الأساسية</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="الرقم الوظيفي" required>
          <Input value={form.empNo} onChange={(e) => set("empNo", e.target.value)} placeholder="مثال: 1045" />
        </Field>
        <Field label="اسم الموظف" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="الاسم الكامل" />
        </Field>
        <Field label="الجنسية" hint={form.nationality ? (isSaudi ? "موظف سعودي — لا تنطبق عليه بيانات الإقامة" : "موظف غير سعودي — أدخل بيانات الإقامة أدناه") : undefined}>
          <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="سعودي / مصري / هندي…" />
        </Field>
        <Field label={isSaudi ? "رقم الهوية الوطنية" : "رقم الهوية / الإقامة"}>
          <Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} className="tnum" placeholder="10 أرقام" />
        </Field>
        <Field label="المسمى الوظيفي">
          <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="مثال: مهندس موقع" />
        </Field>
        <Field label="القسم / الإدارة">
          <Input value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="مثال: العمليات" />
        </Field>
      </div>

      <div className={cx(isSaudi && "pointer-events-none opacity-45")}>
        <SectionTitle>الإقامة والكفالة</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="رقم الإقامة" hint="يُنسخ تلقائياً من رقم الهوية عند تركه فارغاً">
            <Input value={form.iqamaNumber} onChange={(e) => set("iqamaNumber", e.target.value)} className="tnum" />
          </Field>
          <Field label="تاريخ انتهاء الإقامة">
            <Input type="date" value={form.iqamaExpiry} onChange={(e) => set("iqamaExpiry", e.target.value)} className="tnum" />
          </Field>
          <Field label="رقم جواز السفر">
            <Input value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} className="tnum" />
          </Field>
          <div className="flex items-end pb-0.5">
            <Checkbox
              checked={form.onSponsorship && !isSaudi}
              onChange={(v) => set("onSponsorship", v)}
              label="الموظف على كفالة الشركة"
              desc="يظهر في قائمة الموظفين على الكفالة"
            />
          </div>
        </div>
      </div>

      <SectionTitle>التعيين والعقد</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="تاريخ المباشرة" hint="أساس احتساب مدة الخدمة ومكافأة نهاية الخدمة">
          <Input type="date" value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} className="tnum" />
        </Field>
        <Field label="نوع العقد">
          <Select value={form.contractType} onChange={(e) => set("contractType", e.target.value)}>
            <option>محدد المدة</option>
            <option>غير محدد المدة</option>
          </Select>
        </Field>
        <Field label="تاريخ بداية العقد">
          <Input type="date" value={form.contractStart} onChange={(e) => set("contractStart", e.target.value)} className="tnum" />
        </Field>
        <Field label="تاريخ نهاية العقد" hint="يترك فارغاً للعقود غير محددة المدة">
          <Input type="date" value={form.contractEnd} onChange={(e) => set("contractEnd", e.target.value)} className="tnum" disabled={form.contractType === "غير محدد المدة"} />
        </Field>
      </div>

      <SectionTitle>الأجر والبدلات الشهرية (ر.س)</SectionTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="الراتب الأساسي">
          <Input type="number" min="0" step="any" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} className="tnum text-left" placeholder="0" />
        </Field>
        <Field label="بدل السكن">
          <Input type="number" min="0" step="any" value={form.housingAllowance} onChange={(e) => set("housingAllowance", e.target.value)} className="tnum text-left" placeholder="0" />
        </Field>
        <Field label="بدل النقل">
          <Input type="number" min="0" step="any" value={form.transportAllowance} onChange={(e) => set("transportAllowance", e.target.value)} className="tnum text-left" placeholder="0" />
        </Field>
        <Field label="بدلات أخرى">
          <Input type="number" min="0" step="any" value={form.otherAllowances} onChange={(e) => set("otherAllowances", e.target.value)} className="tnum text-left" placeholder="0" />
        </Field>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-700/20 bg-emerald-50/60 px-4 py-3">
        <span className="text-xs font-bold text-emerald-900">إجمالي الأجر الشهري (أساس احتساب نهاية الخدمة)</span>
        <span className="tnum text-lg font-bold text-emerald-800">{fmtMoney(total)}</span>
      </div>

      <SectionTitle>بيانات التواصل والملاحظات</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="رقم الجوال">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="tnum text-left" placeholder="05xxxxxxxx" />
        </Field>
        <Field label="البريد الإلكتروني">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="text-left" placeholder="name@company.com" />
        </Field>
        <Field label="ملاحظات" className="sm:col-span-2">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="ملاحظات إدارية اختيارية…" />
        </Field>
      </div>
    </Dialog>
  );
}
