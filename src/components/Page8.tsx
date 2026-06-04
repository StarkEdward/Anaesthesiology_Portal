import { DateInput } from "./DateInput";
import React from 'react';
import { useFormContext } from '../context/FormContext';

export default function Page8() {
  const { formData } = useFormContext();
  const fullName = [formData.facultyNameFirst, formData.facultyNameMiddle, formData.facultyNameLast].filter(Boolean).join(' ');

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="text-center pb-6 pt-10">
        <h2 className="text-[14px] font-bold uppercase tracking-wider underline underline-offset-4">ENDORSEMENT</h2>
      </div>

      <div className="space-y-12 text-justify leading-relaxed mt-4">
        <div className="flex items-start">
          <span className="w-8 shrink-0 font-bold">1.</span>
          <div className="flex-grow">
            This endorsement is the certification that the undersigned has satisfied herself/himself about 
            the correctness, authenticity and veracity of the content of this declaration form in its entirety 
            and endorsed the above declaration as true and correct. <span className="font-bold">I have personally verified all the 
            certificates/documents submitted by the teaching faculty with the original certificates 
            and documents that were submitted by her/him to the Institute and confirmed the same 
            with the concerned Institute and have found them to be correct and authentic.</span>
          </div>
        </div>

        <div className="flex items-start">
          <span className="w-8 shrink-0 font-bold">2.</span>
          <div className="flex-grow flex flex-col space-y-2">
            <div className="flex items-end">
              I also confirm that Dr. <input type="text" defaultValue={fullName} className="flex-grow mx-2 border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" /> is not indulging in private practice
            </div>
            <div>
              of any kind or carrying out any other professional or other commercial activity during college 
              working hours, from <input type="text" placeholder="HH:MM" className="w-24 border-b border-black text-center align-bottom tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" /> AM to 
              <input type="text" placeholder="HH:MM" className="w-24 border-b border-black text-center align-bottom tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100 mx-1" /> PM, since she/he has joined the Institute.
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <span className="w-8 shrink-0 font-bold">3.</span>
          <div className="flex-grow">
            In the event of this declaration turning out to be false or incorrect or any part of this 
            declaration subsequently turning out to be false or incorrect or it comes to light that there 
            has been suppression of any material information, it is understood and accepted that the 
            undersigned shall also be equally responsible besides the declarant herself/himself, for the 
            mis-declaration or mis-statement.
          </div>
        </div>
      </div>

      <div className="pt-24 pb-6 mt-12 w-full">
         <div className="space-y-4 mb-20">
            <div className="flex items-center gap-2">
               <span className="font-bold w-12">Date:</span>
               <DateInput   className="w-32 border-b border-black text-center tracking-[0.1em] bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end gap-2">
               <span className="font-bold w-12">Place:</span>
               <input type="text" className="w-48 border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
         </div>
         
         <div className="flex justify-between items-end">
           <div className="text-center w-56">
             <div className="h-10 w-full mb-1 border-b border-black"></div>
             <p className="leading-tight font-bold">Signature (Head of Dept.)<br/>with official seal</p>
           </div>
           <div className="text-center w-56">
             <div className="h-10 w-full mb-1 border-b border-black"></div>
             <p className="leading-tight font-bold">Signature (Head of Institute)<br/>with official seal</p>
           </div>
         </div>
      </div>
    </div>
  );
}
