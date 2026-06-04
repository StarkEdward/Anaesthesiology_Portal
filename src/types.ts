export type AttendanceType = 'P' | 'A' | 'WO' | 'H' | '-';

export interface EmployeeAttendance {
  id: string;
  serialNo: number;
  name: string;
  designation: string;
  category: string; // e.g. "वर्ग-३ बाह्यस्त्रोत कर्मचारी" (Class-3 outsourced employee)
  recipientMrOverride?: string; // Optional per-employee override for "प्रति," 
  attendance: { [day: number]: AttendanceType };
}

export interface ReportConfig {
  email: string;
  deptNameMr: string;
  deptNameEn: string;
  collegeNameMr: string;
  collegeNameEn: string;
  addressMr: string;
  addressEn: string;
  refNo: string;
  dateStr: string;
  recipientMr: string;
  recipientEn: string;
  subjectTemplateMr: string;
  footerSubmissionMr: string;
  hodNameMr: string;
  hodDesignationMr: string;
  hodDeptMr: string;
  collegeNameAbbrMr: string;
  
  // Settings for the month
  year: number;
  month: number; // 1 to 12
  
  // Custom stamps configuration
  showStamps: boolean;
  receivedNo: string;
  receivedDate: string;
  enableMarathiTyping: boolean;

  fontSizes: {
    deptNameMr: number;
    deptNameEn: number;
    collegeNameMr: number;
    collegeNameEn: number;
    addressMr: number;
    addressEn: number;
    email: number;
    refNo: number;
    dateStr: number;
    recipient: number;
    subject: number;
    tableHeaderRow1: number;
    tableHeaderRow1Sub: number;
    tableHeaderRow2: number;
    tableHeaderRow2Sub: number;
    tableDates: number;
    tableBody: number;
    footerSubmission: number;
    hodDeatils: number;
  };
}

export interface DashboardStats {
  totalStock: number;
  totalIssued: number;
  remainingStock: number;
  totalPrice: number;
  issuedToday: number;
  pending: number;
  lowStock: number;
  pendingOTDeliveries: number;
  pendingProfApprovals: number;
  hodActionRequired: number;
  hodRemarksDistribution: { remark: string; count: number }[];
  activeDoctors: number;
}

export interface Instrument {
  id?: string;
  name: string;
  current_stock?: number;
  total_issued?: number;
  price?: number;
  [key: string]: any;
}

export interface Transaction {
  id?: string;
  quantity?: number;
  issue_date?: string;
  status?: string;
  is_delivered_to_ot?: boolean;
  is_approved_by_professor?: boolean;
  hod_remark?: string;
  instrument_name?: string;
  [key: string]: any;
}

export interface PACRecord {
  id?: string;
  patient_name?: string;
  uhid?: string;
  fitness?: string;
  [key: string]: any;
}

export interface Book {
  id?: string;
  title?: string;
  [key: string]: any;
}

export interface Doctor {
  id?: string;
  [key: string]: any;
}

