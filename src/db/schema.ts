import {
  pgTable,
  serial,
  text,
  boolean,
  date,
  numeric,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empNo: text("emp_no").notNull().unique(),
  name: text("name").notNull(),
  nationality: text("nationality").notNull().default(""),
  isSaudi: boolean("is_saudi").notNull().default(false),
  idNumber: text("id_number").notNull().default(""),
  iqamaNumber: text("iqama_number"),
  iqamaExpiry: date("iqama_expiry", { mode: "string" }),
  passportNumber: text("passport_number"),
  jobTitle: text("job_title").notNull().default(""),
  department: text("department").notNull().default(""),
  hireDate: date("hire_date", { mode: "string" }),
  contractType: text("contract_type").notNull().default("محدد المدة"),
  contractStart: date("contract_start", { mode: "string" }),
  contractEnd: date("contract_end", { mode: "string" }),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  otherAllowances: numeric("other_allowances", { precision: 12, scale: 2 }).notNull().default("0"),
  phone: text("phone"),
  email: text("email"),
  onSponsorship: boolean("on_sponsorship").notNull().default(false),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const terminations = pgTable("terminations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  noticeDate: date("notice_date", { mode: "string" }),
  lastWorkingDay: date("last_working_day", { mode: "string" }).notNull(),
  reason: text("reason"),
  eosAmount: numeric("eos_amount", { precision: 14, scale: 2 }),
  eosDetails: jsonb("eos_details"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmployeeRow = typeof employees.$inferSelect;
export type TerminationRow = typeof terminations.$inferSelect;
