// Server-side helpers: serialization + input normalization.
import type { EmployeeRow, TerminationRow } from "@/db/schema";
import type { Employee, TerminationRecord, TerminationEmployee } from "./types";
import { SAUDI_RE } from "./format";

const num = (v: string | null): number => (v === null ? 0 : Number(v));

export function serializeEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id,
    empNo: r.empNo,
    name: r.name,
    nationality: r.nationality,
    isSaudi: r.isSaudi,
    idNumber: r.idNumber,
    iqamaNumber: r.iqamaNumber,
    iqamaExpiry: r.iqamaExpiry,
    passportNumber: r.passportNumber,
    jobTitle: r.jobTitle,
    department: r.department,
    hireDate: r.hireDate,
    contractType: r.contractType,
    contractStart: r.contractStart,
    contractEnd: r.contractEnd,
    basicSalary: num(r.basicSalary),
    housingAllowance: num(r.housingAllowance),
    transportAllowance: num(r.transportAllowance),
    otherAllowances: num(r.otherAllowances),
    phone: r.phone,
    email: r.email,
    onSponsorship: r.onSponsorship,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function serializeTermination(
  r: TerminationRow,
  employee: TerminationEmployee | null,
): TerminationRecord {
  return {
    id: r.id,
    employeeId: r.employeeId,
    type: r.type,
    noticeDate: r.noticeDate,
    lastWorkingDay: r.lastWorkingDay,
    reason: r.reason,
    eosAmount: r.eosAmount === null ? null : Number(r.eosAmount),
    eosDetails: r.eosDetails,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    employee,
  };
}

export interface EmployeeInput {
  empNo: string;
  name: string;
  nationality: string;
  isSaudi: boolean;
  idNumber: string;
  iqamaNumber: string | null;
  iqamaExpiry: string | null;
  passportNumber: string | null;
  jobTitle: string;
  department: string;
  hireDate: string | null;
  contractType: string;
  contractStart: string | null;
  contractEnd: string | null;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  phone: string | null;
  email: string | null;
  onSponsorship: boolean;
  notes: string | null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v).trim();
}

function strOrNull(v: unknown): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

function money(v: unknown): string {
  if (typeof v === "number" && isFinite(v)) return String(Math.max(0, Math.round(v * 100) / 100));
  const s = str(v).replace(/[,،\s]/g, "");
  if (!s) return "0";
  const n = Number(s);
  return isFinite(n) ? String(Math.max(0, Math.round(n * 100) / 100)) : "0";
}

/** Accepts ISO `yyyy-mm-dd` or common `dd/mm/yyyy` shapes. */
function dateOrNull(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  return null;
}

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = str(v).toLowerCase();
  return s === "true" || s === "1" || s === "نعم" || s === "yes" || s === "صح' || s === 'y";
}

export function normalizeEmployeeInput(
  body: Record<string, unknown>,
): { ok: true; data: EmployeeInput } | { ok: false; message: string } {
  const empNo = str(body.empNo);
  const name = str(body.name);
  if (!empNo) return { ok: false, message: "الرقم الوظيفي مطلوب" };
  if (!name) return { ok: false, message: "اسم الموظف مطلوب" };

  const nationality = str(body.nationality);
  const isSaudi = SAUDI_RE.test(nationality);
  const contractType = str(body.contractType) || "محدد المدة";

  return {
    ok: true,
    data: {
      empNo,
      name,
      nationality,
      isSaudi,
      idNumber: str(body.idNumber) || str(body.iqamaNumber),
      iqamaNumber: strOrNull(body.iqamaNumber) ?? (isSaudi ? null : str(body.idNumber) || null),
      iqamaExpiry: dateOrNull(body.iqamaExpiry),
      passportNumber: strOrNull(body.passportNumber),
      jobTitle: str(body.jobTitle),
      department: str(body.department),
      hireDate: dateOrNull(body.hireDate),
      contractType,
      contractStart: dateOrNull(body.contractStart),
      contractEnd: dateOrNull(body.contractEnd),
      basicSalary: money(body.basicSalary),
      housingAllowance: money(body.housingAllowance),
      transportAllowance: money(body.transportAllowance),
      otherAllowances: money(body.otherAllowances),
      phone: strOrNull(body.phone),
      email: strOrNull(body.email),
      onSponsorship: body.onSponsorship === undefined ? !isSaudi : bool(body.onSponsorship),
      notes: strOrNull(body.notes),
    },
  };
}
