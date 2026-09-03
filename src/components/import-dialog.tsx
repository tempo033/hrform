"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileUp, UploadCloud, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Badge, Button, Dialog } from "./ui";

type Stage = "upload" | "preview" | "result";

interface ParsedRow {
  index: number;
  payload: Record<string, unknown>;
  error: string | null;
  summary: { empNo: string; name: string; nationality: string; jobTitle: string };
}

interface RowResult {
  row: number;
  empNo: string;
  message: string;
}

const ALIASES: Record<string, string[]> = {
  empNo: ["الرقم الوظيفي", "رقم الموظف", "الرقم الوظيفى"],
  name: ["الاسم", "اسم الموظف", "الاسم الكامل", "الاسم رباعيا"],
  nationality: ["الجنسية"],
  idNumber: ["رقم الهوية / الاقامة", "رقم الهوية/الاقامة", "رقم الهوية", "رقم الاقامة", "رقم الهويه/الاقامه"],
  iqamaExpiry: ["تاريخ انتهاء الاقامة", "انتهاء الاقامة"],
  passportNumber: ["رقم الجواز", "رقم جواز السفر", "الجواز"],
  jobTitle: ["المسمي الوظيفي", "الوظيفة", "المهنة"],
  department: ["القسم", "الادارة"],
  hireDate: ["تاريخ المباشرة", "تاريخ التعيين", "تاريخ الالتحاق", "تاريخ التوظيف"],
  contractType: ["نوع العقد"],
  contractStart: ["تاريخ بداية العقد", "بداية العقد"],
  contractEnd: ["تاريخ نهاية العقد", "نهاية العقد"],
  basicSalary: ["الراتب الاساسي", "الاساسي", "الراتب"],
  housingAllowance: ["بدل السكن"],
  transportAllowance: ["بدل النقل"],
  otherAllowances: ["بدلات اخري", "بدل اخر"],
  phone: ["الجوال", "رقم الجوال", "الهاتف", "رقم الهاتف"],
  email: ["البريد الالكتروني", "الايميل", "البريد"],
  onSponsorship: ["علي كفالة الشركة", "علي الكفالة", "الكفالة"],
  notes: ["ملاحظات"],
};

function normAr(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/[ةه]/g, "ه")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const FIELD_BY_HEADER = new Map<string, string>();
for (const [field, list] of Object.entries(ALIASES)) {
  for (const alias of list) FIELD_BY_HEADER.set(normAr(alias), field);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDateCell(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d && d.y) return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    return null;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  return null;
}

const DATE_FIELDS = new Set(["iqamaExpiry", "hireDate", "contractStart", "contractEnd"]);
const NUM_FIELDS = new Set(["basicSalary", "housingAllowance", "transportAllowance", "otherAllowances"]);

export default function ImportDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed: number; errors: RowResult[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("upload");
    setFileName("");
    setRows([]);
    setResult(null);
    setParseError(null);
    setImporting(false);
  }

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("الملف لا يحتوي على أوراق عمل");
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (json.length === 0) throw new Error("لا توجد بيانات في الملف");

      const parsed: ParsedRow[] = json.map((raw, i) => {
        const payload: Record<string, unknown> = {};
        for (const [header, value] of Object.entries(raw)) {
          const field = FIELD_BY_HEADER.get(normAr(header));
          if (!field) continue;
          if (value === "" || value === null || value === undefined) continue;
          if (DATE_FIELDS.has(field)) payload[field] = parseDateCell(value);
          else if (NUM_FIELDS.has(field)) {
            const n = typeof value === "number" ? value : Number(String(value).replace(/[,،\s]/g, ""));
            payload[field] = isFinite(n) ? n : 0;
          } else payload[field] = typeof value === "string" ? value.trim() : value;
        }
        const empNo = String(payload.empNo ?? "").trim();
        const name = String(payload.name ?? "").trim();
        let error: string | null = null;
        if (!empNo) error = "الرقم الوظيفي مفقود";
        else if (!name) error = "الاسم مفقود";
        return {
          index: i,
          payload,
          error,
          summary: {
            empNo: empNo || "—",
            name: name || "—",
            nationality: String(payload.nationality ?? "—"),
            jobTitle: String(payload.jobTitle ?? "—"),
          },
        };
      });

      setRows(parsed);
      setFileName(file.name);
      setStage("preview");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "تعذر قراءة الملف — تأكد أنه ملف Excel صالح");
    }
  }

  async function runImport() {
    const valid = rows.filter((r) => !r.error).map((r) => r.payload);
    setImporting(true);
    try {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "تعذر الاستيراد");
      setResult({ inserted: data.inserted, failed: data.failed + rows.filter((r) => r.error).length, errors: data.errors });
      setStage("result");
      if (data.inserted > 0) onDone();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "تعذر الاستيراد");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => !r.error).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        setTimeout(reset, 200);
      }}
      wide
      icon={FileSpreadsheet}
      title="استيراد الموظفين من ملف Excel"
      subtitle="يدعم ملفات xlsx وxls وcsv — حمّل النموذج الجاهز لضمان مطابقة الأعمدة"
    >
      {stage === "upload" && (
        <div className="space-y-4">
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center transition-colors hover:border-emerald-600 hover:bg-emerald-50/40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700/10 text-emerald-700">
              <UploadCloud className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-sm font-bold text-stone-700">اسحب ملف Excel هنا أو اضغط للاختيار</span>
              <span className="mt-1 block text-xs text-stone-400">يتم التعرف تلقائياً على أسماء الأعمدة العربية</span>
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {parseError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}
          <a href="/api/employees/template" className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-emerald-600/50 hover:bg-emerald-50/40">
            <span className="flex items-center gap-3">
              <FileUp className="h-4.5 w-4.5 text-emerald-700" />
              <span>
                <span className="block text-[13px] font-bold text-stone-700">تحميل نموذج الاستيراد الجاهز</span>
                <span className="block text-[11px] text-stone-400">ملف Excel بالأعمدة المعتمدة مع أمثلة</span>
              </span>
            </span>
            <Download className="h-4 w-4 text-stone-400" />
          </a>
        </div>
      )}

      {stage === "preview" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="pine" dot>{fileName}</Badge>
            <Badge tone="emerald" dot>{validCount} سجل جاهز</Badge>
            {invalidCount > 0 && <Badge tone="red" dot>{invalidCount} سجل ناقص البيانات</Badge>}
          </div>
          <div className="overflow-hidden rounded-xl border border-stone-200">
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["#", "الرقم الوظيفي", "الاسم", "الجنسية", "المسمى الوظيفي", "الحالة"].map((h) => (
                      <th key={h} className="sticky top-0 bg-stone-50 px-3 py-2 text-right text-[11px] font-bold text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 60).map((r) => (
                    <tr key={r.index} className={r.error ? "bg-red-50/50" : undefined}>
                      <td className="tnum border-t border-stone-100 px-3 py-2 text-xs text-stone-400">{r.index + 2}</td>
                      <td className="tnum border-t border-stone-100 px-3 py-2 text-xs font-semibold">{r.summary.empNo}</td>
                      <td className="border-t border-stone-100 px-3 py-2 text-xs">{r.summary.name}</td>
                      <td className="border-t border-stone-100 px-3 py-2 text-xs">{r.summary.nationality}</td>
                      <td className="border-t border-stone-100 px-3 py-2 text-xs">{r.summary.jobTitle}</td>
                      <td className="border-t border-stone-100 px-3 py-2 text-[11px]">
                        {r.error ? <Badge tone="red">{r.error}</Badge> : <Badge tone="emerald" dot>جاهز</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 60 && (
              <p className="border-t border-stone-100 bg-stone-50 px-3 py-2 text-center text-[11px] text-stone-400">
                يتم عرض أول 60 سجلاً — سيتم استيراد جميع السجلات ({rows.length})
              </p>
            )}
          </div>
          {parseError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              إعادة الاختيار
            </Button>
            <Button onClick={runImport} loading={importing} disabled={validCount === 0} icon={UploadCloud}>
              استيراد {validCount} سجل
            </Button>
          </div>
        </div>
      )}

      {stage === "result" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
              <p className="tnum mt-2 text-2xl font-bold text-emerald-800">{result.inserted}</p>
              <p className="text-xs font-semibold text-emerald-700">سجل تم استيراده</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
              <p className="tnum mt-2 text-2xl font-bold text-stone-700">{result.failed}</p>
              <p className="text-xs font-semibold text-stone-500">سجل تم تخطيه</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-[220px] overflow-auto rounded-xl border border-stone-200">
              <table className="w-full">
                <thead>
                  <tr>
                    {["الصف", "الرقم الوظيفي", "السبب"].map((h) => (
                      <th key={h} className="sticky top-0 bg-stone-50 px-3 py-2 text-right text-[11px] font-bold text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="tnum border-t border-stone-100 px-3 py-2 text-xs">{e.row}</td>
                      <td className="tnum border-t border-stone-100 px-3 py-2 text-xs font-semibold">{e.empNo}</td>
                      <td className="border-t border-stone-100 px-3 py-2 text-xs text-red-600">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={reset}>استيراد ملف آخر</Button>
            <Button onClick={onClose}>إغلاق</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
