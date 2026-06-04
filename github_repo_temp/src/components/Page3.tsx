import React, { useState } from 'react';
import { DateInput } from './DateInput';

export default function Page3() {
  const [sessions, setSessions] = useState([{ id: '1' }]);
  const [teachingExpRows, setTeachingExpRows] = useState([
    { id: '1', desig: 'Junior Resident', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '2', desig: 'Senior Resident', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '3', desig: 'Demonstrator', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '4', desig: 'Tutor', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '5', desig: 'Asst. Professor', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '6', desig: 'Assoc. Professor', department: '', inst: '', from: '', to: '', tillDate: false },
    { id: '7', desig: 'Professor', department: '', inst: '', from: '', to: '', tillDate: false },
  ]);
  const [defenseExp, setDefenseExp] = useState<Record<string, { from: string, to: string, tillDate: boolean }>>({});

  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      // Check if it's DD/MM/YYYY or YYYY-MM-DD
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    return new Date(dateStr);
  };

  const calcDuration = (from: string, to: string, tillDate: boolean) => {
    if (!from) return "";
    const fromDate = parseDateStr(from);
    let toDate = tillDate ? new Date() : (to ? parseDateStr(to) : null);
    
    if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return "";
    
    let months = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());
    if (toDate.getDate() < fromDate.getDate()) {
      months -= 1;
    }
    if (months < 0) return "";
    
    const y = Math.floor(months / 12);
    const m = months % 12;
    return `${y}y ${m}m`;
  };

  const updateTeachingExpRow = (id: string, field: 'desig' | 'department' | 'inst' | 'from' | 'to' | 'tillDate', value: any) => {
    setTeachingExpRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addTeachingExpRow = () => {
    setTeachingExpRows([...teachingExpRows, { id: Math.random().toString(), desig: '', department: '', inst: '', from: '', to: '', tillDate: false }]);
  };

  const removeTeachingExpRow = (id: string) => {
    setTeachingExpRows(teachingExpRows.filter((r) => r.id !== id));
  };

  const updateDefenseExp = (desig: string, field: 'from' | 'to' | 'tillDate', value: any) => {
    setDefenseExp(prev => ({
      ...prev,
      [desig]: { ...(prev[desig] || { from: '', to: '', tillDate: false }), [field]: value }
    }));
  };

  const addSession = () => {
    setSessions([...sessions, { id: Math.random().toString() }]);
  };

  const removeSession = (idToRem: string) => {
    setSessions(sessions.filter((s) => s.id !== idToRem));
  };

  React.useEffect(() => {
    const handleAutofill = (e: any) => {
      const { tables } = e.detail;
      if (tables && Array.isArray(tables)) {
        const teachingTable = tables.find((t: any) => t.tableName === "TeachingExperience");
        if (teachingTable && Array.isArray(teachingTable.rows)) {
          const newRows = teachingTable.rows.map((row: any, i: number) => {
             const getVal = (col: string) => {
                 const c = row.columns?.find((cc: any) => cc.columnName === col);
                 return c ? c.value : "";
             };
             return {
                 id: "auto_" + i + "_" + Math.random().toString(),
                 desig: getVal("designation"),
                 department: getVal("department"),
                 inst: getVal("institution"),
                 from: getVal("from"),
                 to: getVal("to"),
                 tillDate: getVal("to")?.toLowerCase().includes("till") || getVal("to")?.toLowerCase().includes("present") || getVal("to")?.toLowerCase().includes("date")
             };
          });
          if (newRows.length > 0) {
              setTeachingExpRows(newRows);
          }
        }
      }
    };
    document.addEventListener("autofill", handleAutofill);
    return () => document.removeEventListener("autofill", handleAutofill);
  }, []);

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">11.</span>
        <div className="space-y-4 w-full">
          <span className="font-bold">Copies of educational qualifications:</span>
          <div className="pl-[2rem] space-y-2">
            <div className="flex justify-between items-center pr-32">
              <span>a. Copies of MBBS & PG Degree certificates verified and attached:</span>
              <div className="flex space-x-4">
                 <label className="cursor-pointer flex items-center"><input type="radio" name="yes_no_a" className="mr-1"/>Yes</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="yes_no_a" className="mr-1"/>No</label>
              </div>
            </div>
            <div className="flex justify-between items-center pr-32">
              <span>b. Copies of MBBS & PG Degree Registration verified and attached:</span>
              <div className="flex space-x-4">
                 <label className="cursor-pointer flex items-center"><input type="radio" name="yes_no_b" className="mr-1"/>Yes</label>
                 <label className="cursor-pointer flex items-center"><input type="radio" name="yes_no_b" className="mr-1"/>No</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">12.</span>
        <div className="space-y-1 w-full">
          <span className="font-bold">Details of Teaching experience till date:</span>
          
          <table className="w-[calc(100%+4rem)] -ml-[2.5rem] border-collapse border border-black text-[12px] mt-2 doc-table" data-af-table="TeachingExperience">
            <thead>
              <tr>
                <th data-af-col="designation" className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[110px]">Designation*</th>
                <th data-af-col="department" className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Department</th>
                <th data-af-col="institution" className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Institution</th>
                <th data-af-col="from" className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[90px]">From</th>
                <th data-af-col="to" className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[90px]">To</th>
                <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[70px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {teachingExpRows.map((row) => {
                const duration = calcDuration(row.from, row.to, row.tillDate);
                return (
                <tr key={row.id} className="group relative">
                  <td className="border border-black p-0 w-[110px] align-top relative">
                    <select
                      value={row.desig}
                      onChange={(e) => updateTeachingExpRow(row.id, 'desig', e.target.value)}
                      className="w-full h-[60px] p-2 bg-transparent focus:outline-none focus:bg-gray-100 text-[12px] print:appearance-none cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="Junior Resident">Junior Resident</option>
                      <option value="Senior Resident">Senior Resident</option>
                      <option value="Demonstrator">Demonstrator</option>
                      <option value="Tutor">Tutor</option>
                      <option value="Asst. Professor">Asst. Professor</option>
                      <option value="Assoc. Professor">Assoc. Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Other">Other</option>
                    </select>
                    {teachingExpRows.length > 1 && (
                      <button 
                        onClick={() => removeTeachingExpRow(row.id)} 
                        title="Remove row"
                        className="print-hidden absolute top-[-5px] right-[-5px] w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </td>
                  <td className="border border-black p-0 align-top"><textarea value={row.department} onChange={(e) => updateTeachingExpRow(row.id, 'department', e.target.value)} rows={2} className="w-full h-[60px] p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 align-top"><textarea value={row.inst} onChange={(e) => updateTeachingExpRow(row.id, 'inst', e.target.value)} rows={2} className="w-full h-[60px] p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                  <td className="border border-black p-0 align-top">
                    <DateInput  value={row.from} onChange={(e) => updateTeachingExpRow(row.id, 'from', e.target.value)} className="w-full h-[60px] px-1 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100"  />
                  </td>
                  <td className="border border-black p-0 align-top relative">
                    {!row.tillDate && (
                      <DateInput  value={row.to} onChange={(e) => updateTeachingExpRow(row.id, 'to', e.target.value)} className="w-full h-[60px] px-1 pb-4 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100"  />
                    )}
                    {row.tillDate && (
                      <div className="w-full h-[60px] flex items-center justify-center text-[12px] pb-4">Till Date</div>
                    )}
                    <label className="absolute bottom-1 left-0 right-0 flex items-center justify-center text-[9px] cursor-pointer print-hidden">
                      <input type="checkbox" checked={row.tillDate} onChange={(e) => updateTeachingExpRow(row.id, 'tillDate', e.target.checked)} className="mr-1 w-2 h-2" style={{appearance:'auto', width:'10px', height:'10px'}}/> Till Date
                    </label>
                  </td>
                  <td className="border border-black p-0 align-middle text-center w-[70px]">
                     {duration ? <div className="text-[12px] font-bold">{duration}</div> : <input type="text" className="w-full h-[60px] px-1 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100" placeholder="___y___m" />}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={addTeachingExpRow}
            type="button"
            className="print-hidden mt-2 text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            + Add Row
          </button>
          <div className="text-center font-bold text-[12px]">
            * Write NA (Not Applicable) for the designations not held
          </div>

          <div className="pt-2">
             <span className="font-bold">To be filled in by personnel from Indian Defense Services ONLY:</span>
             <table className="w-[calc(100%+4rem)] -ml-[2.5rem] border-collapse border border-black text-[12px] mt-2 doc-table">
                <thead>
                  <tr>
                    <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[110px]">Designation</th>
                    <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case">Institution*</th>
                    <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[90px]">From</th>
                    <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[90px]">To</th>
                    <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-[70px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {['Graded Specialist', 'Classified Specialist', 'Advisor'].map((desig) => {
                    const exp = defenseExp[desig] || { from: '', to: '', tillDate: false };
                    const duration = calcDuration(exp.from, exp.to, exp.tillDate);
                    return (
                    <tr key={desig}>
                      <td className="border border-black p-2 w-[110px] whitespace-normal align-top leading-tight">{desig}</td>
                      <td className="border border-black p-0 align-top"><textarea rows={2} className="w-full h-full p-2 bg-transparent focus:outline-none focus:bg-gray-100 resize-none text-[12px] leading-tight" /></td>
                      <td className="border border-black p-0 align-top">
                        <DateInput  value={exp.from} onChange={(e) => updateDefenseExp(desig, 'from', e.target.value)} className="w-full min-h-[40px] px-1 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100"  />
                      </td>
                      <td className="border border-black p-0 align-top relative">
                        {!exp.tillDate && (
                          <DateInput  value={exp.to} onChange={(e) => updateDefenseExp(desig, 'to', e.target.value)} className="w-full min-h-[40px] px-1 pb-4 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100"  />
                        )}
                        {exp.tillDate && (
                          <div className="w-full min-h-[40px] flex items-center justify-center text-[12px] pb-4">Till Date</div>
                        )}
                        <label className="absolute bottom-1 left-0 right-0 flex items-center justify-center text-[9px] cursor-pointer print-hidden">
                          <input type="checkbox" checked={exp.tillDate} onChange={(e) => updateDefenseExp(desig, 'tillDate', e.target.checked)} className="mr-1 w-2 h-2" style={{appearance:'auto', width:'10px', height:'10px'}}/> Till Date
                        </label>
                      </td>
                      <td className="border border-black p-0 align-middle text-center w-[70px]">
                         {duration ? <div className="text-[12px] font-bold">{duration}</div> : <input type="text" className="w-full min-h-[40px] px-1 text-[12px] text-center bg-transparent focus:outline-none focus:bg-gray-100" placeholder="___y___m" />}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-center font-bold text-[12px]">
                * Note: Documents in support of each posting to be furnished for verification
              </div>
          </div>
        </div>
      </div>

    </div>
  );
}
