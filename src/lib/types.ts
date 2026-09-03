export interface Employee {
  id: number;
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
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  phone: string | null;
  email: string | null;
  onSponsorship: boolean;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TerminationEmployee {
  id: number;
  empNo: string;
  name: string;
  jobTitle: string;
  department: string;
}

export interface TerminationRecord {
  id: number;
  employeeId: number;
  type: string;
  noticeDate: string | null;
  lastWorkingDay: string;
  reason: string | null;
  eosAmount: number | null;
  eosDetails: unknown;
  notes: string | null;
  createdAt: string;
  employee: TerminationEmployee | null;
}
