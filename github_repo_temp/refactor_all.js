const fs = require('fs');

const path = 'src/components/NMCFormB.tsx';
let content = fs.readFileSync(path, 'utf8');

const tables = [
  {
    arrayName: 'pgInspections',
    firstLimit: 3, contLimit: 12,
    basePage: 1,
    tableStartMatch: '<table className="nmc-table tight-table text-[8.5pt] leading-[1.2] w-full">',
    mapStartMatch: '{pgInspections.map(insp => (',
    mapEndMatch: '                  </tbody>\n                </table>',
    addRecordMatch: '<button className="no-print text-indigo-600 text-sm mb-2 flex items-center" onClick={()=>addRow(setPgInspections, ()=>({id:generateId(), date:\'\', purpose:\'\', type:\'\', outcome:\'\', seatsInc:\'\', seatsDec:\'\', order:\'\'}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>',
    titleMatch: '<div className="flex items-end mb-1">\n                  <span className="w-8">i.</span>\n                  <span className="mr-2 whitespace-nowrap">Details of PG inspections of the department in last five years:</span>\n                  <span className="border-b border-black flex-1"><InlineInput value={genDetails.pgInspectionsText || \'\'} onChange={(v:string)=>setGenDetails({...genDetails, pgInspectionsText: v})} /></span>\n                </div>',
    contTitle: '<div className="flex items-end mb-1 mt-4">\n                  <span className="w-8">i.</span>\n                  <span className="mr-2 whitespace-nowrap font-bold">Details of PG inspections of the department in last five years: (Continued)</span>\n                </div>'
  }
];

// This script gets exponentially more complex for every single table.
