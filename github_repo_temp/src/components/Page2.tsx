import { DateInput } from "./DateInput";
import React, { useState } from 'react';

export default function Page2() {
  const [qualifications, setQualifications] = useState([
    { id: 'mbbs', degree: 'MBBS' },
    { id: 'mdms', degree: 'MD/MS' },
    { id: 'dmmch', degree: 'DM/MCh' },
    { id: 'phd', degree: 'PhD' }
  ]);

  const addQualification = () => {
    setQualifications([...qualifications, { id: Math.random().toString(), degree: '' }]);
  };

  const removeQualification = (idToRem: string) => {
    setQualifications(qualifications.filter((q) => q.id !== idToRem));
  };

  const updateDegree = (id: string, value: string) => {
    setQualifications(qualifications.map(q => q.id === id ? { ...q, degree: value } : q));
  };

  return (
    <div className="space-y-6 text-[12px] leading-[1.6] flex flex-col font-serif grow relative">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pt-6">
        <span className="w-6 text-right">4.</span>
        <div className="space-y-2">
          <span>Complete Residential Address of the employee:</span>
          <div className="pl-6 space-y-3 pt-2">
            <div className="flex items-start">
              <span className="w-[18px]">a.</span>
              <span className="w-[60px]">Present:</span>
              <div className="flex-grow space-y-3">
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-[18px]">b.</span>
              <span className="w-[60px]">Permanent:</span>
              <div className="flex-grow space-y-3">
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
                <input type="text" className="border-b border-black w-full bg-transparent focus:outline-none focus:bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        <span className="w-6 text-right">5.</span>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center pr-32">
            <span>Copy of Proof of Residence submitted and original verified:</span>
            <div className="flex space-x-2">
              <label className="cursor-pointer flex items-center"><input type="radio" name="proof_res" className="mr-1" />Yes</label>
              <label className="cursor-pointer flex items-center"><input type="radio" name="proof_res" className="mr-1" />No</label>
            </div>
          </div>
          <span className="text-[12px] opacity-80">(Only copies of Passport/Aadhar card/Voter ID/Passport/Electricity bill/Landline Phone bill will be considered)</span>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        <span className="w-6 text-right">6.</span>
        <div className="space-y-2 w-full">
          <span>Contact details:</span>
          <div className="pl-6 space-y-3 pt-2">
            <div className="flex items-end pr-20">
              <span className="w-[18px]">a.</span>
              <span className="w-[240px]">Office telephone with STD code:</span>
              <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end pr-20">
              <span className="w-[18px]">b.</span>
              <span className="w-[240px]">Residence telephone with STD code:</span>
              <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end pr-20">
              <span className="w-[18px]">c.</span>
              <span className="w-[240px]">Mobile Phone Number:</span>
              <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end pr-20">
              <span className="w-[18px]">d.</span>
              <span className="w-[240px]">Email address:</span>
              <input type="email" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
        <span className="w-6 text-right">7.</span>
        <div className="flex items-end space-x-2">
          <span className="w-80">Date of joining the present institution:</span>
          <DateInput   className="border-b border-black w-32 px-2 text-center bg-transparent tracking-[0.1em] focus:outline-none focus:bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-center pr-[320px]">
        <span className="w-6 text-right">8.</span>
        <div className="flex items-center justify-between w-full">
          <span>Joining report verified / attached</span>
          <div className="flex justify-center space-x-2">
            <label className="cursor-pointer flex items-center"><input type="radio" name="join_rep" className="mr-1" />Yes</label>
            <label className="cursor-pointer flex items-center"><input type="radio" name="join_rep" className="mr-1" />No</label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        <span className="w-6 text-right">9.</span>
        <div className="space-y-3 w-full">
          <div className="leading-snug pr-4">
            Have you attended the Basic Course Workshop (BCME), Curriculum Implementation Support <br/>
            Programme (CISP-i/ii/iii), Advanced Course in Medical Education (ACME) for training in MET:
            <div className="mt-1 flex space-x-4">
              <label className="cursor-pointer flex items-center"><input type="radio" name="met_cert" className="mr-1"/>Yes</label>
              <label className="cursor-pointer flex items-center"><input type="radio" name="met_cert" className="mr-1"/>No</label>
            </div>
          </div>
          <p className="text-[12px]">
            (If Yes, provide certificate/s )
          </p>
          
          <div className="pl-6 space-y-2 pt-1 pr-32">
            <div className="flex justify-between items-center pr-8">
              <span>a. at MCI/NMC Regional MET Centre:</span>
              <div className="flex space-x-2">
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_reg" className="mr-1"/>Yes</label>
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_reg" className="mr-1"/>No</label>
              </div>
            </div>
            <div className="flex justify-between items-center pr-8">
              <span>b. at your college under Regional / Nodal Centre observership:</span>
              <div className="flex space-x-2">
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_obs" className="mr-1"/>Yes</label>
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_obs" className="mr-1"/>No</label>
              </div>
            </div>
            <div className="flex justify-between items-center pr-8">
              <div className="flex flex-grow items-end">
                <span className="whitespace-nowrap shrink-0">c. Any other MET certificates may be attached:</span>
                <input type="text" className="flex-grow border-b border-black mx-2 h-5 bg-transparent focus:outline-none focus:bg-gray-100" />
              </div>
              <div className="flex space-x-2 shrink-0">
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_other" className="mr-1"/>Yes</label>
                <label className="cursor-pointer flex items-center"><input type="radio" name="met_other" className="mr-1"/>No</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        <span className="w-6 text-right">10.</span>
        <div className="w-full space-y-4">
          <span>Educational Qualifications:</span>
          
          <table className="w-[calc(100%+2.5rem)] -ml-[2.5rem] border-collapse border border-black text-[14px] mt-2 mb-4 doc-table table-fixed">
            <thead>
              <tr>
                <th className="border border-black p-2 font-normal text-center bg-transparent text-black normal-case w-[12%]">Degree</th>
                <th className="border border-black p-2 font-normal text-center bg-transparent text-black normal-case w-[8%]">Year</th>
                <th className="border border-black p-2 font-normal text-center bg-transparent text-black normal-case w-[30%]">Name of College &<br />University</th>
                <th className="border border-black p-2 font-normal text-center bg-transparent text-black normal-case w-[30%]">Registration number<br />with date of registration</th>
                <th className="border border-black p-2 font-normal text-center bg-transparent text-black normal-case w-[20%]">Name of State<br />Medical council</th>
              </tr>
            </thead>
            <tbody>
              {qualifications.map((q, idx) => (
                <tr key={q.id}>
                  <td className="border border-black p-0 align-middle relative group h-[40px]">
                    <select
                      value={q.degree}
                      onChange={(e) => updateDegree(q.id, e.target.value)}
                      className="w-full h-full text-center p-1 bg-transparent focus:outline-none focus:bg-gray-100 cursor-pointer text-[14px] print:appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="MBBS">MBBS</option>
                      <option value="MD/MS">MD/MS</option>
                      <option value="DM/MCh">DM/MCh</option>
                      <option value="PhD">PhD</option>
                      <option value="DNB">DNB</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Other">Other</option>
                    </select>
                    {qualifications.length > 1 && (
                      <button 
                        onClick={() => removeQualification(q.id)} 
                        title="Remove requirement"
                        className="print-hidden absolute top-[-5px] right-[-5px] w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </td>
                  <td className="border border-black p-0 align-middle h-[40px]">
                     <textarea className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-gray-100 text-center resize-none text-[14px] leading-[1.3]" />
                  </td>
                  <td className="border border-black p-0 align-middle h-[40px]">
                     <textarea className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-gray-100 text-center resize-none text-[14px] leading-[1.3]" />
                  </td>
                  <td className="border border-black p-0 align-middle h-[40px]">
                     <textarea className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-gray-100 text-center resize-none text-[14px] leading-[1.3]" />
                  </td>
                  <td className="border border-black p-0 align-middle h-[40px]">
                     <textarea className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-gray-100 text-center resize-none text-[14px] leading-[1.3]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addQualification}
            type="button"
            className="print-hidden mt-2 text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            + Add Degree
          </button>

          <div className="pl-10 space-y-3 flex-col">
             <div className="flex items-end w-[400px]">
               <span className="w-6 shrink-0">a.</span>
               <span className="w-32">MD/MS subject:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             </div>
             <div className="flex items-end w-[400px]">
               <span className="w-6 shrink-0">b.</span>
               <span className="w-32">DM/MCh subject:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             </div>
             <div className="flex items-end w-[400px]">
               <span className="w-6 shrink-0">c.</span>
               <span className="w-32">PhD subject:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             </div>
          </div>
          
          <div className="text-[12px] leading-snug pt-4">
            <span className="font-bold">Note:</span> For PG & Post PG qualifications, particulars of Registration of Additional Qualification certificates<br/>
            are to be furnished for them to be accepted. Strike out whichever section is not applicable.
          </div>
        </div>
      </div>
    </div>
  );
}
