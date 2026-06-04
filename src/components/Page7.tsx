import { DateInput } from "./DateInput";
import React from 'react';
import { useFormContext } from '../context/FormContext';

export default function Page7() {
  const { formData } = useFormContext();
  const fullName = [formData.facultyNameFirst, formData.facultyNameMiddle, formData.facultyNameLast].filter(Boolean).join(' ');

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="text-center pb-6">
        <h2 className="text-[14px] font-bold tracking-widest uppercase underline underline-offset-4">DECLARATION</h2>
      </div>

      <div className="space-y-6 text-justify leading-relaxed">
        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">1.</span>
          <div className="flex-grow">
            I, Dr. <input type="text" defaultValue={fullName} className="w-48 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> am working in the capacity of 
            <input type="text" defaultValue={formData.designation} className="w-48 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> in the Department of 
            <input type="text" defaultValue={formData.department} className="w-48 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> at 
            <input type="text" defaultValue={formData.collegeName} className="w-72 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> Medical College and do hereby give an undertaking 
            that I am employed as a full time teaching faculty, working from 
            <input type="text" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> A.M. to 
            <input type="text" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> P.M. daily at this Institute. If required I attend emergency duties.
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">2.</span>
          <div className="flex-grow">
            I have not made myself available to any other Medical College/Institution in any discipline, 
            in the capacity of a teaching faculty, administrator or advisor in the current academic year 
            for the purpose of NMC/MCI assessments.
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">3.</span>
          <div className="flex-grow space-y-4">
            <div>I do hereby solemnly declare that (tick the applicable clause):</div>
            <div className="pl-6 space-y-4">
              <label className="flex items-start cursor-pointer w-full">
                 <span className="mr-2">a.</span>
                 <div className="flex-grow flex items-start">
                   <input type="radio" name="prac_clause" className="mt-1 mr-2 cursor-pointer" />
                   <span>I state that I am not doing any Private Practice or working in any other hospital during college hours.</span>
                 </div>
              </label>
              <label className="flex items-start cursor-pointer w-full">
                 <span className="mr-2">b.</span>
                 <div className="flex-grow flex items-start">
                   <input type="radio" name="prac_clause" className="mt-1 mr-2 cursor-pointer" />
                   <div className="flex-grow leading-relaxed">
                     I practice at <input type="text" className="w-64 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" autoComplete="off" /> Nursing Home / Clinic / Hospital 
                     in the city of <input type="text" className="w-40 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> in 
                     <input type="text" className="w-40 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> State and my hours of private practice 
                     are from <input type="text" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> AM/PM to 
                     <input type="text" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100 mb-1 mx-2 align-bottom inline-block" /> AM/PM.
                   </div>
                 </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">4.</span>
          <div className="flex-grow">
            I am not working in any other medical/dental college in or outside the State in any capacity: 
            Regular/Contractual/Ad-hoc or Full time/Part time/Honorary.
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">5.</span>
          <div className="flex-grow">
            I declare that I have provided all details with regard to my work and teaching experience and 
            no information has been concealed by me.
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold mr-4 w-[max-content]">6.</span>
          <div className="flex-grow">
            I do solemnly declare that all the details/information furnished by me in this declaration form 
            is absolutely true and correct, and all the documents/certificates that were made available by 
            me for verification or have been submitted by me along with this declaration form are 
            authentic. In the event of any information furnished or statement made in this declaration 
            subsequently turning out to be false/incorrect or any document/s or certificate/sis/are found 
            to be out of order, or it comes to light that there has been suppression of any material 
            information, I understand and accept that it shall be considered as gross misconduct thereby 
            rendering me liable to disciplinary and/or legal proceedings. It might also lead to 
            suspension/cancellation of my Registration with the State Medical Council and/or removal 
            of my name from the Indian Medical Register.
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mt-auto pb-[100px]">
         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <span className="font-bold w-12">Date:</span>
               <DateInput   className="w-32 border-b border-black text-center tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end gap-2">
               <span className="font-bold w-12">Place:</span>
               <input type="text" className="w-48 border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
         </div>
         <div className="text-center w-64">
           <div className="h-10 border-b border-black w-full mb-1"></div>
           <p className="font-bold">(Signature of the Faculty)</p>
         </div>
      </div>
    </div>
  );
}
