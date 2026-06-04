const fs = require('fs');

const path = 'src/components/NMCFormB.tsx';
let content = fs.readFileSync(path, 'utf8');

const tablesToChunk = [
    {
        name: 'pgInspections',
        page: 1,
        first: 3,
        cont: 15,
        targetVar: 'pgInspections',
        setVar: 'setPgInspections',
        rowMatch: 'pgInspections.map(insp =>',
        addMatch: 'onClick={()=>addRow(setPgInspections',
        headers: '<th className="w-[10%]">Date of<br/>Inspection</th>\\s*<th className="w-[24%]">Purpose of<br/>Inspection[\\s\\S]*?<th className="w-10 no-print"></th>',
        renderBody: `
                    {chunk.map(insp => (
                      <tr key={insp.id}>
                        <td><InlineTextarea value={insp.date} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'date', v)} /></td>
                        <td><InlineTextarea value={insp.purpose} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'purpose', v)} /></td>
                        <td><InlineTextarea value={insp.type} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'type', v)} /></td>
                        <td><InlineTextarea value={insp.outcome} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'outcome', v)} /></td>
                        <td><InlineInput value={insp.seatsInc} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'seatsInc', v)} /></td>
                        <td><InlineInput value={insp.seatsDec} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'seatsDec', v)} /></td>
                        <td><InlineTextarea value={insp.order} onChange={(v:string)=>updateRow(setPgInspections, insp.id, 'order', v)} /></td>
                        <td className="no-print text-center">
                          <button 
                            className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                            onClick={() => removeRow(setPgInspections, insp.id)}
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
        `,
        addButtonJSX: `<button className="no-print text-indigo-600 text-sm mb-2 flex items-center" onClick={()=>addRow(setPgInspections, ()=>({id:generateId(), date:'', purpose:'', type:'', outcome:'', seatsInc:'', seatsDec:'', order:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>`,
        title: 'i. Details of PG inspections of the department in last five years: (Continued)'
    }
];

// Instead of hardcoding all of them, I will just write a generalized script that 
// reads the table row map and add button dynamically.

// Let's implement this manually using multi_replace_file_content for a few key ones.
// I'll exit the script.
