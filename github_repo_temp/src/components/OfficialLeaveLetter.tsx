import React, { useState, useRef } from "react";
import { FileSignature, Printer, Users } from "lucide-react";
import { ReactTransliterate } from "react-transliterate";
import { useToast } from "../context/ToastContext";
import DatePickerInput from './ui/DatePickerInput';

const numberToMarathiWord = (num: number): string => {
  const words: Record<number, string> = {
    1: 'एक', 2: 'दोन', 3: 'तीन', 4: 'चार', 5: 'पाच', 
    6: 'सहा', 7: 'सात', 8: 'आठ', 9: 'नऊ', 10: 'दहा',
    11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा',
    16: 'सोळा', 17: 'सतरा', 18: 'अठरा', 19: 'एकोणीस', 20: 'वीस'
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

const formatToMarathiDateText = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  const months = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
  ];
  const marathiMonth = months[parseInt(month, 10) - 1];
  return englishToMarathiNumber(`${day} ${marathiMonth} ${year}`);
};

export default function OfficialLeaveLetter() {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    doctorName: "डॉ. राजेश सुभेदार",
    doctorDesignation: "प्राध्यापक",
    leaveType: "किरकोळ", // 'किरकोळ' or 'अर्जित'
    reason: "कौटुंबिक",
    totalDays: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeHolidays: false,
    holidaysDesc: "दि. १९ फेब्रुवारी शासकीय सुट्टी व दि. २२ फेब्रुवारी.२०२६ रविवार सह",
    requestHQLeave: false,
    subDoctorName: "डॉ. योगेश बोरसे",
    subDoctorDesignation: "सहयोगी प्राध्यापक",
    letterDate: new Date().toISOString().split('T')[0],
    refNumber: "१२३",
    signatoryTitle: "प्राध्यापक"
  });

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 1;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    const diff = e.getTime() - s.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const currentDays = calcDays();

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups for printing.", "error");
      return;
    }
    
    const printContent = printRef.current?.innerHTML || "";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Leave Official Letter - ${formData.doctorName}</title>
          <style>
            @page { size: A4; margin: 0; }
            @media print {
               @page { margin-top: 0; margin-bottom: 0; }
               body { padding: 0mm; margin: 0; }
               .print-content { padding: 15mm 25mm 25mm 25mm !important; }
            }
            body { 
              margin: 0; padding: 0; 
              background: white; 
              font-family: 'Times New Roman', Georgia, serif;
              color: black;
            }
            p { margin: 0; }
            .header-marathi { font-family: 'Arial', sans-serif; }
            /* Map tailwind layout classes generically */
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .underline { text-decoration-line: underline; }
            .inline-block { display: inline-block; }
            .border-b-2 { border-bottom: 2px solid black; }
            .border-black { border-color: black; }
            .border-b { border-bottom: 1px solid black; }
            .pt-1 { padding-top: 0.25rem; }
            .pb-1 { padding-bottom: 0.25rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-12 { margin-top: 3rem; }
            .mt-16 { margin-top: 4rem; }
            .ml-4 { margin-left: 1rem; }
            .ml-8 { margin-left: 2rem; }
            .indent-12 { text-indent: 3rem; }
            .text-blue-900 { color: #1e3a8a; }
            .flex-col { flex-direction: column; }
          </style>
        </head>
        <body>
          <div class="print-content" style="padding: 15mm 25mm 25mm 25mm;">
            ${printContent}
          </div>
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

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full">
      {/* Configuration Panel */}
      <div className="w-full xl:w-1/3 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm h-fit">
        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
          <FileSignature className="w-5 h-5 text-indigo-600" />
          Official Letter Generator
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Doctor Name</label>
              {/* @ts-ignore */}
<ReactTransliterate
                value={formData.doctorName}
                onChangeText={(text) => setFormData({...formData, doctorName: text})}
                lang="mr"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Designation</label>
              {/* @ts-ignore */}
<ReactTransliterate
                value={formData.doctorDesignation}
                onChangeText={(text) => setFormData({...formData, doctorDesignation: text})}
                lang="mr"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Leave Type</label>
                <select 
                  value={formData.leaveType} 
                  onChange={(e) => setFormData({...formData, leaveType: e.target.value})} 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                >
                  <option value="किरकोळ">Casual (किरकोळ)</option>
                  <option value="अर्जित">Earned (अर्जित)</option>
                </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Reason</label>
               <select 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                >
                  <option value="कौटुंबिक">Family (कौटुंबिक)</option>
                  <option value="तातडीच्या">Urgent (तातडीच्या)</option>
                  <option value="वैद्यकीय">Medical (वैद्यकीय)</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
              <DatePickerInput 
                value={formData.startDate} 
                onChange={(date) => setFormData({...formData, startDate: date})} 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">End Date</label>
              <DatePickerInput 
                value={formData.endDate} 
                onChange={(date) => setFormData({...formData, endDate: date})} 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.includeHolidays} 
                  onChange={(e) => setFormData({...formData, includeHolidays: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Include Holidays (तसेच मागे दि...)</span>
             </label>
             {formData.includeHolidays && (
                <>
                  {/* @ts-ignore */}
                  <ReactTransliterate
                    value={formData.holidaysDesc}
                    onChangeText={(text) => setFormData({...formData, holidaysDesc: text})}
                    lang="mr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    placeholder="सुट्ट्यांचा तपशील..."
                  />
                </>
             )}
             
             <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  checked={formData.requestHQLeave} 
                  onChange={(e) => setFormData({...formData, requestHQLeave: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Request Headquarter Leave (मुख्यालय)</span>
             </label>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Charge Handover</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Sub. Doctor Name</label>
                {/* @ts-ignore */}
<ReactTransliterate
                  value={formData.subDoctorName}
                  onChangeText={(text) => setFormData({...formData, subDoctorName: text})}
                  lang="mr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Sub. Designation</label>
                {/* @ts-ignore */}
<ReactTransliterate
                  value={formData.subDoctorDesignation}
                  onChangeText={(text) => setFormData({...formData, subDoctorDesignation: text})}
                  lang="mr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-4" />

          <button 
            onClick={handlePrint}
            className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            <Printer className="w-5 h-5"/> Print Official Letterhead
          </button>
        </div>
      </div>

      {/* A4 Preview Panel */}
      <div className="flex-1 bg-slate-200 p-8 rounded-[2rem] flex justify-center overflow-x-auto shadow-inner">
         <div 
           ref={printRef}
           className="bg-white shadow-xl text-black text-[11px] leading-[1.3] relative object-contain"
           style={{ width: '210mm', minHeight: '297mm', padding: '15mm 25mm 25mm 25mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
         >
           
           {/* Header - EXACT REPLICATION */}
           <div className="text-center w-full header-marathi mb-1">
              <h1 className="text-[1.5rem] font-black text-blue-900 mb-1 tracking-wide" style={{ color: '#002060' }}>बधिरीकरणशास्त्र विभाग</h1>
              <h2 className="text-[1.1rem] font-bold mb-0.5">जननायक बिरसा मुंडा शासकीय वैद्यकीय महाविद्यालय, नंदुरबार</h2>
              <p className="text-[0.9rem] font-bold text-blue-900 mb-0.5" style={{ color: '#002060' }}>जिल्हा सामान्य रुग्णालय परिसर, साक्रीरोड, नंदुरबार– ४२५४१२</p>
              
              <h3 className="text-[0.9rem] font-bold mb-0 uppercase tracking-wide">Jannayak Birsa Munda Government Medical College, Nandurbar</h3>
              <p className="text-[0.7rem] font-bold text-blue-900 mb-1 uppercase tracking-wide" style={{ color: '#002060' }}>District Civil Hospital Area, Sakri Road, Nandurbar - 425412</p>
              
              <div className="text-left font-bold text-[0.85rem] flex justify-start items-center ml-2">
                EMAIL.: gmcn.anaesthesiology@gmail.com
              </div>
           </div>

           {/* Ref and Date Line */}
           <div className="flex justify-between items-center border-t border-b border-black py-1 mb-8 text-[11px] font-semibold whitespace-nowrap">
              <div className="flex items-center">
                जा.क्र.ज.वि.मुं.शावेमनं/बधिरीकरणशास्त्र वि. / रजा /
                <span className="inline-block px-2">{englishToMarathiNumber(formData.refNumber)}</span>
                /२०२६
              </div>
              <div className="flex items-center">
                दिनांक :- <span className="inline-block px-2">{formatDateToMarathi(formData.letterDate)}</span>
              </div>
           </div>

           {/* To Address */}
           <div className="text-left mb-6 pl-4" style={{ fontFamily: 'Arial, sans-serif' }}>
             <p>प्रति,</p>
             <p className="ml-8">मा. अधिष्ठाता,</p>
             <p className="ml-8">ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय,</p>
             <p className="ml-8">नंदुरबार.</p>
           </div>

           {/* Subject - Dynamic based on leave type */}
           <div className="text-center mb-8 px-10 leading-relaxed font-bold text-[11px]">
             <p>
               विषय :- {formData.doctorName} ({formData.doctorDesignation}) यांना {formData.reason} कारणास्तव {formData.leaveType} रजा मिळणेबाबत...
             </p>
           </div>

           {/* Body */}
           <div className="text-justify mb-8 text-[11px] leading-[1.8]" style={{ fontFamily: 'Arial, sans-serif' }}>
             <p className="mb-2">मा. महोदय,</p>
             
             <p className="indent-12 mb-2">
               {formData.leaveType === 'अर्जित' ? 'उपरोक्त विषयास अनुसरून सादर करण्यात येते की,' : 'उपरोक्त विषयान्वये मला'} {formData.leaveType === 'अर्जित' ? `${formData.doctorName} हे बधिरीकरणशास्त्र विभाग, ज.बि.मुं शासकीय वैद्यकीय महाविद्यालय, नंदुरबार येथे ${formData.doctorDesignation} या पदावर कार्यरत असून त्यांनी ${formData.reason} कारणास्तव` : `${formData.reason} कारणास्तव`} दि. {formatToMarathiDateText(formData.startDate)} ते दि. {formatToMarathiDateText(formData.endDate)} रोजी पर्यंत एकूण {englishToMarathiNumber(String(currentDays).padStart(2, '0'))} दिवसांची {formData.leaveType} रजा मंजूर करावी ही विनंती. {formData.leaveType === 'अर्जित' ? 'सोबत विहित नमुन्यात अर्जित रजेचा अर्ज जोडलेला आहे.' : ''}
             </p>

             {formData.includeHolidays && (
                <p className="indent-12 mb-2">
                  तसेच मागे दि. {formData.holidaysDesc} {formData.requestHQLeave ? 'मुख्यालय सोडण्याची परवानगी मिळावी यासाठी अर्जित रजेचा अर्ज सादर केलेला आहे.' : 'मुख्यालय सोडण्याची परवानगी मिळावी ही विनंती.'}
                </p>
             )}

             <p className="indent-12 mb-6 md:mt-6">
               माझ्या रजेच्या कालावधीत {formData.subDoctorName}, {formData.subDoctorDesignation} हे स्वत:चा कार्यभार सांभाळून विभागाचे कामकाज सांभाळतील.
             </p>

             {formData.leaveType === 'अर्जित' && (
                <p className="indent-12 mb-6">
                  सोबत विहित नमुन्यात अर्जित रजेचा अर्ज जोडलेला आहे.
                </p>
             )}

             <p className="indent-12 md:mt-6">
               आपल्या माहिती व पुढील योग्य त्या कार्यवाहीस्तव सविनय सादर.
             </p>
           </div>

           {/* Signatory */}
           <div className="text-right mt-20 mb-24 flex justify-end" style={{ fontFamily: 'Arial, sans-serif' }}>
             <div className="flex flex-col items-center">
               <p className="font-bold">{formData.signatoryTitle},</p>
               <p>बधिरीकरणशास्त्र विभाग,</p>
               <p>ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय,</p>
               <p>नंदुरबार.</p>
             </div>
           </div>

           {/* CC Block */}
           <div className="text-left font-bold text-[11px]" style={{ fontFamily: 'Arial, sans-serif' }}>
             <p>प्रत - {formData.subDoctorName}, {formData.subDoctorDesignation}, बधिरीकरणशास्त्र विभाग, ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय, नंदुरबार.</p>
           </div>

         </div>
      </div>

    </div>
  );
}
