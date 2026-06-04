import React, { useState } from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { ReportConfig, EmployeeAttendance, AttendanceType } from '../types';
import { getDaysInMonth, getDayOfWeek, toMarathiDigits } from '../utils';
import { 
  FileText, Users, MapPin, Feather, CheckCircle, 
  Trash2, Plus, RefreshCw, Calendar, Sparkles, AlertCircle, CheckSquare, Square, Type
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fallbackReportConfig } from '../data/fallbackData';

const MarathiInput = ({ value, onChange, className, rows, multiline, enabled }: any) => {
  if (!enabled) {
    return multiline ? (
       <textarea value={value} onChange={e => onChange(e.target.value)} className={className} rows={rows} />
    ) : (
       <input type="text" value={value} onChange={e => onChange(e.target.value)} className={className} />
    );
  }
  
  if (multiline) {
    return (
      <ReactTransliterate
        renderComponent={(props) => <textarea {...props} className={className} rows={rows} />}
        value={value}
        onChangeText={onChange}
        lang="mr"
        containerStyles={{ width: '100%', display: 'block' }}
      />
    );
  }

  return (
    <ReactTransliterate
      renderComponent={(props) => <input {...props} className={className} />}
      value={value}
      onChangeText={onChange}
      lang="mr"
      containerStyles={{ width: '100%', display: 'block' }}
    />
  );
};


interface ControlPanelProps {
  config: ReportConfig;
  setConfig: React.Dispatch<React.SetStateAction<ReportConfig>>;
  employees: EmployeeAttendance[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeAttendance[]>>;
  useMarathiNumerals: boolean;
  setUseMarathiNumerals: (v: boolean) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  employees,
  setEmployees,
  useMarathiNumerals,
  setUseMarathiNumerals,
  onReset
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'meta' | 'employees' | 'college' | 'stamps' | 'fonts'>('meta');
  const [selectedDateForBulk, setSelectedDateForBulk] = useState<number>(1);
  const [selectedStatusForBulk, setSelectedStatusForBulk] = useState<AttendanceType>('H');
  const [selectedEmployeeForBulk, setSelectedEmployeeForBulk] = useState<string>('');

  // Auto-fill active employee selection
  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeForBulk) {
      setSelectedEmployeeForBulk(employees[0].id);
    }
  }, [employees, selectedEmployeeForBulk]);

  const getDayOfWeekName = (day: number) => {
    const wDay = getDayOfWeek(config.year, config.month, day);
    const dayNames = ['रवि (Sun)', 'सोम (Mon)', 'मंगळ (Tue)', 'बुध (Wed)', 'गुरु (Thu)', 'शुक्र (Fri)', 'शनि (Sat)'];
    return dayNames[wDay];
  };

  const handleApplyStatusToAll = () => {
    setEmployees(prev => prev.map(emp => ({
      ...emp,
      attendance: {
        ...emp.attendance,
        [selectedDateForBulk]: selectedStatusForBulk
      }
    })));
  };

  const handleApplyStatusToSelected = () => {
    const targetId = selectedEmployeeForBulk || (employees.length > 0 ? employees[0].id : '');
    if (!targetId) {
      showToast("Please add an employee first!", "error");
      return;
    }
    setEmployees(prev => prev.map(emp => {
      if (emp.id === targetId) {
        return {
          ...emp,
          attendance: {
            ...emp.attendance,
            [selectedDateForBulk]: selectedStatusForBulk
          }
        };
      }
      return emp;
    }));
  };

  // Handle simple text changes in ReportConfig
  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    let newMonth = config.month;
    let newYear = config.year;
    let shouldUpdateEmployees = false;

    if (key === 'month' || key === 'year') {
      shouldUpdateEmployees = true;
      if (key === 'month') newMonth = value;
      if (key === 'year') newYear = value;
    }

    setConfig(prev => {
      const next = { ...prev, [key]: value };
      
      // Auto-update dates in subject and submission date when month or year changes
      if (key === 'month' || key === 'year') {
        const month = key === 'month' ? value : next.month;
        const year = key === 'year' ? value : next.year;
        
        const monthStrArr = ['', '०१', '०२', '०३', '०४', '०५', '०६', '०७', '०८', '०९', '१०', '११', '१२'];
        const mStr = monthStrArr[month] || month.toString();
        const yearMarathi = toMarathiDigits(year);
        
        const startStr = `०१/${mStr}/${yearMarathi}`;
        const daysCount = getDaysInMonth(year, month);
        const endStr = `${toMarathiDigits(daysCount)}/${mStr}/${yearMarathi}`;
        
        // Update subject dates
        const oldStartStrMatch = next.subjectTemplateMr.match(/दि\.\s*(\S+)\s*ते/);
        const oldEndStrMatch = next.subjectTemplateMr.match(/ते\s*दि\.\s*(\S+)\s*रोजी/);
        
        if (oldStartStrMatch && oldEndStrMatch) {
            next.subjectTemplateMr = next.subjectTemplateMr
              .replace(oldStartStrMatch[1], startStr)
              .replace(oldEndStrMatch[1], endStr);
        } else {
            // fallback if pattern doesn't match
            if (employees.length > 0) {
              const firstEmp = employees[0];
              next.subjectTemplateMr = `${firstEmp.name} (${firstEmp.category}) ${firstEmp.designation} यांचा दि. ${startStr} ते दि. ${endStr} रोजी पर्यंतचा उपस्थिती अहवाल सादर करणेबाबत...`;
            }
        }

        // Update default date format for printing
        const mStrEn = month.toString().padStart(2, '0');
        next.dateStr = `       / ${mStrEn} / ${year}`;
      }
      
      return next;
    });

    if (shouldUpdateEmployees) {
      const daysCount = getDaysInMonth(newYear, newMonth);
      setEmployees(currentEmployees => currentEmployees.map(emp => {
        const updatedAttendance = { ...emp.attendance };
        for (let d = 1; d <= daysCount; d++) {
          const wDay = getDayOfWeek(newYear, newMonth, d);
          if (wDay === 0) {
            updatedAttendance[d] = 'WO';
          } else if (updatedAttendance[d] === 'WO') {
            updatedAttendance[d] = 'P';
          }
        }
        Object.keys(updatedAttendance).forEach(dayStr => {
           const d = parseInt(dayStr);
           if (d > daysCount) delete updatedAttendance[d];
        });
        return { ...emp, attendance: updatedAttendance };
      }));
    }
  };

  // Helper to add a new employee row
  const addEmployee = () => {
    const nextSerial = employees.length + 1;
    const newEmp: EmployeeAttendance = {
      id: `emp-${Date.now()}`,
      serialNo: nextSerial,
      name: 'नवीन कर्मचारी',
      designation: 'कनिष्ठ लिपिक',
      category: 'वर्ग-३ बाह्यस्त्रोत कर्मचारी',
      attendance: {}
    };
    
    // Default all days to 'P' for standard initial ease
    const daysInMonth = getDaysInMonth(config.year, config.month);
    for (let d = 1; d <= daysInMonth; d++) {
      const wDay = getDayOfWeek(config.year, config.month, d);
      newEmp.attendance[d] = wDay === 0 ? 'WO' : 'P';
    }
    
    setEmployees(prev => [...prev, newEmp]);
  };

  // Helper to delete an employee row
  const deleteEmployee = (id: string) => {
    setEmployees(prev => {
      const filtered = prev.filter(emp => emp.id !== id);
      // Re-index serial positions
      return filtered.map((emp, idx) => ({ ...emp, serialNo: idx + 1 }));
    });
  };

  // Helper to update specific employee field
  const updateEmployeeField = (id: string, key: keyof EmployeeAttendance, value: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, [key]: value };
      }
      return emp;
    }));
  };

  // Bulk Actions
  const handleBulkFillSundays = () => {
    const days = getDaysInMonth(config.year, config.month);
    setEmployees(prev => prev.map(emp => {
      const updatedAttendance = { ...emp.attendance };
      for (let d = 1; d <= days; d++) {
        const wDay = getDayOfWeek(config.year, config.month, d);
        if (wDay === 0) { // Sunday
          updatedAttendance[d] = 'WO';
        } else if (updatedAttendance[d] === 'WO') {
          // It's not a Sunday, but it's currently marked as WO (likely leftover from previous month)
          updatedAttendance[d] = 'P';
        }
      }
      return { ...emp, attendance: updatedAttendance };
    }));
  };

  const handleBulkFillAllPresent = () => {
    const days = getDaysInMonth(config.year, config.month);
    setEmployees(prev => prev.map(emp => {
      const updatedAttendance = { ...emp.attendance };
      for (let d = 1; d <= days; d++) {
        const wDay = getDayOfWeek(config.year, config.month, d);
        if (wDay !== 0) { // Skip Sunday to keep WO
          updatedAttendance[d] = 'P';
        }
      }
      return { ...emp, attendance: updatedAttendance };
    }));
  };

  const handleBulkClear = () => {
    setEmployees(prev => prev.map(emp => ({ ...emp, attendance: {} })));
  };

  // Try to generate the official subject line based on the name of the first employee
  const autoGenerateSubject = () => {
    if (employees.length === 0) return;
    const firstEmp = employees[0];
    const monthStrArr = ['', '०१', '०२', '०३', '०४', '०५', '०६', '०७', '०८', '०९', '१०', '११', '१२'];
    const mStr = monthStrArr[config.month] || config.month.toString();
    const yearMarathi = toMarathiDigits(config.year);
    
    const startStr = `०१/${mStr}/${yearMarathi}`;
    const daysCount = getDaysInMonth(config.year, config.month);
    const endStr = `${toMarathiDigits(daysCount)}/${mStr}/${yearMarathi}`;
    
    const subjectLine = `${firstEmp.name} (${firstEmp.category}) ${firstEmp.designation} यांचा दि. ${startStr} ते दि. ${endStr} रोजी पर्यंतचा उपस्थिती अहवाल सादर करणेबाबत...`;
    handleConfigChange('subjectTemplateMr', subjectLine);
  };

  return (
    <div className="bg-slate-900 text-slate-100 flex flex-col h-full overflow-hidden border-r border-slate-700">
      
      {/* HEADER SECTION */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5 leading-snug">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Attendance System
          </h1>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3" />
            Eng {'->'} मराठी Phonetic Typing
          </p>
        </div>
        <button 
          onClick={onReset}
          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
          title="Reset back to default Sagar Sanjay Kamble April 2026 data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Demo
        </button>
      </div>

      {/* QUICK SETTINGS BAR */}
      <div className="p-3 bg-slate-850 border-b border-slate-800 flex gap-2 text-xs shrink-0 select-none">
        <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-800 bg-slate-900 border border-slate-800">
          <input 
            type="checkbox" 
            checked={useMarathiNumerals} 
            onChange={(e) => setUseMarathiNumerals(e.target.checked)}
            className="rounded border-slate-700 text-amber-500 bg-slate-950 focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-slate-300 font-semibold">Marathi Numbers</span>
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-800 bg-slate-900 border border-slate-800">
          <input 
            type="checkbox" 
            checked={config.enableMarathiTyping} 
            onChange={(e) => handleConfigChange('enableMarathiTyping', e.target.checked)}
            className="rounded border-slate-700 text-amber-500 bg-slate-950 focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-slate-300 font-semibold">Phonetic Marathi Input</span>
        </label>
      </div>

      {/* CONTROL TABS */}
      <div className="bg-slate-950 px-2 pt-1.5 border-b border-slate-800 flex gap-1 scrollbar-none overflow-x-auto shrink-0 select-none">
        {[
          { id: 'meta', label: 'Details', icon: FileText },
          { id: 'employees', label: 'Grid', icon: Users },
          { id: 'fonts', label: 'Fonts', icon: Type }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-[11px] font-bold rounded-t-md whitespace-nowrap flex items-center gap-1.5 transition-all border-t-2 flex-1 justify-center ${
                isActive 
                  ? 'bg-slate-900 text-amber-400 border-amber-500' 
                  : 'text-slate-400 border-transparent hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SCROLLABLE CONFIG CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 3: FONTS & TYPOGRAPHY */}
        {activeTab === 'fonts' && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" /> Typography Settings (px)
              </h3>
              <p className="text-[10px] text-slate-400">Tweak structural font sizes for exact paper fit.</p>
              
              {config.fontSizes && (
                <div className="grid grid-cols-2 gap-3 pb-2 pt-1 border-t border-slate-800/50">
                  {Object.entries(config.fontSizes).map(([key, val]) => (
                    <div key={key}>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">{key}</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={val} 
                        onChange={(e) => {
                            const newSizes = { ...config.fontSizes, [key]: parseFloat(e.target.value) || 10 };
                            handleConfigChange('fontSizes', newSizes);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                  <div>
                    <button onClick={() => handleConfigChange('fontSizes', fallbackReportConfig.fontSizes)} className="text-[9px] mt-4 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">
                      Reset Sizes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: INWARD REFERENCE & SUBJECT */}
        {activeTab === 'meta' && (
          <div className="space-y-4 animate-in fade-in duration-250">
            {/* MONTH AND YEAR BLOCK */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Choose Reporting Month
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Year (वर्ष)</label>
                  <select 
                    value={config.year} 
                    onChange={(e) => handleConfigChange('year', parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                  >
                    {[2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Month (महिना)</label>
                  <select 
                    value={config.month} 
                    onChange={(e) => handleConfigChange('month', parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                  >
                    {[
                      { v: 1, n: 'जानेवारी (Jan)' },
                      { v: 2, n: 'फेब्रुवारी (Feb)' },
                      { v: 3, n: 'मार्च (Mar)' },
                      { v: 4, n: 'एप्रिल (Apr)' },
                      { v: 5, n: 'मे (May)' },
                      { v: 6, n: 'जून (Jun)' },
                      { v: 7, n: 'जुलै (Jul)' },
                      { v: 8, n: 'ऑगस्ट (Aug)' },
                      { v: 9, n: 'सप्टेंबर (Sep)' },
                      { v: 10, n: 'ऑक्टोबर (Oct)' },
                      { v: 11, n: 'नोव्हेंबर (Nov)' },
                      { v: 12, n: 'डिसेंबर (Dec)' }
                    ].map(m => (
                      <option key={m.v} value={m.v}>{m.n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* INWARD LETTER DETAILS */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300">Office Correspondence Numbers</h3>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Inward Reference ID (जावक क्र.)</label>
                <MarathiInput 
                  value={config.refNo} 
                  onChange={(val: string) => handleConfigChange('refNo', val)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                  enabled={config.enableMarathiTyping}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Submission Date (दिनांक)</label>
                  <input 
                    type="text" 
                    value={config.dateStr} 
                    onChange={(e) => handleConfigChange('dateStr', e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* RECIPIENT AND SUBJECT */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-300">Correspondence Subject</h3>
                <button
                  type="button"
                  onClick={autoGenerateSubject}
                  disabled={employees.length === 0}
                  className="text-[10px] font-bold text-amber-400 disabled:opacity-40 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto Gen Subject
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Addressed To (प्रति,)</label>
                <MarathiInput 
                  value={config.recipientMr} 
                  onChange={(val: string) => handleConfigChange('recipientMr', val)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none mb-1.5"
                  enabled={config.enableMarathiTyping}
                  multiline={true}
                  rows={3}
                />
                <input 
                  type="text" 
                  value={config.recipientEn} 
                  onChange={(e) => handleConfigChange('recipientEn', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subject Line (विषय)</label>
                <MarathiInput 
                  value={config.subjectTemplateMr} 
                  onChange={(val: string) => handleConfigChange('subjectTemplateMr', val)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none leading-relaxed"
                  multiline={true}
                  enabled={config.enableMarathiTyping}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Forwarding Submission (तळटीप)</label>
                <MarathiInput 
                  value={config.footerSubmissionMr} 
                  onChange={(val: string) => handleConfigChange('footerSubmissionMr', val)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                  enabled={config.enableMarathiTyping}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEES GRID MANAGER */}
        {activeTab === 'employees' && (
          <div className="space-y-4 animate-in fade-in duration-250">
            
            {/* BULK GRID WORKERS */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300">Bulk Helpers</h3>
              <p className="text-[10px] text-slate-400 leading-normal mb-1">Apply quick calendars to all employee rows in one press:</p>
              
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button 
                  onClick={handleBulkFillSundays}
                  className="py-1.5 px-1 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 font-bold border border-emerald-800/60 rounded text-center transition-colors"
                >
                  Find Sundays - WO
                </button>
                <button 
                  onClick={handleBulkFillAllPresent}
                  className="py-1.5 px-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 font-bold border border-blue-800/60 rounded text-center transition-colors"
                >
                  Set Weekdays - P
                </button>
                <button 
                  onClick={handleBulkClear}
                  className="py-1.5 px-1 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded text-center transition-colors"
                >
                  Clear Grid
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 text-[9.5px] bg-amber-950/20 p-2 rounded-md text-amber-500 mt-2 font-medium border border-amber-900/30">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>You can also edit attendance by clicking cells directly on the paper preview!</span>
              </div>
            </div>

            {/* QUICK CALENDAR BATCHER (NEW MODERN FUNCTIONALITY) */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Batch Date Override (All Staff)
              </h3>
              
              <p className="text-[10px] text-slate-400 leading-normal">
                Instantly mark a date for <strong>all staff</strong>. Select a status and click dates.
              </p>

              <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {[
                  { val: 'P', label: '🟢 P' },
                  { val: 'A', label: '🔴 A' },
                  { val: 'H', label: '🟡 H' },
                  { val: 'WO', label: '🔵 WO' },
                  { val: '-', label: '⚪ Clr' },
                ].map(s => (
                  <button
                    key={s.val}
                    onClick={() => setSelectedStatusForBulk(s.val as AttendanceType)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                      selectedStatusForBulk === s.val
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 pt-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-[8.5px] font-black text-slate-500 py-0.5">
                    {d}
                  </div>
                ))}
                {Array.from({ length: getDayOfWeek(config.year, config.month, 1) }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(config.year, config.month) }, (_, i) => i + 1).map(d => {
                  let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700";
                  
                  if (employees.length > 0) {
                    const allHaveSame = employees.every(e => e.attendance[d] === employees[0].attendance[d]);
                    if (allHaveSame) {
                      const status = employees[0].attendance[d];
                      if (status === 'WO') btnClass = "bg-blue-900/80 border-blue-700 text-blue-200 hover:bg-blue-800";
                      else if (status === 'H') btnClass = "bg-amber-500 border-amber-600 text-slate-950 hover:bg-amber-400";
                      else if (status === 'A') btnClass = "bg-rose-900/80 border-rose-700 text-rose-200 hover:bg-rose-800";
                      else if (status === 'P') btnClass = "bg-emerald-900/60 border-emerald-800 text-emerald-300 hover:bg-emerald-800";
                    }
                  }

                  return (
                  <button 
                    key={d}
                    onClick={() => {
                        const newEmp = employees.map(e => ({ 
                           ...e, 
                           attendance: { ...e.attendance, [d]: selectedStatusForBulk } 
                        }));
                        setEmployees(newEmp);
                    }}
                    className={`aspect-square flex items-center justify-center text-[10px] font-bold border rounded transition-colors cursor-pointer active:scale-95 ${btnClass} ring-offset-slate-950 focus:ring-1 focus:ring-amber-500`}
                    title={`Set ${d} to ${selectedStatusForBulk} for all staff`}
                  >
                    {d}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* EMPLOYEE LIST ACTIONS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-300">Staff List</h3>
                <button 
                  onClick={addEmployee}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Staff
                </button>
              </div>

              {employees.map((emp, index) => (
                <div key={emp.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3 relative">
                  
                  {/* Row Badge & Delete Action */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400"># {index + 1} Staff Detail</span>
                    {employees.length > 1 && (
                      <button 
                        onClick={() => deleteEmployee(emp.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/35 rounded transition-all"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Staff Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Full Name (नाव)</label>
                      <MarathiInput 
                        value={emp.name} 
                        onChange={(val: string) => updateEmployeeField(emp.id, 'name', val)}
                        className="w-full bg-slate-100/5 hover:bg-slate-100/10 focus:bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 focus:border-amber-500 focus:outline-none"
                        enabled={config.enableMarathiTyping}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Role (पदनाम)</label>
                        <select 
                          value={emp.designation} 
                          onChange={(e) => updateEmployeeField(emp.id, 'designation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="कनिष्ठ लिपिक">कनिष्ठ लिपिक (Jr. Clerk)</option>
                          <option value="वरिष्ठ लिपिक">वरिष्ठ लिपिक (Sr. Clerk)</option>
                          <option value="कक्ष सेवक">कक्ष सेवक (Ward Boy)</option>
                          <option value="परिचारिका">परिचारिका (Nurse)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Category (वर्ग)</label>
                        <select 
                          value={emp.category} 
                          onChange={(e) => updateEmployeeField(emp.id, 'category', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="वर्ग-३ बाह्यस्त्रोत कर्मचारी">वर्ग-३ बाह्यस्त्रोत कर्मचारी</option>
                          <option value="वर्ग-३ कंत्राटी">वर्ग-३ कंत्राटी</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-end mb-0.5">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 flex flex-col">
                          <span>Custom Address Override (प्रति)</span>
                          <span className="text-[9px] text-slate-500 normal-case mb-1">Leave empty to use main Correspondence Subject</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const collegeAddress = 'मा. अधिष्ठाता\nज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय व रुग्णालय,\nनंदुरबार.';
                            if (emp.recipientMrOverride === collegeAddress) {
                              updateEmployeeField(emp.id, 'recipientMrOverride', '');
                            } else {
                              updateEmployeeField(emp.id, 'recipientMrOverride', collegeAddress);
                            }
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors mb-1 flex items-center gap-1 ${emp.recipientMrOverride === 'मा. अधिष्ठाता\nज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय व रुग्णालय,\nनंदुरबार.' ? 'bg-amber-900/40 border-amber-700/50 text-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'}`}
                          title="Toggle College Address"
                        >
                          {emp.recipientMrOverride === 'मा. अधिष्ठाता\nज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय व रुग्णालय,\nनंदुरबार.' ? (
                            <CheckSquare className="w-3 h-3" />
                          ) : (
                            <Square className="w-3 h-3" />
                          )} College
                        </button>
                      </div>
                      <MarathiInput 
                        value={emp.recipientMrOverride || ''} 
                        onChange={(val: string) => updateEmployeeField(emp.id, 'recipientMrOverride', val)}
                        className="w-full bg-slate-100/5 hover:bg-slate-100/10 focus:bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 focus:border-amber-500 focus:outline-none"
                        enabled={config.enableMarathiTyping}
                        multiline={true}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* FIXED FOOTER CREDITS */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-center select-none shrink-0 text-[10.5px] text-slate-500 font-mono tracking-tight flex items-center justify-center gap-1.5">
        <span>GMC Nandurbar Layout v1.3</span>
      </div>
    </div>
  );
};
