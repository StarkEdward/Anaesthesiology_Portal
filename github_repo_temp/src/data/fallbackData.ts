import { ReportConfig, EmployeeAttendance } from '../types';

  // Dynamically set current year and month for correct text defaults
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentMonthStrEn = currentMonth.toString().padStart(2, '0');
  
  const toMarathiDigits = (num: number | string): string => {
    const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
    return num.toString().split('').map(digit => {
      if (/[0-9]/.test(digit)) return marathiDigits[parseInt(digit)];
      return digit;
    }).join('');
  };

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const currentYearMarathi = toMarathiDigits(currentYear);
  const currentMonthStrArr = ['', '०१', '०२', '०३', '०४', '०५', '०६', '०७', '०८', '०९', '१०', '११', '१२'];
  const currentMonthMarathi = currentMonthStrArr[currentMonth];
  const currentDaysCountMarathi = toMarathiDigits(getDaysInMonth(currentYear, currentMonth));
  
  // Calculate next month for "received date"
  let nextMonth = currentMonth + 1;
  let nextMonthYear = currentYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextMonthYear = currentYear + 1;
  }
  
  export const fallbackReportConfig: ReportConfig = {
    email: 'gmcn.anaesthesiology@gmail.com',
    deptNameMr: 'बधिरीकरणशास्त्र विभाग',
    deptNameEn: 'Department of Anaesthesiology',
    collegeNameMr: 'जननायक बिरसा मुंडा शासकीय वैद्यकीय महाविद्यालय, नंदुरबार',
    collegeNameEn: 'JANNAYAK BIRSA MUNDA GOVERNMENT MEDICAL COLLEGE, NANDURBAR',
    addressMr: 'जिल्हा सामान्य रुग्णालय परिसर, साक्री रोड, नंदुरबार – ४२५४१२',
    addressEn: 'DISTRICT CIVIL HOSPITAL AREA, SAKRI ROAD, NANDURBAR - 425412',
    refNo: `जा.क्र.जबीमुंशावैम/बधि.शा.वि./क.लिपिक/उपस्थिती अहवाल/ 542 / ${currentYearMarathi}`,
    dateStr: `       / ${currentMonthStrEn} / ${currentYear}`,
    recipientMr: 'मा. अधिष्ठाता,\nज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय,\nनंदुरबार.',
    recipientEn: '',
    subjectTemplateMr: `सागर संजय कांबळे (वर्ग-३ बाह्यस्त्रोत कर्मचारी) कनिष्ठ लिपिक यांचा दि. ०१/${currentMonthMarathi}/${currentYearMarathi} ते दि. ${currentDaysCountMarathi}/${currentMonthMarathi}/${currentYearMarathi} रोजी पर्यंतचा उपस्थिती अहवाल सादर करणेबाबत...`,
    footerSubmissionMr: 'आपल्या माहिती व पुढील योग्य त्या कार्यवाहीस्तव सविनय सादर.',
    hodNameMr: 'प्राध्यापक व विभाग प्रमुख',
    hodDesignationMr: 'बधिरीकरणशास्त्र विभाग',
    hodDeptMr: 'ज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय, नंदुरबार.',
    collegeNameAbbrMr: 'ज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय',
    
    year: currentYear,
    month: currentMonth,
    
    showStamps: false,
    receivedNo: `९०९ / ${currentYear.toString().slice(2)}`,
    receivedDate: `04/${nextMonth.toString().padStart(2, '0')}/${nextMonthYear}`,
    enableMarathiTyping: true,

  fontSizes: {
    deptNameMr: 24,
    deptNameEn: 13,
    collegeNameMr: 16,
    collegeNameEn: 11,
    addressMr: 14,
    addressEn: 11,
    email: 11,
    refNo: 12,
    dateStr: 12,
    recipient: 13,
    subject: 13,
    tableHeaderRow1: 14,
    tableHeaderRow1Sub: 10.5,
    tableHeaderRow2: 11.5,
    tableHeaderRow2Sub: 12,
    tableDates: 10.5,
    tableBody: 11.5,
    footerSubmission: 13,
    hodDeatils: 13.5
  }
};

export const fallbackEmployees: EmployeeAttendance[] = [
  {
    id: 'emp-1',
    serialNo: 1,
    name: 'सागर संजय कांबळे',
    designation: 'कनिष्ठ लिपिक',
    category: 'वर्ग-३ बाह्यस्त्रोत कर्मचारी',
    attendance: {
      1: 'P',  // Wed
      2: 'P',  // Thu
      3: 'H',  // Fri (Good Friday)
      4: 'P',  // Sat
      5: 'WO', // Sun (Weekly Off)
      6: 'P',  // Mon
      7: 'P',  // Tue
      8: 'P',  // Wed
      9: 'P',  // Thu
      10: 'P', // Fri
      11: 'P', // Sat
      12: 'WO',// Sun
      13: 'P', // Mon
      14: 'H', // Tue (Ambedkar Jayanti)
      15: 'P', // Wed
      16: 'P', // Thu
      17: 'P', // Fri
      18: 'P', // Sat
      19: 'WO',// Sun
      20: 'P', // Mon
      21: 'P', // Tue
      22: 'P', // Wed
      23: 'P', // Thu
      24: 'P', // Fri
      25: 'P', // Sat
      26: 'WO',// Sun
      27: 'P', // Mon
      28: 'P', // Tue
      29: 'P', // Wed
      30: 'P'  // Thu
    }
  },
  {
    id: 'emp-2',
    serialNo: 2,
    name: 'अमित विठ्ठल मोहिते',
    designation: 'कनिष्ठ लिपिक',
    category: 'वर्ग-३ कंत्राटी',
    attendance: {
      1: 'P', 2: 'P', 3: 'H', 4: 'P', 5: 'WO', 6: 'P', 7: 'P', 8: 'P', 9: 'P', 10: 'P',
      11: 'P', 12: 'WO', 13: 'P', 14: 'H', 15: 'P', 16: 'P', 17: 'P', 18: 'P', 19: 'WO', 20: 'P',
      21: 'P', 22: 'P', 23: 'P', 24: 'P', 25: 'P', 26: 'WO', 27: 'P', 28: 'P', 29: 'P', 30: 'P'
    }
  },
  {
    id: 'emp-3',
    serialNo: 3,
    name: 'वैशाली मोतीलाल बोरसे',
    designation: 'कनिष्ठ लिपिक',
    category: 'वर्ग-३ कंत्राटी',
    attendance: {
      1: 'P', 2: 'P', 3: 'H', 4: 'P', 5: 'WO', 6: 'P', 7: 'P', 8: 'P', 9: 'P', 10: 'P',
      11: 'P', 12: 'WO', 13: 'P', 14: 'H', 15: 'P', 16: 'P', 17: 'P', 18: 'P', 19: 'WO', 20: 'P',
      21: 'P', 22: 'P', 23: 'P', 24: 'P', 25: 'P', 26: 'WO', 27: 'P', 28: 'P', 29: 'P', 30: 'P'
    }
  }
];
