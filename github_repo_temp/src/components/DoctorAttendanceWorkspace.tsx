import React, { useState, useEffect } from 'react';
import { ChevronLeft, Printer, Download, Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { DoctorAttendanceReportTemplate, DoctorAttendanceRecord } from './DoctorAttendanceReportTemplate';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toMarathiDigits } from '../utils';
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

interface DoctorAttendanceWorkspaceProps {
  onBack: () => void;
  monthLabel: string;
  marathiYear: string;
}

export const DoctorAttendanceWorkspace: React.FC<DoctorAttendanceWorkspaceProps> = ({ onBack, monthLabel, marathiYear }) => {
  const [records, setRecords] = useState<DoctorAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('२१/०४/२०२६');
  const [toDate, setToDate] = useState('२०/०५/२०२६');
  const [reportDate, setReportDate] = useState('/०५/२०२६');
  
  const currentYear = new Date().getFullYear().toString();
  const [refYear, setRefYear] = useState(`/${toMarathiDigits(currentYear)}`);
  
  const [fontSizes, setFontSizes] = useState({
    title: 28,
    subtitle: 20,
    english: 16,
    body: 14,
    table: 14,
    tablePadding: 5,
  });

  const [activeTab, setActiveTab] = useState<'data' | 'doctors' | 'styles'>('data');
  const [zoom, setZoom] = useState(0.75);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'doctors'));
        const docs = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
            };
          })
          .filter((doc: any) => {
            const desig = (doc.designation || '').toLowerCase();
            return !desig.includes('senior resident') && !desig.includes('junior resident');
          });
        
        // Define designation hierarchy for sorting
        const hierarchy: Record<string, number> = {
          "Professor and Head": 1,
          "Associate Professor": 2,
          "Assistant Professor": 3,
          "Senior Resident": 4,
          "Junior Resident": 5,
          "Medical Officer": 6,
        };

        // Enforce specific sub-ordering for Assistant Professors as requested
        const nameOrder: Record<string, number> = {
          "sneha": 1,
          "gulabsing": 2,
          "minakshi": 3,
          "manoj": 4,
        };

        docs.sort((a, b) => {
          const rankA = hierarchy[a.designation] || 99;
          const rankB = hierarchy[b.designation] || 99;
          
          if (rankA !== rankB) {
            return rankA - rankB;
          }

          const nameA = (a.first_name || "").toLowerCase().trim();
          const nameB = (b.first_name || "").toLowerCase().trim();
          
          const orderA = nameOrder[nameA] || 99;
          const orderB = nameOrder[nameB] || 99;
          
          return orderA - orderB;
        });

        const mapped: DoctorAttendanceRecord[] = docs.map(d => ({
          id: d.id,
          name_mr: d.name_mr || `डॉ. ${d.first_name} ${d.last_name}`,
          designation_mr: d.designation_mr || d.designation,
          status: 'उपस्थित',
          remark: ''
        }));
        
        setRecords(mapped);
      } catch (error) {
        console.error("Error fetching doctors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleRecordChange = (id: string, field: keyof DoctorAttendanceRecord, value: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('doctor-print-area');
    if (!el) return;
    
    try {
      const currentTransform = el.parentElement!.style.transform;
      el.parentElement!.style.transform = 'none';

      const page = el.querySelector('.print-page') as HTMLElement;
      if (!page) return;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const dataUrl = await toPng(page, { pixelRatio: 4, quality: 1.0, backgroundColor: '#ffffff' });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(`डॉक्टर्रस उपस्थिती अहवाल ${monthLabel} ${marathiYear}.pdf`);

      el.parentElement!.style.transform = currentTransform;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-0 flex bg-slate-950 font-sans text-slate-100 print-reset">
      <style>{`
        @media print {
          body, html, #root { background: #ffffff !important; color: #000000 !important; }
          .print-reset { position: static !important; overflow: visible !important; }
          .no-print { display: none !important; }
          #doctor-print-area {
            position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important;
            background: #ffffff !important; z-index: 99999 !important; display: block !important;
          }
          .print-page {
            width: 210mm !important; height: 297mm !important; margin: 0 !important;
            page-break-after: always; background: #ffffff !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* LEFT SIDEBAR CONTROLS */}
      <div className="w-[320px] lg:w-[360px] h-full flex flex-col bg-slate-950 border-r border-slate-800 no-print shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-xl font-bold text-amber-400">Doctors Attendance</h2>
          <p className="text-xs text-slate-500 mt-1">Configure details for the printed report.</p>
        </div>

        <div className="flex border-b border-slate-800 shrink-0 px-2 pt-2 bg-slate-900/50">
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'data' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Dates
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'doctors' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Doctors
          </button>
          <button 
            onClick={() => setActiveTab('styles')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'styles' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Styles
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400">From Date (पासुन)</label>
                  <input 
                    type="text" 
                    value={fromDate}
                    onChange={e => setFromDate(toMarathiDigits(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">To Date (पर्यंत)</label>
                  <input 
                    type="text" 
                    value={toDate}
                    onChange={e => setToDate(toMarathiDigits(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-400">Dispatch Year (जा.क्र.)</label>
                  <input 
                    type="text" 
                    value={refYear}
                    onChange={e => setRefYear(toMarathiDigits(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Dispatch Date (दिनांक)</label>
                  <input 
                    type="text" 
                    value={reportDate}
                    onChange={e => setReportDate(toMarathiDigits(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'styles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-300">Font Size Settings</h3>
                <button 
                  onClick={() => setFontSizes({
                    title: 30,
                    subtitle: 20,
                    english: 18,
                    body: 14,
                    table: 14,
                    tablePadding: 8,
                  })}
                  className="text-xs bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">Main Title</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.title}</span>
                  </div>
                  <input type="range" min="20" max="40" value={fontSizes.title} onChange={e => setFontSizes({...fontSizes, title: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">Marathi Subtitle</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.subtitle}</span>
                  </div>
                  <input type="range" min="14" max="28" value={fontSizes.subtitle} onChange={e => setFontSizes({...fontSizes, subtitle: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">English Subtitle</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.english}</span>
                  </div>
                  <input type="range" min="12" max="24" step="0.1" value={fontSizes.english} onChange={e => setFontSizes({...fontSizes, english: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">Body / Letter Text</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.body}</span>
                  </div>
                  <input type="range" min="10" max="20" value={fontSizes.body} onChange={e => setFontSizes({...fontSizes, body: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">Table Text</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.table}</span>
                  </div>
                  <input type="range" min="10" max="20" value={fontSizes.table} onChange={e => setFontSizes({...fontSizes, table: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400">Table Padding / Spacing</label>
                    <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{fontSizes.tablePadding}</span>
                  </div>
                  <input type="range" min="2" max="16" value={fontSizes.tablePadding} onChange={e => setFontSizes({...fontSizes, tablePadding: Number(e.target.value)})} className="w-full accent-amber-500" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-300">Edit Records</h3>
                <button 
                  onClick={() => {
                    const newRecord: DoctorAttendanceRecord = {
                      id: `custom_${Date.now()}`,
                      name_mr: '',
                      designation_mr: '',
                      status: 'उपस्थित',
                      remark: ''
                    };
                    setRecords(prev => [...prev, newRecord]);
                  }}
                  className="text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2 py-1 rounded font-bold transition-colors"
                >
                  + Add Record
                </button>
              </div>
              {loading ? (
                <div className="text-center text-slate-500 py-4">Loading doctors...</div>
              ) : (
                records.map(record => (
                  <div key={record.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 relative group">
                    <button 
                      onClick={() => setRecords(prev => prev.filter(r => r.id !== record.id))}
                      className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove record"
                    >
                      ×
                    </button>
                    <div className="space-y-2 pr-4">
                      <ReactTransliterate
                        value={record.name_mr}
                        onChangeText={(text) => handleRecordChange(record.id, 'name_mr', text)}
                        lang="mr"
                        containerClassName="rt-container"
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-sm font-bold text-amber-400"
                        placeholder="Name (e.g. डॉ. राजेश सुभेदार)"
                      />
                      <ReactTransliterate
                        value={record.designation_mr}
                        onChangeText={(text) => handleRecordChange(record.id, 'designation_mr', text)}
                        lang="mr"
                        containerClassName="rt-container"
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-300"
                        placeholder="Designation (e.g. सहाय्यक प्राध्यापक)"
                      />
                      <ReactTransliterate 
                        value={record.status}
                        onChangeText={(text) => handleRecordChange(record.id, 'status', text)}
                        lang="mr"
                        containerClassName="rt-container"
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        placeholder="Status (e.g., उपस्थित)"
                      />
                      <ReactTransliterate 
                        value={record.remark}
                        onChangeText={(text) => handleRecordChange(record.id, 'remark', text)}
                        lang="mr"
                        containerClassName="rt-container"
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        placeholder="Remarks"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PREVIEW WORKSPACE */}
      <div className="flex-1 flex flex-col bg-slate-920 overflow-hidden relative">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 min-h-14 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" /> A4 Portrait
            </span>
            <div className="flex items-center gap-1 ml-4 bg-slate-950 p-1 rounded-md border border-slate-850">
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.05))} className="p-1 hover:bg-slate-850 text-slate-400 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.2, z + 0.05))} className="p-1 hover:bg-slate-850 text-slate-400 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setZoom(0.75)} className="text-[10px] text-slate-400 px-1 hover:text-white"><RotateCcw className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-2 border border-slate-700">
              <Download className="w-3.5 h-3.5 text-amber-400" /> PDF
            </button>
            <button onClick={handlePrint} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-2 shadow-md">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-920">
          <div className="relative border border-slate-800 shadow-2xl bg-white transition-transform origin-top" style={{ transform: `scale(${zoom})` }}>
            <div id="doctor-print-area">
              <DoctorAttendanceReportTemplate 
                records={records}
                fromDate={fromDate}
                toDate={toDate}
                reportDate={reportDate}
                refYear={refYear}
                fontSizes={fontSizes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
