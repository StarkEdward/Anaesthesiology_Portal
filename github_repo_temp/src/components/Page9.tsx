import { DateInput } from "./DateInput";
import React from 'react';

export default function Page9() {
  const checkItems = [
    "Recent Passport size photo of Employee, Signed by Dean/Principal of college",
    "Photo ID proof (Govt. Authority issued): Passport/PAN Card/Voter ID/Aadhar Card",
    "Certified copy of Appointment order of the present Institute.",
    "Proof of Residence: Passport/Voter Card/Electricity/Landline phone bill/ Aadhar Card",
    "Joining report at the present institute.",
    "Copies of MBBS, PG, PhD degrees (as applicable).",
    "Copies of MBBS, PG, PhD degree Registration Certificates (as applicable).",
    "Copy of experience certificates of all teaching appointments before joining present post.",
    "Relieving order from the previous institution/posting.",
    "Copy of PAN Card, AADHAR card",
    "Letter head (in case of teachers who are practicing)",
    "Copy of letter from affiliating University recognizing as UG teacher",
    "Copy of letter from affiliating University recognizing as PG teacher (for PG assessment)",
    "Copy of MET certificates: rBCW/ BCME/ CISP/ ACME/ Others"
  ];

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="text-center pb-4 pt-4">
        <h2 className="text-[14px] font-bold uppercase tracking-wider underline underline-offset-4">CHECKLIST</h2>
      </div>

      <div className="w-full">
        <table className="w-full border-collapse border border-black doc-table">
          <thead>
            <tr>
              <th className="border border-black p-2 text-center w-12 font-bold bg-transparent text-black text-[12px]">Sl</th>
              <th className="border border-black p-2 text-left font-bold bg-transparent text-black text-[12px]">Documents</th>
              <th className="border border-black p-2 text-center w-32 font-bold bg-transparent text-black text-[12px]">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {checkItems.map((item, index) => (
              <tr key={index}>
                <td className="border border-black p-[6px] text-center shrink-0 h-[28px]">{index + 1}.</td>
                <td className="border border-black p-[6px] leading-[1.2] h-[28px]">{item}</td>
                <td className="border border-black p-1 text-center whitespace-nowrap align-middle h-[28px]">
                   <div className="flex space-x-4 justify-center">
                     <label className="cursor-pointer flex items-center"><input type="radio" name={`check_${index}`} value="Yes" className="mr-1"/>Yes</label>
                     <label className="cursor-pointer flex items-center"><input type="radio" name={`check_${index}`} value="No" className="mr-1"/>No</label>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end pt-12 pb-6 mt-6">
         <div className="flex flex-col">
           <input type="text" className="w-56 border-b border-black block bg-transparent focus:outline-none focus:bg-gray-100 mb-1" />
           <p className="font-bold mb-6">Signature of Faculty</p>
           <div className="flex items-center gap-2">
             <p className="font-bold">Date:</p>
             <DateInput   className="w-32 border-b border-black text-center tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" />
           </div>
         </div>
         <div className="flex flex-col">
           <input type="text" className="w-56 border-b border-black block bg-transparent focus:outline-none focus:bg-gray-100 mb-1" />
           <p className="font-bold mb-6">Signature of the HoD.</p>
           <div className="flex items-center gap-2">
             <p className="font-bold">Date:</p>
             <DateInput   className="w-32 border-b border-black text-center tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" />
           </div>
         </div>
      </div>

      <div className="pb-6 pt-8">
         <div className="flex flex-col">
           <input type="text" className="w-72 border-b border-black block bg-transparent focus:outline-none focus:bg-gray-100 mb-1" />
           <p className="font-bold mb-2">Signature of Head of Institute</p>
           <div className="flex items-center gap-2">
             <p className="font-bold">Date:</p>
             <DateInput   className="w-32 border-b border-black text-center tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" />
           </div>
         </div>
      </div>

      <div className="space-y-2 pt-16">
        <div className="text-center font-bold text-[14px] tracking-wider mb-2">NOTE</div>
        
        <div className="flex items-start text-justify">
          <span className="w-8 shrink-0 font-bold">1.</span>
          <p className="flex-grow">
            This Declaration Form will not be accepted and the Faculty member will not be considered as a
            Teaching Faculty in case any of the documents listed above are not enclosed/attached with the
            Declaration Form.
          </p>
        </div>

        <div className="flex items-start text-justify">
          <span className="w-8 shrink-0 font-bold">2.</span>
          <p className="flex-grow">
            The Faculty member will not be considered as a Teaching Faculty if the original Appointment letter,
            Relieving order, Experience certificates, Government Photo ID, Degrees, Registration Certificates,
            PAN Card, Aadhar Card, State Medical Council ID (if issued) are not produced for verification at the
            time of assessment.
          </p>
        </div>

        <div className="flex items-start text-justify">
          <span className="w-8 shrink-0 font-bold">3.</span>
          <p className="flex-grow">
            Faculty members must submit the revised Declaration form in this format only, Submissions in the old
            format will be rejected and Faculty members will not be considered as Teaching Faculty.
          </p>
        </div>
        
        <div className="text-center w-full block mt-4 font-bold tracking-widest text-[#555] opacity-50">
          --------------------------------------------------------------------------------------------------
        </div>
      </div>
    </div>
  );
}
