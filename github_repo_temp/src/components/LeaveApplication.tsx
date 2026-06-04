import React, { useState, useRef } from "react";
import { CalendarRange, Printer, Save, User, Clock, CheckCircle, FileSignature } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import DatePickerInput from './ui/DatePickerInput';
import OfficialLeaveLetter from "./OfficialLeaveLetter";

const REASONS = {
  family: { subject: "कौटुंबिक कारणास्तव", body: "कौटुंबिक कारणास्तव" },
  personal: { subject: "वैयक्तिक कारणास्तव", body: "वैयक्तिक कामानिमित्त" },
  religious: { subject: "धार्मिक कारणास्तव", body: "धार्मिक कामानिमित्त" },
  medical: { subject: "वैद्यकीय कारणास्तव", body: "वैद्यकीय कारणास्तव" },
  casual: { subject: "किरकोळ कारणास्तव (CL)", body: "किरकोळ कामानिमित्त" },
  earned: { subject: "नियोजित कारणास्तव (EL)", body: "नियोजित कामानिमित्त" },
  duty: { subject: "शासकीय कामानिमित्त (Duty Leave)", body: "शासकीय कामासाठी / बैठकीसाठी उपस्थित राहायचे असल्याने" },
  maternity: { subject: "प्रसूती", body: "प्रसूती रजेकरिता" },
  coff: { subject: "प्रतिपूर्ती (C-Off)", body: "सार्वजनिक सुट्टीच्या दिवशी केलेल्या शासकीय कामाच्या मोबदल्यात प्रतिपूर्ती" },
  study: { subject: "अभ्यास / प्रशिक्षण", body: "पुढील शिक्षणाकरिता / प्रशिक्षणाकरिता" }
};

const numberToMarathiWord = (num: number): string => {
  const words: Record<number, string> = {
    1: 'एका', 2: 'दोन', 3: 'तीन', 4: 'चार', 5: 'पाच', 
    6: 'सहा', 7: 'सात', 8: 'आठ', 9: 'नऊ', 10: 'दहा',
    11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा'
  };
  return words[num] || num.toString();
};

const englishToMarathiNumber = (num: number | string): string => {
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, (match) => digits[Number(match)]);
};

const formatDateToMarathi = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return englishToMarathiNumber(`${day}/${month}/${year}`);
};

export default function LeaveApplication() {
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    applicantName: userData?.marathiName || userData?.name || "सागर संजय कांबळे",
    gender: "male",
    designation: userData?.designation || "कनिष्ठ लिपिक",
    reason: "family" as keyof typeof REASONS,
    applicationDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [isSaving, setIsSaving] = useState(false);

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 1;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    const diff = e.getTime() - s.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const days = calcDays();

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups for printing.", "error");
      return;
    }
    
    // We fetch current HTML of the preview block without Tailwind's interactive classes
    // and inject standard generic styling to guarantee a perfect A4 Marathi print.
    const printContent = printRef.current?.innerHTML || "";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Leave Application - ${formData.applicantName}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            @media print {
               @page { margin-top: 0; margin-bottom: 0; }
               body { padding-top: 25mm; padding-bottom: 25mm; }
            }
            body { 
              margin: 0; padding: 0; 
              background: white; 
              font-family: Arial, "Nirmala UI", sans-serif;
              font-size: 14pt;
              line-height: 1.4;
              color: black;
            }
            p { margin: 0; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-end { align-items: flex-end; }
            .font-bold { font-weight: 700; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .underline { text-decoration-line: underline; }
            .underline-offset-4 { text-underline-offset: 4px; }
            .inline-block { display: inline-block; }
            .border-b-2 { border-bottom: 2px solid black; }
            .border-black { border-color: black; }
            .pb-1 { padding-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mb-10 { margin-bottom: 2.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-12 { margin-top: 3rem; }
            .mt-16 { margin-top: 4rem; }
            .mt-24 { margin-top: 6rem; }
            .indent-12 { text-indent: 3rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveInfo = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const leaveId = `LV-${Date.now()}`;
      const payload = {
        applicantName: formData.applicantName,
        designation: formData.designation,
        reason: formData.reason,
        days: days,
        applicationDate: formData.applicationDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        timestamp: new Date().toISOString(),
        userId: user?.uid || "unknown",
        status: "Submitted"
      };

      await setDoc(doc(db, "leave_applications", leaveId), payload);
      showToast("Leave request saved digitally!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to save record", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const [mode, setMode] = useState<'application' | 'official'>('application');

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setMode('application')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'application' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Staff Leave Application
        </button>
        <button
          onClick={() => setMode('official')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'official' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileSignature className="w-4 h-4" /> Official Letterhead
        </button>
      </div>

      {mode === 'official' ? (
        <OfficialLeaveLetter />
      ) : (
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Configuration Panel */}
          <div className="w-full xl:w-1/3 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm h-fit">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <CalendarRange className="w-6 h-6 text-indigo-600" />
              Leave Configurator
            </h2>
            
            <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Applicant Name <span className="text-indigo-500 font-semibold lowercase tracking-normal">(Type English → Hit Space)</span>
            </label>
            {/* @ts-ignore */}
            <ReactTransliterate
              value={formData.applicantName}
              onChangeText={(text) => setFormData({...formData, applicantName: text})}
              lang="mr"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              containerClassName="w-full"
              activeItemStyles={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
            />
            <p className="text-[10px] text-slate-400 mt-2 italic">E.g. Type "Sagar" and press Space to get "सागर"</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Gender</label>
              <select 
                value={formData.gender} 
                onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              >
                <option value="male">Male (करतो)</option>
                <option value="female">Female (करते)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Application Date</label>
              <DatePickerInput 
                value={formData.applicationDate} 
                onChange={(date) => setFormData({...formData, applicationDate: date})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Leave Category</label>
             <select 
                value={formData.reason} 
                onChange={(e) => setFormData({...formData, reason: e.target.value as any})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium text-sm"
              >
                <option value="family">Family (कौटुंबिक)</option>
                <option value="personal">Personal (वैयक्तिक)</option>
                <option value="medical">Medical (वैद्यकीय)</option>
                <option value="religious">Religious (धार्मिक)</option>
                <option disabled>──────────</option>
                <option value="casual">Casual Leave (किरकोळ - CL)</option>
                <option value="earned">Earned Leave (अर्जित - EL)</option>
                <option value="coff">Compensatory Off (प्रतिपूर्ती)</option>
                <option value="duty">Duty Leave (शासकीय काम)</option>
                <option value="maternity">Maternity Leave (प्रसूती)</option>
                <option value="study">Study/Training (प्रशिक्षण)</option>
              </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
              <DatePickerInput 
                value={formData.startDate} 
                onChange={(date) => setFormData({...formData, startDate: date})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">End Date</label>
              <DatePickerInput 
                value={formData.endDate} 
                onChange={(date) => setFormData({...formData, endDate: date})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>
          
          {/* Smart Balance Widget */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wides flex items-center gap-2 mb-3">
               <Clock className="w-4 h-4"/> Smart Calculator
            </h4>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
               <span className="font-medium text-slate-600 text-sm">Total Approved Days:</span>
               <span className="font-black text-indigo-600 text-xl">{days} D</span>
            </div>
          </div>

          <hr className="border-slate-100 my-6" />

          <div className="flex flex-col gap-3">
             <button 
                onClick={handlePrint}
                className="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
              >
                <Printer className="w-5 h-5"/> Print & Generate Paper
              </button>
              
              <button 
                onClick={handleSaveInfo}
                disabled={isSaving}
                className="w-full bg-white text-emerald-600 border-2 border-emerald-100 font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-95 transition-all"
              >
                {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-5 h-5"/> Submit Digitally to HOD</>}
              </button>
          </div>
        </div>
      </div>

      {/* A4 WYSIWYG Preview Panel */}
      <div className="flex-1 bg-slate-200 p-8 rounded-[2rem] flex justify-center overflow-x-auto shadow-inner">
         <div 
           ref={printRef}
           className="bg-white shadow-xl text-black text-[14pt] leading-[1.4]"
           style={{ width: '210mm', minHeight: '297mm', padding: '25.4mm', boxSizing: 'border-box', fontFamily: 'Arial, "Nirmala UI", sans-serif' }}
         >
           
           <div className="text-left mb-8" style={{ width: '50%', marginLeft: '50%' }}>
             <p className="font-bold">{formData.applicantName},</p>
             <p>({formData.designation}),</p>
             <p>बधिरीकरणशास्त्र विभाग,</p>
             <p>ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय,</p>
             <p>नंदुरबार.</p>
             <p className="mt-1">दि. {formatDateToMarathi(formData.applicationDate)}</p>
           </div>

           <div className="text-left mb-8">
             <p>प्रति,</p>
             <p>प्राध्यापक व विभागप्रमुख,</p>
             <p>बधिरीकरणशास्त्र विभाग,</p>
             <p>ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय,</p>
             <p>नंदुरबार.</p>
           </div>

           <div className="text-center mb-8">
             <h2 className="inline-block font-bold" style={{ fontSize: '15pt' }}>
               विषय :- <span style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{REASONS[formData.reason].subject} रजा मिळणेबाबत....</span>
             </h2>
           </div>

           <div className="text-justify mb-8">
             <p className="mb-6">मा. महोदय,</p>
             
             <p className="indent-12 mb-6" style={{ lineHeight: 1.6 }}>
               उपरोक्त विषयास अनुसरून मी <strong style={{ fontWeight: 900 }}>{formData.applicantName}, {formData.designation}, बधिरीकरणशास्त्र विभाग</strong>, ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय, नंदुरबार, सविनय अर्ज सादर {formData.gender === 'male' ? 'करतो' : 'करते'} की, मला {REASONS[formData.reason].body} दि. {formatDateToMarathi(formData.startDate)}{" "}
               {days === 1 
                  ? `रोजी एका (१) दिवसाची रजा मिळावी ही नम्र विनंती.`
                  : `ते दि. ${formatDateToMarathi(formData.endDate)} या कालावधीसाठी रजा मिळावी.`}
             </p>

             {days > 1 && (
               <p className="indent-12 mb-6">
                 करिता माझी {englishToMarathiNumber(days)}({numberToMarathiWord(days)}) दिवसाची रजा मंजूर करावीत ही नम्र विनंती.
               </p>
             )}

             <p className="indent-12">
               आपल्या माहितीस्तव व पुढील योग्य त्या कार्यवाहीस्तव सविनय सादर.
             </p>
           </div>

           <div className="text-center mt-24" style={{ width: '50%', marginLeft: '50%' }}>
             <p className="font-bold">{formData.applicantName},</p>
             <p>({formData.designation})</p>
           </div>

         </div>
      </div>

     </div>
     )}
    </div>
  );
}
