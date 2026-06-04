# -*- coding: utf-8 -*-
with open('src/components/NMCFormB.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace helper component definitions to add font-bold and InlineSelect
old_helpers = """const InlineInput = ({ value, onChange, placeholder = '', className = '' }: any) => (
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 transition-colors ${className}`} />
);

const InlineTextarea = ({ value, onChange, placeholder = '', className = '', rows = 1 }: any) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 transition-colors resize-none overflow-hidden ${className}`}
    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; }} />
);"""

new_helpers = """const InlineInput = ({ value, onChange, placeholder = '', className = '' }: any) => (
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-bold transition-colors ${className}`} />
);

const InlineTextarea = ({ value, onChange, placeholder = '', className = '', rows = 1 }: any) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-bold transition-colors resize-none overflow-hidden ${className}`}
    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; }} />
);

const InlineSelect = ({ value, onChange, options, className = '' }: any) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-bold cursor-pointer transition-colors ${className}`}>
    <option value="" className="font-sans font-normal text-slate-400">-- Select --</option>
    {options.map((opt: string) => (
      <option key={opt} value={opt} className="font-sans font-normal text-slate-900 bg-white">{opt}</option>
    ))}
  </select>
);"""

code = code.replace(old_helpers, new_helpers)

# 2. Update toPng selector in handleDownloadPDFClick
code = code.replace("clone.querySelectorAll('input, textarea').forEach", "clone.querySelectorAll('input, textarea, select').forEach")

# 3. Replace permitted in otherCourses.map
old_permitted = '<td className="text-center"><InlineInput value={c.permitted} onChange={(v:string)=>updateRow(setOtherCourses, c.id, \'permitted\', v)} placeholder="Yes/No" className="text-center" /></td>'
new_permitted = '<td className="text-center"><InlineSelect value={c.permitted} onChange={(v:string)=>updateRow(setOtherCourses, c.id, \'permitted\', v)} options={["Permitted", "Not Permitted"]} className="text-center" /></td>'
code = code.replace(old_permitted, new_permitted)

# 4. Replace spaceAdequate in infra
old_space = '<InlineInput value={infra.spaceAdequate} onChange={(v:string)=>setInfra({...infra, spaceAdequate: v})} placeholder="Adequate/ Not Adequate." />'
new_space = '<InlineSelect value={infra.spaceAdequate} onChange={(v:string)=>setInfra({...infra, spaceAdequate: v})} options={["Adequate", "Not Adequate"]} />'
code = code.replace(old_space, new_space)

# 5. Replace officeDept to pgRestRoom in infra office details table
office_replacements = [
    ('officeDept', 'Available/not available', 'Available/Not Available'),
    ('officeStaff', 'Available/not available', 'Available/Not Available'),
    ('officeComputer', 'Available/not available', 'Available/Not Available'),
    ('officeStorage', 'Available/not available', 'Available/Not Available'),
    ('officeFaculty', 'Available/not available', 'Available/Not Available'),
    ('officeHod', 'Available/not available', 'Available/Not Available'),
    ('officeProf', 'Available/not available', 'Available/Not Available'),
    ('officeAssoc', 'Available/not available', 'Available/Not Available'),
    ('officeAsst', 'Available/not available', 'Available/Not Available'),
    ('srRestRoom', 'Available/not available', 'Available/Not Available'),
    ('pgRestRoom', 'Available/not available', 'Available/Not Available')
]

for var_name, placeholder, desc in office_replacements:
    old_input = f'<InlineInput value={{infra.{var_name}}} onChange={{(v:string)=>setInfra({{...infra, {var_name}: v}})}} placeholder="{placeholder}" />'
    new_input = f'<InlineSelect value={{infra.{var_name}}} onChange={{(v:string)=>setInfra({{...infra, {var_name}: v}})}} options={{["Available", "Not Available"]}} />'
    code = code.replace(old_input, new_input)

    old_input_alt = f'<InlineInput value={{infra.{var_name}}} onChange={{(v:string)=>setInfra({{...infra, {var_name}: v}})}} placeholder="{placeholder}"/>'
    code = code.replace(old_input_alt, new_input)

# 6. Replace seminarSpace and internet in infra (Page 3)
old_seminar = '<InlineInput value={infra.seminarSpace} onChange={(v:string)=>setInfra({...infra, seminarSpace: v})} placeholder="Adequate/ Not Adequate" />'
new_seminar = '<InlineSelect value={infra.seminarSpace} onChange={(v:string)=>setInfra({...infra, seminarSpace: v})} options={["Adequate", "Not Adequate"]} />'
code = code.replace(old_seminar, new_seminar)

old_internet = '<InlineInput value={infra.internet} onChange={(v:string)=>setInfra({...infra, internet: v})} placeholder="Available/Not Available" />'
new_internet = '<InlineSelect value={infra.internet} onChange={(v:string)=>setInfra({...infra, internet: v})} options={["Available", "Not Available"]} />'
code = code.replace(old_internet, new_internet)

# 7. Replace libInternet in infra (Page 3)
old_lib_internet = '<InlineInput value={infra.libInternet} onChange={(v:string)=>setInfra({...infra, libInternet: v})} placeholder="Yes/No" className="text-center" />'
new_lib_internet = '<InlineSelect value={infra.libInternet} onChange={(v:string)=>setInfra({...infra, libInternet: v})} options={["Yes", "No"]} className="text-center" />'
code = code.replace(old_lib_internet, new_lib_internet)

# 8. Replace adequate in equipments table (Page 4)
old_eq_adequate = '<td><InlineInput value={eq.adequate} onChange={(v:string)=>updateRow(setEquipments, eq.id, \'adequate\', v)} /></td>'
new_eq_adequate = '<td><InlineSelect value={eq.adequate} onChange={(v:string)=>updateRow(setEquipments, eq.id, \'adequate\', v)} options={["Yes", "No"]} /></td>'
code = code.replace(old_eq_adequate, new_eq_adequate)

# 9. Replace available in icuEquips table (Page 5)
old_icu_avail = '<td><InlineInput value={eq.available} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, \'available\', v)} /></td>'
new_icu_avail = '<td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, \'available\', v)} options={["Available", "Not Available"]} /></td>'
code = code.replace(old_icu_avail, new_icu_avail)

# 10. Replace available in otherIcuEquips (Page 5 & 6)
old_other_icu_avail = '<td><InlineInput value={eq.available} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, \'available\', v)} /></td>'
new_other_icu_avail = '<td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, \'available\', v)} options={["Available", "Not Available"]} /></td>'
code = code.replace(old_other_icu_avail, new_other_icu_avail)

old_other_icu_avail2 = '<td className="w-20 border-t-0"><InlineInput value={eq.available} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, \'available\', v)} /></td>'
new_other_icu_avail2 = '<td className="w-20 border-t-0"><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, \'available\', v)} options={["Available", "Not Available"]} /></td>'
code = code.replace(old_other_icu_avail2, new_other_icu_avail2)

# 11. Replace available in hduEquips (Page 6)
old_hdu_avail = '<td><InlineInput value={eq.available} onChange={(v:string)=>updateRow(setHduEquips, eq.id, \'available\', v)} /></td>'
new_hdu_avail = '<td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setHduEquips, eq.id, \'available\', v)} options={["Available", "Not Available"]} /></td>'
code = code.replace(old_hdu_avail, new_hdu_avail)

# 12. Replace available in otherHduEquips (Page 7)
old_other_hdu_avail = '<td><InlineInput value={eq.available} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, \'available\', v)} /></td>'
new_other_hdu_avail = '<td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, \'available\', v)} options={["Available", "Not Available"]} /></td>'
code = code.replace(old_other_hdu_avail, new_other_hdu_avail)

# 13. Replace remarks in academicActivities (Page 11 & Page 12)
# Standard cell (Page 11)
old_remarks = '<td><InlineInput value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, \'remarks\', v)} /></td>'
new_remarks = '<td><InlineSelect value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, \'remarks\', v)} options={["Adequate", "Inadequate"]} /></td>'
code = code.replace(old_remarks, new_remarks)

# Border-t-0 cell (Page 12)
old_remarks_border = '<td className="border-t-0"><InlineInput value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, \'remarks\', v)} /></td>'
new_remarks_border = '<td className="border-t-0"><InlineSelect value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, \'remarks\', v)} options={["Adequate", "Inadequate"]} /></td>'
code = code.replace(old_remarks_border, new_remarks_border)

with open('src/components/NMCFormB.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done replacements successfully!")
