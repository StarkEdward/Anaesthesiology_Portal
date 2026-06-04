import { DateInput } from "./DateInput";
import React, { useState } from 'react';

export default function Page4() {
  const [sessions, setSessions] = useState([{ id: '1' }]);
  
  const addSession = () => {
    setSessions([...sessions, { id: Math.random().toString() }]);
  };

  const removeSession = (idToRem: string) => {
    setSessions(sessions.filter((s) => s.id !== idToRem));
  };

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">13.</span>
        <div className="space-y-4 w-full">
          <p className="pr-10">
            Have you been considered in UG/PG, MCI/NMC inspection at any other medical 
            college in a teaching or administrative capacity during last 3 years. If yes, please give 
            details:
          </p>
          
          <table className="w-[calc(100%+4rem)] -ml-[2.5rem] border-collapse border border-black text-[12px] mt-2 doc-table">
            <thead>
              <tr>
                <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Designation</th>
                <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Subject</th>
                <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">College</th>
                <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Dates</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  <td className="border border-black p-0 align-top"><textarea rows={2} className="w-full h-full p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 align-top"><textarea rows={2} className="w-full h-full p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 align-top"><textarea rows={2} className="w-full h-full p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 align-top"><textarea rows={2} className="w-full h-full p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold w-[max-content]">14.</span>
        <div className="space-y-4 w-full">
          <p className="pr-10 leading-[1.4]">
            Number of lectures / small group teachings/ self-directed learning sessions/ clinics/ etc 
            taken and topics covered in last academic year (attach additional sheet, if required)
          </p>
          
          <table className="w-[calc(100%+4rem)] -ml-[2.5rem] border-collapse border border-black text-[12px] mt-2 doc-table">
            <thead>
              <tr>
                <th className="border border-black p-2 font-bold text-left bg-transparent text-black normal-case w-[40px] text-center">S.No.</th>
                <th className="border border-black p-2 font-bold text-left bg-transparent text-black normal-case w-[90px] text-center">Date</th>
                <th className="border border-black p-2 font-bold text-left bg-transparent text-black normal-case text-center leading-tight w-[160px]">Lecture/ SGT/SDL/<br/>Clinic/ others</th>
                <th className="border border-black p-2 font-bold text-left bg-transparent text-black normal-case text-center">Topic</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row, index) => (
                <tr key={row.id} className="group">
                  <td className="border border-black p-0 h-[36px] w-[40px] align-middle relative">
                    <textarea rows={1} className="w-full h-full p-2 text-center bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight cursor-default" value={index + 1} readOnly />
                    {sessions.length > 1 && (
                      <button 
                        onClick={() => removeSession(row.id)} 
                        title="Remove session"
                        className="print-hidden absolute top-[-5px] right-[-5px] w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </td>
                  <td className="border border-black p-0 h-[36px] w-[90px] align-middle"><textarea rows={1} className="w-full h-full p-2 text-center bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" placeholder="DD/MM/YYYY" /></td>
                  <td className="border border-black p-0 h-[36px] w-[160px] align-middle"><textarea rows={1} className="w-full h-full p-2 bg-transparent resize-none focus:outline-none focus:bg-gray-100 text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 h-[36px] align-middle"><textarea rows={1} className="w-full h-full p-2 bg-transparent resize-none focus:outline-none focus:bg-gray-100 text-[12px] leading-tight" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addSession}
            type="button"
            className="print-hidden mt-2 text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            + Add Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">15.</span>
        <div className="space-y-4 w-full">
          <span className="font-bold block">Details of employment before joining the present institution:</span>
           <div className="pl-[2rem] space-y-4">
            <div className="flex flex-col md:flex-row md:items-end space-y-1 md:space-y-0 md:space-x-2">
               <span className="w-auto">a. Name of College/Institution:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <span className="whitespace-nowrap">b. Designation:</span>
               <input type="text" className="w-full md:w-64 border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
               <span className="whitespace-nowrap">Date on which relieved:</span>
               <DateInput   className="w-full md:w-48 border-b border-black bg-transparent text-center tracking-[0.1em] focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
               <span className="whitespace-nowrap">c. Reason for being relieved:</span>
               <div className="flex flex-wrap gap-4">
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_res" className="mr-1"/>Tendered resignation</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_res" className="mr-1"/>Retired</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_res" className="mr-1"/>Transferred</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_res" className="mr-1"/>Terminated</label>
               </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 justify-between md:pr-32">
              <span className="">d. Relieving order issued by previous institution verified and attached:</span>
              <div className="flex space-x-4">
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_ord" className="mr-1"/>Yes</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="relieve_ord" className="mr-1"/>No</label>
              </div>
            </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">16.</span>
        <div className="flex flex-wrap items-center gap-4 w-full">
          <span className="font-bold whitespace-nowrap">PAN Card Number:</span>
          <input type="text" maxLength={10} className="flex-grow max-w-[300px] border-b border-black uppercase text-[12px] tracking-widest bg-transparent focus:outline-none focus:bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">17.</span>
        <div className="flex flex-wrap items-center gap-4 w-full">
          <span className="font-bold whitespace-nowrap">Aadhar card Number:</span>
          <input type="text" maxLength={12} className="flex-grow max-w-[300px] border-b border-black text-[12px] tracking-[0.2em] bg-transparent focus:outline-none focus:bg-gray-100" />
        </div>
      </div>

    </div>
  );
}
