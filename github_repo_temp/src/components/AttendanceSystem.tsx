import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ReportConfig, EmployeeAttendance, AttendanceType } from '../types';
import { fallbackReportConfig, fallbackEmployees } from '../data/fallbackData';
import { ReportTemplate } from './ReportTemplate';
import { ControlPanel } from './ControlPanel';
import { DoctorAttendanceWorkspace } from './DoctorAttendanceWorkspace';
import { ResidentAttendanceWorkspace } from './ResidentAttendanceWorkspace';
import { getDaysInMonth, getDayOfWeek, toMarathiDigits } from '../utils';
import { 
  Printer, Download, Eye, ZoomIn, ZoomOut, RotateCcw, 
  HelpCircle, ChevronRight, ChevronLeft, SlidersHorizontal, Check, X, FileText, Globe, Info, Feather, Home, PanelLeftClose
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function AttendanceSystem() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<'landing' | 'doctors' | 'residents' | 'clerks'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [config, setConfig] = useState<ReportConfig>(fallbackReportConfig);
  const [employees, setEmployees] = useState<EmployeeAttendance[]>(fallbackEmployees);
  const [useMarathiNumerals, setUseMarathiNumerals] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(0.75);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDownloadGuideOpen, setIsDownloadGuideOpen] = useState<boolean>(false);
  const [activePen, setActivePen] = useState<'cycle' | AttendanceType>('cycle');

  // Handle cell click using active pen mode or cycle-toggle mode
  const handleCellClick = (empId: string, day: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        let nextStatus: AttendanceType = 'P';
        
        if (activePen !== 'cycle') {
          nextStatus = activePen;
        } else {
          const currentStatus = emp.attendance[day] || '-';
          switch (currentStatus) {
            case 'P':
              nextStatus = 'WO';
              break;
            case 'WO':
              nextStatus = 'H';
              break;
            case 'H':
              nextStatus = 'A';
              break;
            case 'A':
              nextStatus = '-';
              break;
            case '-':
              nextStatus = 'P';
              break;
            default:
              nextStatus = 'P';
          }
        }
        
        return {
          ...emp,
          attendance: {
            ...emp.attendance,
            [day]: nextStatus
          }
        };
      }
      return emp;
    }));
  };

  // Re-trigger resize zoom calculation whenever sidebar is toggled or when window resizes
  useEffect(() => {
    const handleResize = () => {
      const rightPanel = document.getElementById('preview-pane');
      if (rightPanel) {
        const width = rightPanel.offsetWidth;
        // 297mm is approx 1122px. We want to fit it with padding.
        if (width < 1200) {
          const calculatedZoom = Math.max(0.4, (width - 60) / 1122);
          setZoom(parseFloat(calculatedZoom.toFixed(2)));
        } else {
          setZoom(0.75); // Slightly smaller default for better overview
        }
      }
    };
    
    // Immediate calculation
    handleResize();

    // Trigger repeatedly during transition to keep zoom smooth
    const interval = setInterval(handleResize, 16);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      handleResize();
    }, 320);

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    document.title = "बधिरीकरणशास्त्र विभाग";
  }, []);

  // Bulletproof auto-alignment of Weekly Offs (WO) whenever month or year changes
  useEffect(() => {
    setEmployees(prev => prev.map(emp => {
      let changed = false;
      const updatedAttendance = { ...emp.attendance };
      const daysCount = getDaysInMonth(config.year, config.month);
      
      for (let d = 1; d <= daysCount; d++) {
        const wDay = getDayOfWeek(config.year, config.month, d);
        if (wDay === 0 && updatedAttendance[d] !== 'WO') {
          updatedAttendance[d] = 'WO';
          changed = true;
        } else if (wDay !== 0 && updatedAttendance[d] === 'WO') {
          updatedAttendance[d] = 'P';
          changed = true;
        }
      }
      
      return changed ? { ...emp, attendance: updatedAttendance } : emp;
    }));
  }, [config.month, config.year]);

  // Command to reset back to original default photo data
  const handleReset = () => {
    if (window.confirm("तुम्हाला उपस्थिती पत्रक मूळ स्वरूपात रिसेट करायचे आहे का? (Do you want to reset everything back to the image default?)")) {
      setConfig({ ...fallbackReportConfig });
      setEmployees(JSON.parse(JSON.stringify(fallbackEmployees)));
      setUseMarathiNumerals(true);
      setZoom(0.75);
    }
  };

  // Helper triggers
  const triggerNativePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error(e);
      showToast('Printing is not supported in this preview iframe. Please use the Download PDF button or open the app in a new tab.', 'error');
    }
  };

  const handleDownloadPDFClick = async () => {
    const el = document.getElementById('print-area');
    if (!el) {
      showToast('Print area not found', 'error');
      return;
    }
    
    // Fallback UI indication
    const defaultText = el.getAttribute('data-status') || 'Generating...';
    
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('oklch') || args[0].includes('CSSStyleSheet.cssRules getter') || args[0].includes('Error inlining remote css file') || args[0].includes('Error while reading CSS rules'))) {
        return; // Ignore these specific html-to-image errors
      }
      originalConsoleError(...args);
    };

    try {
      // Temporarily remove zoom scale for pristine capture
      const currentTransform = el.parentElement!.style.transform;
      el.parentElement!.style.transform = 'none';

      const printPages = el.querySelectorAll('.print-page');
      if (printPages.length === 0) {
        showToast('No pages found to print.', 'error');
        return;
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < printPages.length; i++) {
        const page = printPages[i] as HTMLElement;
        const dataUrl = await toPng(page, {
          pixelRatio: 4,
          quality: 1.0,
          backgroundColor: '#ffffff'
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
      }
      
      const monthNames = ["", "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
      const monthLabel = monthNames[config.month] || "महिना";
      const marathiYear = toMarathiDigits(config.year.toString());
      
      let viewPrefix = "";
      if (currentView === 'doctors') viewPrefix = 'डॉक्टर्रस';
      else if (currentView === 'residents') viewPrefix = 'कनिष्ठ वरिष्ठ निवासी';
      else if (currentView === 'clerks') viewPrefix = 'लिपिक';

      const fileName = viewPrefix 
        ? `${viewPrefix} उपस्थिती अहवाल ${monthLabel} ${marathiYear}.pdf`
        : `${config.deptNameMr || 'उपस्थिती'} अहवाल ${monthLabel} ${marathiYear}.pdf`;

      pdf.save(fileName);
      
      el.parentElement!.style.transform = currentTransform;
    } catch (err: any) {
      console.error(err);
      showToast(`Error generating PDF: ${err.message || err}`, 'error');
    } finally {
      console.error = originalConsoleError;
    }
  };

  if (currentView === 'landing') {
    return (
      <div className="absolute inset-0 flex flex-col overflow-y-auto bg-slate-950 font-sans items-center justify-center p-4 py-8">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 z-20 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-bold flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-all shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Abstract background elements */}
        <div className="fixed top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 text-center mb-8 max-w-2xl px-4 mt-auto">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 shadow-xl relative group">
            <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-md group-hover:bg-amber-500/20 transition-colors"></div>
            <img 
              src="/logo.png" 
              alt="Medical College Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 relative z-10 object-contain drop-shadow-xl text-[10px] text-slate-500 flex items-center justify-center" 
            />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mb-1.5 drop-shadow-md">
            बधिरीकरणशास्त्र विभाग
          </h2>
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-300 mb-4 leading-snug">
            जननायक बिरसा मुंडा शासकीय वैद्यकीय महाविद्यालय, नंदुरबार
          </h3>
          <div className="w-12 h-1 bg-amber-500/20 mx-auto rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-amber-500 blur-sm opacity-50 rounded-full"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 mb-3 tracking-tight">
            Attendance System
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Select the designated staff category to generate, manage, or print official monthly attendance records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl px-2 sm:px-6 z-10 mb-auto">
          <button 
            onClick={() => setCurrentView('doctors')}
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all group"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-blue-500/10">
              <span className="text-xl">👨‍⚕️</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">Doctors</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 text-center leading-relaxed px-2">
              Monthly tracking sheets and summary reports for senior doctors.
            </p>
          </button>
          
          <button 
            onClick={() => setCurrentView('residents')}
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all group"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-emerald-500/10">
              <span className="text-xl">🩺</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">Residents (Jr/Sr)</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 text-center leading-relaxed px-2">
              Shift tracking and roster management for Junior and Senior Residents.
            </p>
          </button>
          
          <button 
            onClick={() => setCurrentView('clerks')}
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all group ring-1 ring-amber-500/10 hover:ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-amber-500/10 ring-1 ring-amber-500/20">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-amber-400 mb-2 font-mono tracking-tight text-center">Clerks</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 text-center leading-relaxed px-2">
              Manage printing and generate precise A4 attendance grids for departmental staff.
            </p>
          </button>
        </div>
      </div>
    );
  }

  const monthNames = ["", "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
  const currentMonthLabel = monthNames[config.month] || "महिना";
  const currentMarathiYear = toMarathiDigits(config.year.toString());

  if (currentView === 'doctors') {
    return <DoctorAttendanceWorkspace onBack={() => setCurrentView('landing')} monthLabel={currentMonthLabel} marathiYear={currentMarathiYear} />;
  }

  if (currentView === 'residents') {
    return <ResidentAttendanceWorkspace onBack={() => setCurrentView('landing')} monthLabel={currentMonthLabel} marathiYear={currentMarathiYear} />;
  }

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-slate-950 font-sans text-slate-100 print-reset">
      
      {/* CUSTOM PRINT MEDIA STYLE OVERRIDES */}
      <style>{`
        @media print {
          /* Hide entire interface */
          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-reset {
            position: static !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            height: auto !important;
            width: auto !important;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Make the main print container visible and flow properly */
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 99999 !important;
            display: block !important;
          }
          /* Individual page styling */
          .print-page {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            page-break-after: always;
            page-break-inside: avoid;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* LEFT CONTROL COLUMN - SIDEBAR */}
      <div className={`transition-all duration-300 ease-in-out shrink-0 no-print border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden ${
        isSidebarOpen ? 'w-[320px] lg:w-[360px]' : 'w-0 border-r-0'
      }`}>
        <div className="w-[320px] lg:w-[360px] h-full flex flex-col">
          <ControlPanel 
            config={config}
            setConfig={setConfig}
            employees={employees}
            setEmployees={setEmployees}
            useMarathiNumerals={useMarathiNumerals}
            setUseMarathiNumerals={setUseMarathiNumerals}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* RIGHT PREVIEW WORKSPACE */}
      <div className="flex-1 flex flex-col bg-slate-920 overflow-hidden relative print-reset" id="preview-pane">
        
        {/* INTERACTIVE PREVIEW CONTROLS HEADER */}
        <div className="bg-slate-900 border-b border-slate-800 px-3 md:px-6 py-2 min-h-14 flex flex-wrap justify-between items-center no-print shrink-0 select-none gap-2">
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="px-2 md:px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-100 hover:text-amber-400 rounded-lg border border-slate-750 text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title={isSidebarOpen ? "नियंत्रण पट्टी लपवा (Hide Control Panel)" : "नियंत्रण पट्टी दाखवा (Show Control Panel)"}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 mx-auto" />
                  <span className="hidden xl:inline">Hide Editor</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-4 h-4 md:w-3.5 md:h-3.5 text-amber-400 mx-auto" />
                  <span className="font-extrabold text-amber-400 hidden xl:inline">Edit Details (दुरुस्ती करा)</span>
                </>
              )}
            </button>

            <button 
              onClick={() => setCurrentView('landing')} 
              className="px-2 md:px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-100 hover:text-amber-400 rounded-lg border border-slate-750 text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Back to Main Menu"
            >
              <Home className="w-4 h-4 md:w-3.5 md:h-3.5 text-slate-400 mx-auto" /> 
              <span className="hidden xl:inline">Back Home</span>
            </button>

            <div className="hidden md:block h-4 w-[1px] bg-slate-850 mx-1"></div>

            <span className="hidden lg:flex text-xs font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              A4 Landscape
            </span>
            <div className="hidden lg:block h-4 w-[1px] bg-slate-850 mx-1"></div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-850">
              <button 
                onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.05).toFixed(2))))}
                className="p-1 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded transition-all active:scale-90"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] md:text-[10.5px] font-mono text-slate-400 px-0.5 min-w-[32px] md:min-w-[36px] text-center font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(prev => Math.min(1.2, Number((prev + 0.05).toFixed(2))))}
                className="p-1 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded transition-all active:scale-90"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button 
              onClick={() => setZoom(0.75)} 
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-0.5 ml-1"
              title="Reset Zoom to 75%"
            >
              <RotateCcw className="w-3 h-3" /> <span className="hidden sm:inline">Fit</span>
            </button>
          </div>

          {/* Core Download and Print Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap ml-auto">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 md:p-2 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-850 transition-all"
              title="Need Help?"
            >
              <HelpCircle className="w-4 h-4 md:w-3.5 md:h-3.5 mx-auto" />
            </button>

            {/* DOWNLOAD PDF SEPARATELY BUTTON */}
            <button 
              onClick={handleDownloadPDFClick}
              className="px-2 md:px-3 lg:px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              title="Save this report to a high quality PDF file"
            >
              <Download className="w-4 h-4 md:w-3.5 md:h-3.5 text-amber-400" />
              <span className="hidden md:inline">PDF</span>
            </button>

            {/* PRINT SEPARATELY BUTTON */}
            <button 
              onClick={triggerNativePrint}
              className="px-2 md:px-3 lg:px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              title="Send directly to office printer"
            >
              <Printer className="w-4 h-4 md:w-3.5 md:h-3.5 font-bold" />
              <span className="hidden md:inline">Print</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA WITH CENTERING GRID */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start gap-4 bg-slate-920 scrollbar-thin print-reset">
          
          {/* HIGH FIDELITY ATTENDANCE PEN SELECTOR BAR (HIDES ON PRINT) */}
          <div className="no-print bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg flex flex-wrap items-center justify-center gap-2 md:gap-3 shadow-md select-none shrink-0 animate-in slide-in-from-top-3 duration-250">
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-wide">
              <Feather className="w-3 h-3 text-amber-500" /> Paint Pen:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {[
                { id: 'cycle', label: '🔄 Cycle (सायकल)', bg: 'bg-slate-800 border-slate-700 text-slate-200 ring-slate-500' },
                { id: 'P', label: '🟢 P (Present)', bg: 'bg-emerald-950 hover:bg-emerald-900 border-emerald-800 text-emerald-300 ring-emerald-500' },
                { id: 'A', label: '🔴 A (Absent)', bg: 'bg-rose-950 hover:bg-rose-900 border-rose-800 text-rose-300 ring-rose-500' },
                { id: 'WO', label: '🔵 WO (Off)', bg: 'bg-blue-950 hover:bg-blue-900 border-blue-800 text-blue-300 ring-blue-500' },
                { id: 'H', label: '🟡 H (Holiday)', bg: 'bg-amber-950 hover:bg-amber-900 border-amber-800 text-amber-300 ring-amber-500' },
                { id: '-', label: '⚪ Clear (-)', bg: 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 ring-slate-700' },
              ].map(pen => {
                const isSelected = activePen === pen.id;
                return (
                  <button
                    key={pen.id}
                    onClick={() => setActivePen(pen.id as any)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all border active:scale-95 ${
                      isSelected 
                        ? `${pen.bg} ring-1 ring-amber-400 font-extrabold shadow-sm scale-105` 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {pen.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative border border-slate-800/80 shadow-2xl p-4 bg-slate-900/10 rounded-xl print-reset">
            {/* Simulated Watermark Help Info label on screen */}
            <div className="absolute top-1 left-2 select-none pointer-events-none text-[10px] font-bold text-amber-500/15 uppercase font-mono no-print">
              Live Interactive Sheet • Click Cells to Paint
            </div>
            
            {/* The Actual Sheet Rendering */}
            <ReportTemplate 
              config={config}
              employees={employees}
              useMarathiNumerals={useMarathiNumerals}
              zoom={zoom}
              onCellClick={handleCellClick}
              activePen={activePen}
            />
          </div>
        </div>

        {/* BOTTOM QUICK INSTRUCTION STATS HEADER */}
        <div className="h-8 bg-slate-900 border-t border-slate-850 px-6 flex items-center justify-between text-[11px] text-slate-400 font-medium no-print shrink-0 select-none">
          <div className="flex items-center gap-2 text-amber-500/80">
            <Info className="w-3.5 h-3.5" />
            <span>Click any day status cell direct on the sheet to cycle: <strong>P</strong> (Present) → <strong>WO</strong> (Weekly Off) → <strong>H</strong> (Holiday) → <strong>A</strong> (Absent)</span>
          </div>
          <div>
            <span>Format: <strong>A4 Landscape 11px</strong></span>
          </div>
        </div>

      </div>

      {/* DETAILED INFORMATION MODAL (Need Help) */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-slate-200 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                attendance system Instructions
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans">
              <p>This system outputs high-fidelity print records matching the uploaded photo. Here's how you can use it:</p>
              
              <ul className="space-y-2 list-none pl-1">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Grid Interaction:</strong> Directly click on any day number cell (1 to 31) inside the table to instantly cycle: P → WO → H → A.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dynamic Calculations:</strong> Attendance tallies (Present, Absent, Holidays) update automatically for any month you select.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Bulk Actions:</strong> Switch to the <strong>'Employees Grid'</strong> tab to auto-mark all Sundays as Weekly Off (WO) or all other days as Present (P).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-405 shrink-0 mt-0.5" />
                  <span><strong>Official Authenticity:</strong> Toggle blue-violet ink hospital stamps & cursive signatures under the top settings bar.</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition-colors"
              >
                समजले (Understood)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIGH QUALITY PDF DOWNLOAD PRINT GUIDE MODAL */}
      {isDownloadGuideOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-200 shadow-2xl">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-400 leading-snug">
                    PDF Download & Print System
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">High-Fidelity Vector Document Guide</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDownloadGuideOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs select-none">
              <p className="text-slate-300 leading-relaxed font-sans">
                To download or print this report with **perfect vector clarity** (keeping Marathi characters crisp and preserving exact boundaries), we use the browser's built-in print framework.
              </p>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5 font-sans">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">Required Print Settings (महत्वाच्या सेटिंग्स):</span>
                
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                    <span className="font-semibold text-slate-400">1. Destination (साधन):</span>
                    <span className="font-extrabold text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-500/15">Save as PDF (पीडीएफ म्हणून सेव्ह करा)</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                    <span className="font-semibold text-slate-400">2. Layout (लेआउट):</span>
                    <span className="font-bold text-slate-200">Landscape (आडवे)</span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                    <span className="font-semibold text-slate-400">3. Paper Size (कागदाचा आकार):</span>
                    <span className="font-bold text-slate-200">A4</span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                    <span className="font-semibold text-slate-400">4. Margins (मार्जिन):</span>
                    <span className="font-bold text-emerald-400">None / Default (काहीही नाही)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400">5. Header / Footer & Background:</span>
                    <span className="font-bold text-slate-200 font-sans">Turn Off standard header/footer checkbox</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-850/40 p-3 rounded-lg flex items-start gap-2.5 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> In the next screen, simply click <strong>Print</strong> and select the <strong>Save as PDF</strong> option to instantly download and save your pristine report!
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setIsDownloadGuideOpen(false)}
                className="px-4 py-2 hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-xs transition-colors"
              >
                वापस जा (Go Back)
              </button>
              <button 
                onClick={() => {
                  setIsDownloadGuideOpen(false);
                  setTimeout(triggerNativePrint, 300);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Check className="w-4 h-4 text-slate-950 font-bold" />
                Proceed to PDF Download
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
