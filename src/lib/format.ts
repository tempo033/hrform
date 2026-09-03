// Formatting & status helpers shared by client and server.

export const SAUDI_RE = /سعودي|سعودية|saudi/i;

const gregFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const hijriFmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const numFmt = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  maximumFractionDigits: 0,
});

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return isNaN(d.getTime()) ? null : d;
}

export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? gregFmt.format(d) : "—";
}

export function fmtHijri(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? hijriFmt.format(d) : "—";
}

/** Whole days from `from` until the given date (negative = past). */
export function daysUntil(value: string | Date | null | undefined, from: Date = new Date()): number | null {
  const d = toDate(value);
  if (!d) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  return `${numFmt.format(n)} ر.س`;
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  return intFmt.format(n);
}

export function totalWage(e: {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
}): number {
  return e.basicSalary + e.housingAllowance + e.transportAllowance + e.otherAllowances;
}

export type ExpiryState = "none" | "expired" | "critical" | "warning" | "notice" | "ok";

export interface ExpiryInfo {
  state: ExpiryState;
  days: number | null;
  label: string;
  pill: string;
  text: string;
  dot: string;
}

export function expiryInfo(value: string | Date | null | undefined, from?: Date): ExpiryInfo {
  const days = daysUntil(value, from);
  if (days === null) {
    return {
      state: "none",
      days,
      label: "غير مسجل",
      pill: "bg-stone-100 text-stone-500 ring-stone-200",
      text: "text-stone-400",
      dot: "bg-stone-300",
    };
  }
  if (days < 0) {
    return {
      state: "expired",
      days,
      label: `منتهية منذ ${Math.abs(days)} يوم`,
      pill: "bg-red-50 text-red-700 ring-red-200",
      text: "text-red-600",
      dot: "bg-red-500",
    };
  }
  if (days <= 30) {
    return {
      state: "critical",
      days,
      label: `متبقي ${days} يوم`,
      pill: "bg-orange-50 text-orange-700 ring-orange-200",
      text: "text-orange-600",
      dot: "bg-orange-500",
    };
  }
  if (days <= 60) {
    return {
      state: "warning",
      days,
      label: `متبقي ${days} يوم`,
      pill: "bg-amber-50 text-amber-700 ring-amber-200",
      text: "text-amber-600",
      dot: "bg-amber-500",
    };
  }
  if (days <= 90) {
    return {
      state: "notice",
      days,
      label: `متبقي ${days} يوم`,
      pill: "bg-sky-50 text-sky-700 ring-sky-200",
      text: "text-sky-600",
      dot: "bg-sky-500",
    };
  }
  return {
    state: "ok",
    days,
    label: `سارية (${days} يوم)`,
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  };
}

export function serviceLabelFrom(hireDate: string | null | undefined, until?: string | Date): string {
  const start = toDate(hireDate);
  if (!start) return "—";
  const end = toDate(until) ?? new Date();
  let years = end.getFullYear() - start.getFullYear();
  const anniv = new Date(start);
  anniv.setFullYear(start.getFullYear() + years);
  if (anniv > end) years -= 1;
  const lastAnniv = new Date(start);
  lastAnniv.setFullYear(start.getFullYear() + years);
  const remDays = Math.max(0, Math.round((end.getTime() - lastAnniv.getTime()) / 86400000));
  const months = Math.floor(remDays / 30.4375);
  const days = Math.round(remDays - months * 30.4375);
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? "سنة" : years === 2 ? "سنتان" : `${years} سنوات`);
  if (months > 0) parts.push(months === 1 ? "شهر" : months === 2 ? "شهران" : `${months} أشهر`);
  if (days > 0 || parts.length === 0) parts.push(days === 1 ? "يوم" : days === 2 ? "يومان" : `${days} يوم`);
  return parts.join(" و ");
}
