// احتساب مكافأة نهاية الخدمة وفق نظام العمل السعودي (المواد 84، 85، 80، 87).
import { toDate } from "./format";

export type TerminationCode =
  | "resignation"
  | "employer_termination"
  | "contract_end"
  | "mutual"
  | "article80"
  | "article87";

export interface TerminationTypeInfo {
  code: TerminationCode;
  label: string;
  article: string;
  hint: string;
}

export const TERMINATION_TYPES: TerminationTypeInfo[] = [
  {
    code: "employer_termination",
    label: "إنهاء العقد من صاحب العمل",
    article: "المادة (84) من نظام العمل",
    hint: "تستحق المكافأة كاملة عند إنهاء العلاقة من جهة صاحب العمل.",
  },
  {
    code: "contract_end",
    label: "انتهاء مدة العقد",
    article: "المادة (74) من نظام العمل",
    hint: "انتهاء العقد محدد المدة بتاريخه دون تجديد — تستحق المكافأة كاملة.",
  },
  {
    code: "mutual",
    label: "إنهاء بالاتفاق المتبادل",
    article: "المادة (74) من نظام العمل",
    hint: "إنهاء العقد بالتراضي الكتابي بين الطرفين — تستحق المكافأة كاملة.",
  },
  {
    code: "resignation",
    label: "استقالة الموظف",
    article: "المادة (85) من نظام العمل",
    hint: "الاستقالة: لا شيء قبل سنتين، الثلث من 2 لأقل من 5، الثلثان من 5 لأقل من 10، وكاملة بعد 10 سنوات.",
  },
  {
    code: "article87",
    label: "استقالة لظروف قاهرة (المادة 87)",
    article: "المادة (87) من نظام العمل",
    hint: "ترك العمل لظروف قاهرة، أو استقالة العاملة خلال 6 أشهر من الزواج أو 3 أشهر من الوضع — مكافأة كاملة.",
  },
  {
    code: "article80",
    label: "فصل لسبب مشروع (المادة 80)",
    article: "المادة (80) من نظام العمل",
    hint: "عند ثبوت أحد أسباب المادة (80) يُفصل العامل دون مكافأة نهاية خدمة.",
  },
];

export function terminationLabel(code: string): string {
  return TERMINATION_TYPES.find((t) => t.code === code)?.label ?? code;
}

export interface EosResult {
  eligible: boolean;
  serviceDays: number;
  years: number;
  months: number;
  days: number;
  totalYears: number;
  serviceLabel: string;
  wage: number;
  firstFiveMonths: number;
  firstFiveAmount: number;
  afterFiveMonths: number;
  afterFiveAmount: number;
  grossMonths: number;
  grossAmount: number;
  factor: number;
  factorLabel: string;
  netAmount: number;
  rule: string;
  typeLabel: string;
}

function monthsFactorFor(type: TerminationCode, totalYears: number): { factor: number; label: string } {
  if (type === "article80") {
    return { factor: 0, label: "لا تستحق المكافأة عند ثبوت سبب الفصل (المادة 80)" };
  }
  if (type === "resignation") {
    if (totalYears < 2) return { factor: 0, label: "لا تستحق المكافأة — مدة الخدمة أقل من سنتين" };
    if (totalYears < 5) return { factor: 1 / 3, label: "ثلث المكافأة — خدمة من سنتين لأقل من خمس سنوات" };
    if (totalYears < 10) return { factor: 2 / 3, label: "ثلثا المكافأة — خدمة من خمس لأقل من عشر سنوات" };
    return { factor: 1, label: "كامل المكافأة — خدمة عشر سنوات فأكثر" };
  }
  return { factor: 1, label: "كامل المكافأة" };
}

export function calculateEOS(
  wage: number,
  hireDate: string | null | undefined,
  endDate: string | null | undefined,
  type: TerminationCode,
): EosResult {
  const start = toDate(hireDate);
  const end = toDate(endDate) ?? new Date();
  const typeInfo = TERMINATION_TYPES.find((t) => t.code === code(type));
  const empty: EosResult = {
    eligible: false,
    serviceDays: 0,
    years: 0,
    months: 0,
    days: 0,
    totalYears: 0,
    serviceLabel: "—",
    wage,
    firstFiveMonths: 0,
    firstFiveAmount: 0,
    afterFiveMonths: 0,
    afterFiveAmount: 0,
    grossMonths: 0,
    grossAmount: 0,
    factor: 0,
    factorLabel: "—",
    netAmount: 0,
    rule: typeInfo?.article ?? "",
    typeLabel: typeInfo?.label ?? "",
  };
  if (!start || !wage || wage <= 0 || end < start) return empty;

  const serviceDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  const totalYears = serviceDays / 365;

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
  if (years > 0) parts.push(years === 1 ? "سنة واحدة" : years === 2 ? "سنتان" : `${years} سنوات`);
  if (months > 0) parts.push(months === 1 ? "شهر واحد" : months === 2 ? "شهران" : `${months} أشهر`);
  if (days > 0 || parts.length === 0) parts.push(days === 1 ? "يوم واحد" : days === 2 ? "يومان" : `${days} يوماً`);

  // مكافأة نصف شهر عن كل سنة من السنوات الخمس الأولى، وشهر كامل عمّا زاد.
  const firstFiveMonths = Math.min(totalYears, 5) * 0.5;
  const afterFiveMonths = Math.max(totalYears - 5, 0);
  const firstFiveAmount = firstFiveMonths * wage;
  const afterFiveAmount = afterFiveMonths * wage;
  const grossMonths = firstFiveMonths + afterFiveMonths;
  const grossAmount = firstFiveAmount + afterFiveAmount;

  const { factor, label: factorLabel } = monthsFactorFor(type, totalYears);
  const netAmount = grossAmount * factor;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    eligible: true,
    serviceDays,
    years,
    months,
    days,
    totalYears,
    serviceLabel: parts.join(" و "),
    wage,
    firstFiveMonths: round2(firstFiveMonths),
    firstFiveAmount: round2(firstFiveAmount),
    afterFiveMonths: round2(afterFiveMonths),
    afterFiveAmount: round2(afterFiveAmount),
    grossMonths: round2(grossMonths),
    grossAmount: round2(grossAmount),
    factor,
    factorLabel,
    netAmount: round2(netAmount),
    rule: typeInfo?.article ?? "",
    typeLabel: typeInfo?.label ?? "",
  };
}

function code(t: TerminationCode): TerminationCode {
  return t;
}
