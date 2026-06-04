import React from 'react';
import { toMarathiDigits } from '../utils';

export interface ResidentAttendanceRecord {
  id: string;
  name_mr: string;
  designation_mr: string;
  status: string; // 'उपस्थित' 
  remark: string; // custom remark
}

interface ResidentAttendanceReportTemplateProps {
  records: ResidentAttendanceRecord[];
  fromDate: string;
  toDate: string;
  reportDate: string;
  refYear: string;
  fontSizes?: {
    title: number;
    subtitle: number;
    english: number;
    body: number;
    table: number;
    tablePadding?: number;
  };
}

export const ResidentAttendanceReportTemplate: React.FC<ResidentAttendanceReportTemplateProps> = ({
  records,
  fromDate,
  toDate,
  reportDate,
  refYear,
  fontSizes
}) => {
  const fs = fontSizes || { title: 30, subtitle: 20, english: 18.4, body: 14, table: 14, tablePadding: 3 };
  const tPad = fs.tablePadding !== undefined ? fs.tablePadding : 3;
  const tPadSmall = Math.max(2, Math.floor(tPad / 2));

  return (
    <div className="print-page relative bg-white text-black mx-auto flex flex-col font-sans" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}>
      {/* Header */}
      <div className="text-center mb-4 flex flex-col gap-1">
        <h1 className="text-[#0d2a80] font-extrabold font-serif leading-none mb-0.5" style={{ fontSize: fs.title }}>बधिरीकरणशास्त्र विभाग</h1>
        <h2 className="font-bold leading-tight" style={{ fontSize: fs.subtitle }}>जननायक बिरसा मुंडा शासकीय वैद्यकीय महाविद्यालय, नंदुरबार</h2>
        <p className="text-[#0d2a80] font-bold leading-tight" style={{ fontSize: fs.body }}>जिल्हा सामान्य रुग्णालय परिसर, साक्रीरोड, नंदुरबार - ४२५४१२</p>
        
        <h2 className="font-bold tracking-tight leading-tight mt-0.5" style={{ fontSize: fs.english }}>JANNAYAK BIRSA MUNDA GOVERNMENT MEDICAL COLLEGE, NANDURBAR</h2>
        <p className="text-[#0d2a80] font-bold leading-tight" style={{ fontSize: fs.body }}>DISTRICT CIVIL HOSPITAL AREA, SAKRI ROAD, NANDURBAR - 425412</p>
        
        <div className="text-left font-bold leading-tight mt-1" style={{ fontSize: fs.body }}>EMAIL.: gmcn.anaesthesiology@gmail.com</div>
        <div className="border-t border-b border-black py-1 mt-1 flex justify-between font-bold" style={{ fontSize: Math.max(10, fs.body - 2) }}>
          <div>जा.क्र.जबिमुंशावैमनं/बधिरीकरणशास्त्र/ वरिष्ठ-कनिष्ठ निवासी/उपस्थिती अहवाल/ <span className="inline-block w-16"></span> /{refYear.replace(/^\//, '')}</div>
          <div>दिनांक :- <span className="inline-block w-12"></span> {reportDate}</div>
        </div>
      </div>

      <div className="mb-4" style={{ fontSize: fs.body }}>
        <div>प्रति,</div>
        <div className="ml-8">
          <div>मा. अधिष्ठाता,</div>
          <div>ज.बि.मुं.शासकीय वैद्यकीय महाविद्यालय,</div>
          <div>नंदुरबार.</div>
        </div>
      </div>

      <div className="text-center font-bold mb-6 underline underline-offset-4" style={{ fontSize: fs.body + 1 }}>
        विषय :- बधिरीकरणशास्त्र विभागातील वरिष्ठ -कनिष्ठ निवासी यांचा उपस्थिती अहवाल सादर करणेबाबत.
      </div>

      <div className="mb-4" style={{ fontSize: fs.body }}>
        <div>मा. महोदय,</div>
        <div className="indent-8 text-justify mt-2 leading-relaxed">
          उपरोक्त विषयास अनुसरून बधिरीकरणशास्त्र विभाग, ज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय, नंदुरबार येथील <span className="font-bold">वरिष्ठ-कनिष्ठ निवासी</span> यांचा दि. {fromDate} ते दि. {toDate} रोजी पर्यंतचा उपस्थिती अहवाल खालीलप्रमाणे सादर करण्यात येत आहे.
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-black text-center mb-8" style={{ fontSize: fs.table }}>
        <thead>
          <tr>
            <th className="border border-black font-bold w-12 align-middle" style={{ padding: tPad }} rowSpan={3}>अ.<br/>क्र.</th>
            <th className="border border-black font-bold w-48 align-middle" style={{ padding: tPad }} rowSpan={3}>अधिकारी व<br/>कर्मचाऱ्यांची नावं</th>
            <th className="border border-black font-bold w-32 align-middle" style={{ padding: tPad }} rowSpan={3}>पदनाम</th>
            <th className="border border-black font-bold" style={{ padding: tPadSmall }} colSpan={2}>उपस्थिती</th>
            <th className="border border-black font-bold w-48 align-middle" style={{ padding: tPad }} rowSpan={3}>शेरा</th>
          </tr>
          <tr>
            <th className="border border-black font-bold w-24" style={{ padding: tPadSmall }}>पासुन</th>
            <th className="border border-black font-bold w-24" style={{ padding: tPadSmall }}>पर्यंत</th>
          </tr>
          <tr>
            <th className="border border-black font-bold" style={{ padding: tPadSmall }}>{fromDate}</th>
            <th className="border border-black font-bold" style={{ padding: tPadSmall }}>{toDate}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((doc, idx) => (
            <tr key={doc.id}>
              <td className="border border-black font-bold" style={{ padding: tPad }}>{toMarathiDigits((idx + 1).toString())}</td>
              <td className="border border-black text-left" style={{ padding: tPad }}>{doc.name_mr || '-'}</td>
              <td className="border border-black" style={{ padding: tPad }}>{doc.designation_mr || '-'}</td>
              <td className="border border-black" style={{ padding: tPad }} colSpan={2}>{doc.status}</td>
              <td className="border border-black leading-tight" style={{ padding: tPad, fontSize: Math.max(10, fs.table - 2) }}>{doc.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mb-12" style={{ fontSize: fs.body }}>
        आपल्या माहितीस्तव व पुढील योग्य त्या कार्यवाहीस्तव सविनय सादर.
      </div>

      <div className="flex justify-end">
        <div className="text-center text-base">
          <div>प्राध्यापक</div>
          <div>बधिरीकरणशास्त्र विभाग,</div>
          <div>ज.बि.मुं. शासकीय वैद्यकीय महाविद्यालय,</div>
          <div>नंदुरबार.</div>
        </div>
      </div>
    </div>
  );
};
