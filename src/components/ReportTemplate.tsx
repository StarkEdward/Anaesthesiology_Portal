import React from 'react';
import { ReportConfig, EmployeeAttendance } from '../types';
import { fallbackReportConfig } from '../data/fallbackData';
import { 
  toMarathiDigits, 
  getDaysInMonth, 
  getMarathiMonthName, 
  calculateAttendanceStats 
} from '../utils';

interface ReportTemplateProps {
  config: ReportConfig;
  employees: EmployeeAttendance[];
  useMarathiNumerals: boolean;
  zoom?: number; // visual zoom on screen, defaults to 1
  onCellClick?: (empId: string, day: number) => void;
  activePen?: 'cycle' | 'P' | 'WO' | 'H' | 'A' | '-';
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({
  config,
  employees,
  useMarathiNumerals,
  zoom = 1,
  onCellClick,
  activePen = 'cycle'
}) => {
  const fs = config.fontSizes || fallbackReportConfig.fontSizes;
  const daysInMonth = getDaysInMonth(config.year, config.month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const displayNum = (num: number | string): string => {
    return useMarathiNumerals ? toMarathiDigits(num) : String(num);
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'cycle') return '';
    if (status === '-') return ' ';
    if (status === 'WO') return (
       <div className="flex flex-col items-center justify-center leading-[0.85] pt-0.5">
          <span>W</span>
          <span>O</span>
       </div>
    );
    return status;
  };

  const renderSheet = (emp: EmployeeAttendance | null, mainIndex: number) => {
    const sheetEmployees = emp ? [emp] : [];
    
    // Dynamic subject computation
    let subjectContent = <span className="font-bold">विषय :- {config.subjectTemplateMr}</span>;
    if (config.subjectTemplateMr) {
      const match = config.subjectTemplateMr.match(/^(.*?)\((.*?)\)(.*?) यांचा (.*)$/);
      if (match) {
        const [_, namePart, categoryPart, designationPart, restPart] = match;
        if (emp) {
           subjectContent = (
             <>
               <span className="font-bold">विषय :- {emp.name}</span>
               <span className="font-normal"> ({emp.category}) </span>
               <span className="font-bold">{emp.designation}</span>
               <span className="font-normal"> यांचा {restPart}</span>
             </>
           );
        } else {
           subjectContent = (
             <>
               <span className="font-bold">विषय :- {namePart}</span>
               <span className="font-normal">({categoryPart})</span>
               <span className="font-bold">{designationPart}</span>
               <span className="font-normal"> यांचा {restPart}</span>
             </>
           );
        }
      } else {
        const splitIdx = config.subjectTemplateMr.indexOf('यांचा ');
        if (splitIdx !== -1) {
          const beforeYancha = config.subjectTemplateMr.substring(0, splitIdx);
          const afterYancha = config.subjectTemplateMr.substring(splitIdx);
          if (emp) {
            subjectContent = (
              <>
                <span className="font-bold">विषय :- {emp.name} </span>
                <span className="font-normal">{afterYancha}</span>
              </>
            );
          } else {
            subjectContent = (
              <>
                <span className="font-bold">विषय :- {beforeYancha}</span>
                <span className="font-normal">{afterYancha}</span>
              </>
            );
          }
        }
      }
    }

    return (
      <div 
        key={emp ? emp.id : 'empty'}
        className="print-page relative bg-white text-black font-serif select-none box-border leading-relaxed border border-gray-300 shadow-lg mx-auto mb-8 print:border-0 print:shadow-none print:m-0"
        style={{
          width: '297mm',
          height: '210mm',
          padding: '5mm 5mm', // Reduced margins
          fontFamily: "'Noto Sans Devanagari', 'Inter', 'Kokila', 'Mangal', 'Times New Roman', serif"
        }}
      >
        
        {/* HEADER BLOCK */}
        <div className="w-full text-center flex flex-col items-center select-all cursor-text text-black">
          <h2 className="font-extrabold tracking-wide leading-tight mt-1" style={{ fontSize: `${fs.deptNameMr}px` }}>
            {config.deptNameMr}
          </h2>
          <h3 className="font-bold leading-tight mt-1" style={{ fontSize: `${fs.collegeNameMr}px` }}>
            {config.collegeNameMr}
          </h3>
          <p className="font-bold leading-tight mt-0.5" style={{ fontSize: `${fs.addressMr}px` }}>
            {config.addressMr}
          </p>
          <h4 className="font-bold uppercase leading-tight mt-1 tracking-wide" style={{ fontSize: `${fs.collegeNameEn}px` }}>
            {config.collegeNameEn}
          </h4>
          <p className="font-bold uppercase leading-tight mt-0 mb-1 tracking-wide" style={{ fontSize: `${fs.addressEn}px` }}>
            {config.addressEn}
          </p>
        </div>

        {/* EMAIL */}
        <div className="w-full text-left font-bold text-black px-2 mt-2" style={{ fontSize: `${fs.email}px` }}>
          EMAIL.: gmcn.anaesthesiology@gmail.com
        </div>
        
        {/* HR */}
        <div className="w-full h-[1.5px] bg-black mt-0.5 mb-1.5"></div>

        {/* REF & DATE */}
        <div className="w-full flex justify-between px-2 font-bold" style={{ fontSize: `${fs.refNo}px` }}>
          <div className="whitespace-pre ">{config.refNo.replace('542', '                     ')}</div>
          <div className="whitespace-pre" style={{ fontSize: `${fs.dateStr}px` }}>दिनांक :- {config.dateStr ? (useMarathiNumerals ? toMarathiDigits(config.dateStr) : config.dateStr) : ''}</div>
        </div>
        
        {/* HR */}
        <div className="w-full h-[1.5px] bg-black mt-1.5 mb-2"></div>

        {/* RECIPIENT */}
        <div className="w-full mt-2 mb-2 pl-4">
          <div className="font-normal text-black" style={{ fontSize: `${fs.recipient}px` }}>प्रति,</div>
          <div className="pl-6 pt-0.5 font-normal text-black leading-snug flex flex-col" style={{ fontSize: `${fs.recipient}px` }}>
            {emp && emp.recipientMrOverride ? (
              emp.recipientMrOverride.split('\n').map((line, i) => (
                <div key={i}>{line.trim()}</div>
              ))
            ) : (
              <>
                {config.recipientMr.split('\n').map((line, i) => (
                  <div key={`mr-${i}`}>{line.trim()}</div>
                ))}
                {config.recipientEn && config.recipientEn.split(',').map((line, i) => {
                   const text = line.trim();
                   return text ? <div key={i}>{text}{i === 0 ? ',' : ''}</div> : null;
                })}
              </>
            )}
          </div>
        </div>

        {/* SUBJECT */}
        <div className="w-full mt-6 mb-4 ml-[15%] pr-4 leading-relaxed text-black" style={{ fontSize: `${fs.subject}px` }}>
          {subjectContent}
        </div>

        {/* MAIN TABLE */}
        <div className="w-full mt-3 mb-3">
          <table className="w-full table-fixed text-center border-collapse border-b border-black" style={{ border: '2px solid black' }}>
            <colgroup>
              <col style={{ width: '2.5%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '4.5%' }} />
              {daysArray.map(day => (
                <col key={`col-day-${day}`} style={{ width: `${67 / daysInMonth}%` }} />
              ))}
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '4.5%' }} />
            </colgroup>
            <thead>
              {/* ROW 1: Title and Static Headers */}
              <tr className="bg-white text-black font-bold">
                <th rowSpan={2} className="px-[2px] py-1 whitespace-pre-wrap leading-[1.2]" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow1Sub}px` }}>
                  अ.<br/>क्र.
                </th>
                <th rowSpan={2} className="px-[2px] py-1 whitespace-pre-wrap leading-[1.2]" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow1Sub}px` }}>
                  कर्मचाऱ्यांचे<br/>नाव
                </th>
                <th rowSpan={2} className="px-[2px] py-1" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow1Sub}px` }}>
                  पदनाम
                </th>
                <th colSpan={daysInMonth + 4} className="py-1.5 font-extrabold tracking-wide" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow1}px` }}>
                  माहे {getMarathiMonthName(config.month)}- {displayNum(config.year)} चा उपस्थिती अहवाल
                </th>
              </tr>
              {/* ROW 2: Days and Stats Headers */}
              <tr className="bg-white text-black font-bold h-12">
                {daysArray.map(day => (
                  <th key={`day-h-${day}`} className="p-0 text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableDates}px` }}>
                    {displayNum(day)}
                  </th>
                ))}
                <th className="p-0 text-center leading-[1.1] whitespace-nowrap" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow2}px` }}>
                  गैरहजर<br/>दिवस
                </th>
                <th className="p-0 text-center leading-[1.1] whitespace-nowrap" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow2}px` }}>
                  उपस्थित<br/>दिवस
                </th>
                <th className="p-0 text-center leading-[1.1] whitespace-nowrap" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow2}px` }}>
                  सुट्टीचे<br/>दिवस
                </th>
                <th className="p-0 text-center leading-[1.1] whitespace-nowrap" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableHeaderRow2}px` }}>
                  एकूण<br/>दिवस
                </th>
              </tr>
            </thead>
            <tbody>
              {sheetEmployees.length === 0 ? (
                <tr className="h-10">
                  <td colSpan={7 + daysInMonth} className="border border-black text-center text-gray-500 italic" style={{ fontSize: `${fs.tableBody + 2}px` }}>
                    कोणतेही नाव शोधले नाही. कृपया डाव्या बाजूला कर्मचारी जोडा.
                  </td>
                </tr>
              ) : (
                sheetEmployees.map((e) => {
                  const stats = calculateAttendanceStats(e.attendance, daysInMonth);

                  return (
                    <tr key={`emp-row-${e.id}`} className="text-black font-bold">
                      <td className="text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>
                        {displayNum(mainIndex + 1)}
                      </td>
                      <td className="py-1 text-center whitespace-pre-wrap leading-[1.2]" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>
                        {e.name.split(' ').join('\n')}
                      </td>
                      <td className="py-1 text-center whitespace-pre-wrap leading-[1.2]" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>
                        {e.designation.split(' ').join('\n')}
                      </td>
                      {daysArray.map(day => {
                        const status = e.attendance[day] || '-';
                        let hoverClass = "";
                        if (activePen === 'P') hoverClass = "hover:bg-green-100 text-green-800";
                        else if (activePen === 'A') hoverClass = "hover:bg-red-100 text-red-800";
                        else if (activePen === 'WO') hoverClass = "hover:bg-blue-100 text-blue-900";
                        else if (activePen === 'H') hoverClass = "hover:bg-amber-100 text-amber-900";
                        
                        return (
                          <td 
                            key={day} 
                            onClick={() => onCellClick?.(e.id, day)}
                            className={`p-0 text-center ${onCellClick ? 'cursor-pointer ' + hoverClass : ''}`}
                            title={onCellClick ? `Click to toggle` : undefined}
                            style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}
                          >
                            {getStatusDisplay(status)}
                          </td>
                        );
                      })}
                      <td className="text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>{displayNum(stats.absent)}</td>
                      <td className="text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>{displayNum(stats.present)}</td>
                      <td className="text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>{displayNum(stats.holidaysAndWo)}</td>
                      <td className="text-center" style={{ border: '1px solid black', borderRightWidth: '1px', borderLeftWidth: '1px', backgroundClip: 'padding-box', fontSize: `${fs.tableBody}px` }}>{displayNum(stats.total)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SECTION */}
        <div className="w-full mt-6 pl-4 font-normal text-black" style={{ fontSize: `${fs.footerSubmission}px` }}>
          {config.footerSubmissionMr}
        </div>

        <div className="w-full mt-8 flex justify-between relative flex-grow min-h-[100px]">
          
          {/* Left Block Space (Empty) */}
          <div className="w-1/2 flex items-end justify-center pl-4 pb-4">
          </div>

          {/* Right Authority Sign */}
          <div className="w-1/2 flex justify-end pr-10 items-end pb-4">
             <div className="flex flex-col items-center text-center leading-tight mt-auto">
               <div className="relative h-12 w-40 flex flex-col justify-end items-center mb-1">
               </div>
               <div className="font-normal text-black mb-0.5" style={{ fontSize: `${fs.hodDeatils}px` }}>प्राध्यापक</div>
               <div className="font-normal text-black mb-0.5" style={{ fontSize: `${fs.hodDeatils}px` }}>{config.hodDesignationMr}</div>
               {config.hodDeptMr.split('\n').map((line, idx) => (
                 <div key={idx} className="font-normal text-black leading-tight" style={{ fontSize: `${fs.hodDeatils}px` }}>{line.trim()}</div>
               ))}
             </div>
          </div>

        </div>

      </div>
    );
  };

  return (
    <div 
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      className="transition-transform duration-200 print:transform-none"
    >
       <div id="print-area">
          {employees.length === 0 
            ? renderSheet(null, 0)
            : employees.map((emp, idx) => renderSheet(emp, idx))
          }
       </div>
    </div>
  );
};
