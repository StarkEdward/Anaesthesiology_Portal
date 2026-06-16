import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { Printer, Download, Plus, Trash2, Users, X, Search, ListPlus, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { sortDoctors, designationHierarchy, nameHierarchy } from '../lib/doctorConstants';

const generateId = () => Math.random().toString(36).substr(2, 9);

/** Split an array into page-sized chunks. First page may have a different capacity. */
function chunkArray<T>(arr: T[], firstSize: number, contSize: number): T[][] {
  if (arr.length <= firstSize) return [arr];
  const chunks: T[][] = [arr.slice(0, firstSize)];
  for (let i = firstSize; i < arr.length; i += contSize) {
    chunks.push(arr.slice(i, i + contSize));
  }
  return chunks;
}

const formatAreaOnBlur = (val: string) => {
  if (!val) return '';
  const clean = val.replace(/\s*(M\u00B2|M2|m\u00B2|m2|Sq\.?\s*Mt\.?|sq\.?\s*mt\.?)/gi, '').trim();
  if (clean && !isNaN(Number(clean))) {
    return `${clean} M\u00B2`;
  }
  return val;
};

const isCenteredValue = (val: any) => {
  if (val === undefined || val === null) return false;
  const strVal = String(val);
  const trimmed = strVal.trim();
  if (trimmed === '--') return true;
  if (trimmed && !isNaN(Number(trimmed))) return true;
  const clean = trimmed.replace(/\s*(M\u00B2|M2|m\u00B2|m2|Sq\.?\s*Mt\.?|sq\.?\s*mt\.?)/gi, '').trim();
  if (clean && !isNaN(Number(clean))) return true;
  return false;
};

interface PGInspection { id: string; date: string; purpose: string; type: string; outcome: string; seatsInc: string; seatsDec: string; order: string; }
interface OtherCourse { id: string; name: string; permitted: string; seats: string; }
interface RoomArea { id: string; name: string; area: string; }
interface Equipment { id: string; name: string; available: string; functional: string; specs: string; adequate: string; }
interface ICU { id: string; name: string; beds: string; occDay: string; occYr1: string; occYr2: string; occYr3: string; }
interface ICUEquip { id: string; item: string; num: string; available: string; functional: string; remarks: string; }
interface Clinic { id: string; name: string; days: string; timings: string; cases: string; incharge: string; }
interface ClinicalMat { id: string; param: string; day: string; prev: string; yr1: string; yr2: string; yr3: string; group?: string; groupLabel?: string; }
interface UnitFaculty { id: string; designation: string; name: string; joiningDate: string; relieved: string; relievingDate: string; attendance: string; phone: string; email: string; signature: string; }
interface PGStudent { id: string; name: string; joiningDate: string; phone: string; email: string; }
interface PastPGStudent { id: string; name: string; joiningDate: string; relievingDate: string; phone: string; email: string; }
interface AcademicActivity { id: string; name: string; count: string; remarks: string; }
interface Publication { id: string; details: string; }
interface Examiner { id: string; name: string; designation: string; institute: string; }
interface InternalExaminer { id: string; name: string; designation: string; }
interface ExamStudent { id: string; name: string; result: string; }
interface EligibleFaculty { id: string; designation: string; num: string; name: string; seats: string; adequate: string; }

const InlineInput = ({ value, onChange, placeholder = '', className = '', onBlur, list }: any) => (
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onBlur={onBlur} list={list}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-normal transition-colors ${isCenteredValue(value) ? 'text-center' : ''} ${className}`} />
);

const StackedInput = ({ value, onChange, className = '' }: any) => {
  let top = value || '';
  let bottom = '';
  if (value && typeof value === 'string') {
    if (value.includes('\n')) {
      const parts = value.split('\n');
      top = parts[0];
      bottom = parts.slice(1).join('\n');
    } else {
      const match = value.match(/^(.+?)\s+(\(.+?\))$/);
      if (match) {
        top = match[1];
        bottom = match[2];
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      <input 
        type="text" 
        value={top} 
        onChange={e => onChange(bottom ? `${e.target.value}\n${bottom}` : e.target.value)} 
        className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-bold transition-colors text-center ${className}`} 
      />
      <input 
        type="text" 
        value={bottom} 
        onChange={e => onChange(top ? `${top}\n${e.target.value}` : `\n${e.target.value}`)} 
        className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-bold transition-colors text-center ${className}`} 
      />
    </div>
  );
};

const MultiDoctorInput = ({ value, onChange, datalistId }: { value: string, onChange: (v: string) => void, datalistId: string }) => {
  const [current, setCurrent] = useState('');
  const doctors = value ? value.split('\n').filter(Boolean) : [];

  const addCurrent = () => {
    const trimmed = current.trim();
    if (trimmed && !doctors.includes(trimmed)) {
      onChange([...doctors, trimmed].join('\n'));
    }
    setCurrent('');
  };

  return (
    <div className="flex flex-col gap-1 w-full min-w-[150px]">
      {doctors.map(d => (
        <div key={d} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9.5pt] group">
          <span className="whitespace-nowrap">{d}</span>
          <button onClick={() => onChange(doctors.filter(x => x !== d).join('\n'))} className="no-print text-slate-400 hover:text-red-500 flex-shrink-0 ml-1">
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1 no-print">
        <input 
          type="text" 
          value={current} 
          onChange={e => setCurrent(e.target.value)} 
          list={datalistId}
          placeholder="+ Add Doctor"
          className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 text-[9.5pt] transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCurrent();
            }
          }}
          onBlur={addCurrent}
        />
      </div>
    </div>
  );
};

const InlineTextarea = ({ value, onChange, placeholder = '', className = '', rows = 1, onBlur }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = () => {
    const target = textareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    }
  };
  useEffect(() => {
    adjustHeight();
  }, [value]);
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onBlur={onBlur}
      className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-normal transition-colors resize-none overflow-hidden ${isCenteredValue(value) ? 'text-center' : ''} ${className}`}
    />
  );
};

const InlineSelect = ({ value, onChange, options, className = '' }: any) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-normal cursor-pointer transition-colors ${isCenteredValue(value) ? 'text-center' : ''} ${className}`}>
    <option value="" className="font-sans font-normal text-slate-400">-- Select --</option>
    {options.map((opt: string) => (
      <option key={opt} value={opt} className="font-sans font-normal text-slate-900 bg-white">{opt}</option>
    ))}
  </select>
);

const renderFormattedItemText = (text: string) => {
  if (!text) return null;

  if (text.startsWith("(should be at least")) {
    return <span className="font-normal px-1 py-0.5 block whitespace-pre-wrap">{text}</span>;
  }

  // 1. ICU Beds / HDU Beds (ends bold prefix at ":")
  if (text.startsWith("ICU Beds:")) {
    const idx = text.indexOf(":");
    return (
      <span className="px-1 py-0.5 block whitespace-pre-wrap">
        <span className="font-bold">{text.substring(0, idx + 1)}</span>
        <span>{text.substring(idx + 1)}</span>
      </span>
    );
  }

  // 2. Multiparameter monitor (ends bold prefix at ":")
  if (text.startsWith("Multiparameter") && text.includes(":")) {
    const idx = text.indexOf(":");
    return (
      <span className="px-1 py-0.5 block whitespace-pre-wrap">
        <span className="font-bold">{text.substring(0, idx + 1)}</span>
        <span>{text.substring(idx + 1)}</span>
      </span>
    );
  }

  // 3. No. of dedicated outlets (ends bold prefix at newline before parenthesis)
  if (text.startsWith("No. of dedicated outlets")) {
    const idx = text.indexOf("\n");
    if (idx !== -1) {
      return (
        <span className="px-1 py-0.5 block whitespace-pre-wrap">
          <span className="font-bold">{text.substring(0, idx)}</span>
          <span>{text.substring(idx)}</span>
        </span>
      );
    }
  }

  // 4. Syringe infusion pumps (ends bold prefix at newline before parenthesis)
  if (text.startsWith("Syringe infusion pumps")) {
    const idx = text.indexOf("\n");
    if (idx !== -1) {
      return (
        <span className="px-1 py-0.5 block whitespace-pre-wrap">
          <span className="font-bold">{text.substring(0, idx)}</span>
          <span>{text.substring(idx)}</span>
        </span>
      );
    }
  }

  // 5. Patient warming device (ends bold prefix before " (At least" or "\nshould be")
  if (text.startsWith("Patient warming device")) {
    if (text.includes(" (At least")) {
      const idx = text.indexOf(" (At least");
      return (
        <span className="px-1 py-0.5 block whitespace-pre-wrap">
          <span className="font-bold">{text.substring(0, idx)}</span>
          <span>{text.substring(idx)}</span>
        </span>
      );
    }
    if (text.includes("\nshould be")) {
      const idx = text.indexOf("\nshould be");
      return (
        <span className="px-1 py-0.5 block whitespace-pre-wrap">
          <span className="font-bold">{text.substring(0, idx)}</span>
          <span>{text.substring(idx)}</span>
        </span>
      );
    }
  }

  // 6. Ultrasound machine color Doppler (ends bold prefix at " (")
  if (text.startsWith("Ultrasound machine color Doppler")) {
    const idx = text.indexOf(" (");
    if (idx !== -1) {
      return (
        <span className="px-1 py-0.5 block whitespace-pre-wrap">
          <span className="font-bold">{text.substring(0, idx)}</span>
          <span>{text.substring(idx)}</span>
        </span>
      );
    }
  }

  // 7. ICU Ventilators (HDU version has trailing details)
  if (text.startsWith("ICU Ventilators integrated") && text.includes(" (1 for 3")) {
    const idx = text.indexOf(" (1 for 3");
    return (
      <span className="px-1 py-0.5 block whitespace-pre-wrap">
        <span className="font-bold">{text.substring(0, idx)}</span>
        <span>{text.substring(idx)}</span>
      </span>
    );
  }

  // 8. Oxygen cylinder (B-type)\nwith pressure regulator
  if (text.startsWith("Oxygen cylinder") && text.includes("\nwith")) {
    const idx = text.indexOf("\nwith");
    return (
      <span className="px-1 py-0.5 block whitespace-pre-wrap">
        <span className="font-bold">{text.substring(0, idx)}</span>
        <span>{text.substring(idx)}</span>
      </span>
    );
  }

  // 9. Patient transport trolley\nwith 3 parameters monitor
  if (text.startsWith("Patient transport trolley") && text.includes("\nwith")) {
    const idx = text.indexOf("\nwith");
    return (
      <span className="px-1 py-0.5 block whitespace-pre-wrap">
        <span className="font-bold">{text.substring(0, idx)}</span>
        <span>{text.substring(idx)}</span>
      </span>
    );
  }

  // Default: make it completely bold if it's standard or other
  return <span className="font-bold px-1 py-0.5 block whitespace-pre-wrap">{text}</span>;
};

export default function NMCFormB() {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const useAutoSaveState = <T,>(key: string, initialValue: T) => {
    const [state, setState] = useState<T>(() => {
      const storageKey = `nmc_form_b_${id || 'new'}_${key}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return initialValue;
      try {
        const parsed = JSON.parse(saved);
        if (key === 'equipments' && Array.isArray(parsed)) {
          const initialEquips = initialValue as any[];
          const healed = initialEquips.map((initEq, idx) => {
            const existing = parsed.find(p => p && p.name === initEq.name) || parsed[idx];
            return {
              id: existing?.id || initEq.id,
              name: initEq.name,
              available: existing?.available || '',
              functional: existing?.functional || '',
              specs: existing?.specs || '',
              adequate: existing?.adequate || ''
            };
          });
          const healedIds = new Set(healed.map(h => h.id));
          const customRows = parsed.filter(p => p && p.id && !healedIds.has(p.id));
          return [...healed, ...customRows] as unknown as T;
        }
        if (key === 'icuEquips' && Array.isArray(parsed)) {
          const initialIcuEquips = initialValue as any[];
          const healed = initialIcuEquips.map((initEq, idx) => {
            const existing = parsed.find(p => p && (p.item === initEq.item || 
                                                    (initEq.item.startsWith('ICU Beds') && p.item && p.item.startsWith('ICU Beds')) || 
                                                    (initEq.item.startsWith('ICU Ventilators') && p.item && p.item.startsWith('ICU Ventilators')))) || parsed[idx];
            let numVal = existing?.num || '';
            if (numVal === 'NA') {
              numVal = '';
            }
            return {
              id: existing?.id || initEq.id,
              item: initEq.item,
              num: numVal,
              available: existing?.available || '',
              functional: existing?.functional || '',
              remarks: existing?.remarks || ''
            };
          });
          const healedIds = new Set(healed.map(h => h.id));
          const customRows = parsed.filter(p => p && p.id && !healedIds.has(p.id) && 
                                           p.item && !p.item.startsWith('ICU Beds') && !p.item.startsWith('ICU Ventilators'));
          return [...healed, ...customRows] as unknown as T;
        }
        if (key === 'hduEquips' && Array.isArray(parsed)) {
          const initialHduEquips = initialValue as any[];
          const healed = initialHduEquips.map((initEq, idx) => {
            const existing = parsed.find(p => p && (
              p.item === initEq.item ||
              (initEq.item.startsWith('Syringe infusion') && p.item && (p.item.startsWith('Syringe infusion') || p.item.includes('should be at least 1 per')))
            )) || parsed[idx];
            let numVal = existing?.num || '';
            if (numVal === 'NA') {
              numVal = '';
            }
            return {
              id: existing?.id || initEq.id,
              item: initEq.item,
              num: numVal,
              available: existing?.available || '',
              functional: existing?.functional || '',
              remarks: existing?.remarks || ''
            };
          });
          const healedIds = new Set(healed.map(h => h.id));
          const customRows = parsed.filter(p => p && p.id && !healedIds.has(p.id) && p.item && 
            !p.item.startsWith('ICU Beds') && 
            !p.item.startsWith('ICU Ventilators') && 
            !p.item.startsWith('Multiparameter') && 
            !p.item.startsWith('No. of dedicated') && 
            !p.item.startsWith('Syringe infusion') && 
            !p.item.includes('should be at least 1 per') &&
            p.item !== 'Defibrillator'
          );
          return [...healed, ...customRows] as unknown as T;
        }
        if (key === 'otherIcuEquips' && Array.isArray(parsed)) {
          const initialOtherIcuEquips = initialValue as any[];
          const healed = initialOtherIcuEquips.map((initEq, idx) => {
            const existing = parsed.find(p => p && p.item === initEq.item) || parsed[idx];
            return {
              id: existing?.id || initEq.id,
              item: initEq.item,
              num: existing?.num || '',
              available: existing?.available || '',
              functional: existing?.functional || '',
              remarks: existing?.remarks || ''
            };
          });
          const healedIds = new Set(healed.map(h => h.id));
          const customRows = parsed.filter(p => p && p.id && !healedIds.has(p.id) && p.item && 
            !p.item.startsWith('Ultrasound machine') && 
            !p.item.startsWith('Defibrillator') && 
            !p.item.startsWith('Patient warming') && 
            !p.item.startsWith('Airway/Crash') && 
            !p.item.startsWith('Oxygen cylinder') && 
            !p.item.startsWith('Patient transport') && 
            !p.item.startsWith('Arterial Blood') && 
            !p.item.startsWith('Flexible') && 
            !p.item.startsWith('Facility for')
          );
          return [...healed, ...customRows] as unknown as T;
        }
        if (key === 'otherHduEquips' && Array.isArray(parsed)) {
          const initialOtherHduEquips = initialValue as any[];
          const healed = initialOtherHduEquips.map((initEq, idx) => {
            const existing = parsed.find(p => p && p.item === initEq.item) || parsed[idx];
            return {
              id: existing?.id || initEq.id,
              item: initEq.item,
              num: existing?.num || '',
              available: existing?.available || '',
              functional: existing?.functional || '',
              remarks: existing?.remarks || ''
            };
          });
          const healedIds = new Set(healed.map(h => h.id));
          const customRows = parsed.filter(p => p && p.id && !healedIds.has(p.id) && p.item && 
            !p.item.startsWith('Defibrillator') && 
            !p.item.startsWith('Patient warming') && 
            !p.item.startsWith('Airway/Crash') && 
            !p.item.startsWith('Oxygen cylinder')
          );
          return [...healed, ...customRows] as unknown as T;
        }
        if (key === 'clinicalMats' && Array.isArray(parsed) && parsed.length > 0) {
          // Migration 1: old format with Regional blocks / Resuscitation Services labels
          const hasOld = parsed.some(x => x.param && (x.param.includes('Regional blocks') || x.param.includes('Resuscitation Services') || x.param.includes('Preoperative Assessment\n(PAC)')));
          if (hasOld) {
            const migrated = (initialValue as any[]).map(newVal => {
              const matched = parsed.find(oldVal => {
                if (!oldVal.param || !newVal.param) return false;
                const cleanOld = oldVal.param.replace(/\s+/g, ' ').toLowerCase();
                const cleanNew = newVal.param.replace(/\s+/g, ' ').toLowerCase();
                return cleanOld.substring(0, 15) === cleanNew.substring(0, 15);
              });
              if (matched) {
                return { ...newVal, day: matched.day, prev: matched.prev, yr1: matched.yr1, yr2: matched.yr2, yr3: matched.yr3 };
              }
              if (newVal.param.includes('Labour analgesia')) {
                const oldLabour = parsed.find(oldVal => oldVal.param && oldVal.param.toLowerCase().includes('labour'));
                if (oldLabour) {
                  return { ...newVal, day: oldLabour.day, prev: oldLabour.prev, yr1: oldLabour.yr1, yr2: oldLabour.yr2, yr3: oldLabour.yr3 };
                }
              }
              return newVal;
            });
            return migrated as unknown as T;
          }
          // Migration 2: expand old single combined row → 6 seamless sub-rows
          const hasOldCombined = parsed.some((x: any) => x.param && x.param.startsWith('Anaesthesia procedures/techniques\n'));
          if (hasOldCombined) {
            const oldRow = parsed.find((x: any) => x.param && x.param.startsWith('Anaesthesia procedures/techniques\n'));
            const bullets = ['General Anaesthesia (GA)', 'Central neuraxial blocks', 'Nerve blocks', 'GA + Regional Block', 'Monitored Anaesthesia Care under Sedation', 'Non-operating room anaesthesia (NORA)'];
            const newRows = bullets.map((p, i) => ({ id: generateId(), param: p, day: '', prev: oldRow?.prev||'', yr1: oldRow?.yr1||'', yr2: oldRow?.yr2||'', yr3: oldRow?.yr3||'', group: 'anesthesia-proc', ...(i===0?{groupLabel:'Anaesthesia procedures/techniques'}:{}) }));
            const rest = parsed.filter((x: any) => !x.param?.startsWith('Anaesthesia procedures/techniques\n'));
            const mi = rest.findIndex((x: any) => x.param?.includes('Minor surgeries'));
            rest.splice(mi >= 0 ? mi+1 : rest.length, 0, ...newRows);
            return rest as unknown as T;
          }
        }
        if (Array.isArray(parsed) && Array.isArray(initialValue)) {
          const firstItem = initialValue[0];
          if (firstItem && typeof firstItem === 'object') {
            const primaryKey = ('name' in firstItem) ? 'name' : 
                               ('item' in firstItem) ? 'item' : 
                               ('param' in firstItem) ? 'param' : 
                               ('designation' in firstItem) ? 'designation' : null;
            if (primaryKey) {
              const savedKeys = new Set(parsed.map(x => x[primaryKey]).filter(Boolean));
              const missing = initialValue.filter(x => x[primaryKey] && !savedKeys.has(x[primaryKey]));
              if (missing.length > 0) {
                return [...parsed, ...missing] as unknown as T;
              }
            }
          }
        }
        return parsed;
      } catch (e) {
        return initialValue;
      }
    });

    useEffect(() => {
      const storageKey = `nmc_form_b_${id || 'new'}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, [key, state, id]);

    return [state, setState] as const;
  };

  const [genDetails, setGenDetails] = useAutoSaveState('genDetails', { lopDate: '', yearsSince: '', hod: '', seats: '', increaseApplied: '', units: '', beds: '', numUnitsBeds: '', pgInspectionsText: '' });
  const [unitBeds, setUnitBeds] = useAutoSaveState('unitBeds', { u1:'', u2:'', u3:'', u4:'', u5:'', u6:'', u7:'', u8:'' });
  const [pgInspections, setPgInspections] = useAutoSaveState<PGInspection[]>('pgInspections', [{ id: generateId(), date: '', purpose: '', type: '', outcome: '', seatsInc: '', seatsDec: '', order: '' }]);
  const [otherCourses, setOtherCourses] = useAutoSaveState<OtherCourse[]>('otherCourses', [
    { id: generateId(), name: '', permitted: '', seats: '' },
    { id: generateId(), name: '', permitted: '', seats: '' }
  ]);
  
  const [infra, setInfra] = useAutoSaveState('infra', {
    opdRooms: '', waitingArea: '', spaceAdequate: '', spaceReason: '',
    officeDept: '', officeStaff: '', officeComputer: '', officeStorage: '', officeFaculty: '', officeHod: '', officeProf: '', officeAssoc: '', officeAsst: '', srRestRoom: '', pgRestRoom: '',
    seminarSpace: '', internet: '', audioVisual: '',
    libBooks: '', libPurchased: '', libIndian: '', libForeign: '', libInternet: '', libCentralTiming: '', libReadingTiming: '',
    museumSpace: '', museumSpecimens: '', museumCharts: '',
    resSpace: '', resEquip: '', resPast: '', resProgress: '',
    icuRatioNurse: '', icuRatioDoctor: '', hduRatioNurse: '', hduRatioDoctor: ''
  });

  const [opdAreas, setOpdAreas] = useAutoSaveState<RoomArea[]>('opdAreas', [{ id: generateId(), name: 'Room 1', area: '' }, { id: generateId(), name: 'Room 2', area: '' }]);
  const [journals, setJournals] = useAutoSaveState('journals', [{ id: generateId(), name: '', indian: '', online: '', available: '' }, { id: generateId(), name: '', indian: '', online: '', available: '' }, { id: generateId(), name: '', indian: '', online: '', available: '' }]);
  
  const [equipments, setEquipments] = useAutoSaveState<Equipment[]>('equipments', [
    { id: generateId(), name: 'Operating Tables', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Anesthesia work station per operating table', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Multiparameter Monitors (8 parameters) per operating table', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Laryngoscope (Macintosh)', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Flexible Bronchoscope (Size and length)', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Second generation Supraglottic Airway devices', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Video-laryngoscope', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Bougies/Stylets/Airway exchange catheters', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Resuscitation equipment/Crash cart', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Defibrillators', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Ultrasound machine with 3 probes (Linear, curvilinear, and phased array)', available: '', functional: '', specs: '', adequate: '' },
    { id: generateId(), name: 'Patient warming devices', available: '', functional: '', specs: '', adequate: '' }
  ]);

  const [icus, setIcus] = useAutoSaveState<ICU[]>('icus', [
    { id: generateId(), name: '', beds: '', occDay: '', occYr1: '', occYr2: '', occYr3: '' },
    { id: generateId(), name: '', beds: '', occDay: '', occYr1: '', occYr2: '', occYr3: '' }
  ]);
  const [icuEquips, setIcuEquips] = useAutoSaveState<ICUEquip[]>('icuEquips', [
    { id: generateId(), item: 'ICU Beds: Mechanically or electronically operated along with air mattress', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'ICU Ventilators integrated with humidifier', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Multiparameter (8 parameters) monitor: ECG, NIBP, SpO2, IBP-1, IBP-2, ETCO2, Temp-1, Temp-2', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'No. of dedicated outlets\n(There should be two oxygen, one medical air and two vacuum outlets per bed)', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Syringe infusion pumps\n(should be at least 3 per ICU bed)', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Patient warming device (At least 1 per 2 ICU beds)', num: '', available: '', functional: '', remarks: '' }
  ]);
  const [otherIcuEquips, setOtherIcuEquips] = useAutoSaveState<ICUEquip[]>('otherIcuEquips', [
    { id: generateId(), item: 'Ultrasound machine color Doppler and echocardiogram facility with 3 probes (curvilinear, linear, and phased array)', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Defibrillator', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Patient warming device (At least 1 per 2 ICU beds)', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Airway/Crash cart', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Oxygen cylinder (B-type)\nwith pressure regulator', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Patient transport trolley\nwith 3 parameters monitor', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Arterial Blood Gas\nAnalyzer', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Flexible Bronchoscope', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Facility for bedside Renal\nReplacement Therapy', num: '', available: '', functional: '', remarks: '' }
  ]);

  const [hduEquips, setHduEquips] = useAutoSaveState<ICUEquip[]>('hduEquips', [
    { id: generateId(), item: 'ICU Beds: Mechanically or\nelectronically operated along\nwith air mattress', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'ICU Ventilators integrated\nwith humidifier (1 for 3\nHDU beds)', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Multiparameter (5\nparameter) monitor: ECG,\nNIBP, SpO2, IBP,\nTemperature', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'No. of dedicated outlets\n(oxygen = 2, medical air = 1,\nvacuum = 2)\nThere should be two oxygen,\none medical air and two\nvacuum outlets per bed', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: '(should be at least 1 per\nHDU bed)', num: '', available: '', functional: '', remarks: '' }
  ]);

  const [otherHduEquips, setOtherHduEquips] = useAutoSaveState<ICUEquip[]>('otherHduEquips', [
    { id: generateId(), item: 'Defibrillator', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Patient warming device\nshould be at least 1 per 6\nHDU beds', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Airway/Crash cart', num: '', available: '', functional: '', remarks: '' },
    { id: generateId(), item: 'Oxygen cylinder (B-type)\nwith pressure regulator', num: '', available: '', functional: '', remarks: '' }
  ]);

  const [clinics, setClinics] = useAutoSaveState<Clinic[]>('clinics', [
    { id: generateId(), name: 'Pain clinic', days: '', timings: '', cases: '', incharge: '' },
    { id: generateId(), name: 'Pre-anesthetic clinic', days: '', timings: '', cases: '', incharge: '' }
  ]);

  useEffect(() => {
    // 1. Force heal hduEquips standard names on mount
    const standardHduNames = [
      'ICU Beds: Mechanically or\nelectronically operated along\nwith air mattress',
      'ICU Ventilators integrated\nwith humidifier (1 for 3\nHDU beds)',
      'Multiparameter (5\nparameter) monitor: ECG,\nNIBP, SpO2, IBP,\nTemperature',
      'No. of dedicated outlets\n(oxygen = 2, medical air = 1,\nvacuum = 2)\nThere should be two oxygen,\none medical air and two\nvacuum outlets per bed',
      '(should be at least 1 per\nHDU bed)'
    ];

    setHduEquips(prev => {
      let changed = false;
      const updated = prev.map((eq, idx) => {
        if (idx < 5 && eq.item !== standardHduNames[idx]) {
          changed = true;
          return { ...eq, item: standardHduNames[idx] };
        }
        return eq;
      });
      return changed ? updated : prev;
    });

    // 2. Force heal icuEquips standard names on mount
    const standardIcuNames = [
      'ICU Beds: Mechanically or electronically operated along with air mattress',
      'ICU Ventilators integrated with humidifier',
      'Multiparameter (8 parameters) monitor: ECG, NIBP, SpO2, IBP-1, IBP-2, ETCO2, Temp-1, Temp-2',
      'No. of dedicated outlets\n(There should be two oxygen, one medical air and two vacuum outlets per bed)',
      'Syringe infusion pumps\n(should be at least 3 per ICU bed)',
      'Patient warming device (At least 1 per 2 ICU beds)'
    ];

    setIcuEquips(prev => {
      let changed = false;
      const updated = prev.map((eq, idx) => {
        if (idx < 6 && eq.item !== standardIcuNames[idx]) {
          changed = true;
          return { ...eq, item: standardIcuNames[idx] };
        }
        return eq;
      });
      return changed ? updated : prev;
    });

    // 3. Force heal otherHduEquips standard names on mount
    const standardOtherHduNames = [
      'Defibrillator',
      'Patient warming device\nshould be at least 1 per 6\nHDU beds',
      'Airway/Crash cart',
      'Oxygen cylinder (B-type)\nwith pressure regulator'
    ];

    setOtherHduEquips(prev => {
      let changed = false;
      const updated = prev.map((eq, idx) => {
        if (idx < 4 && eq.item !== standardOtherHduNames[idx]) {
          changed = true;
          return { ...eq, item: standardOtherHduNames[idx] };
        }
        return eq;
      });
      return changed ? updated : prev;
    });

    // 4. Force heal otherIcuEquips standard names on mount
    const standardOtherIcuNames = [
      'Ultrasound machine color Doppler and echocardiogram facility with 3 probes (curvilinear, linear, and phased array)',
      'Defibrillator',
      'Patient warming device (At least 1 per 2 ICU beds)',
      'Airway/Crash cart',
      'Oxygen cylinder (B-type)\nwith pressure regulator',
      'Patient transport trolley\nwith 3 parameters monitor',
      'Arterial Blood Gas\nAnalyzer',
      'Flexible Bronchoscope',
      'Facility for bedside Renal\nReplacement Therapy'
    ];

    setOtherIcuEquips(prev => {
      let changed = false;
      const updated = prev.map((eq, idx) => {
        if (idx < 9 && eq.item !== standardOtherIcuNames[idx]) {
          changed = true;
          return { ...eq, item: standardOtherIcuNames[idx] };
        }
        return eq;
      });
      return changed ? updated : prev;
    });

    // 5. Force heal clinics standard names and merge in-charges if separate on mount
    const standardClinicNames = [
      'Pain clinic',
      'Pre-anesthetic clinic'
    ];

    setClinics(prev => {
      let changed = false;
      const updated = prev.map((eq, idx) => {
        if (idx < 2 && eq.name !== standardClinicNames[idx]) {
          changed = true;
          return { ...eq, name: standardClinicNames[idx] };
        }
        return eq;
      });

      if (updated.length >= 2) {
        const inc0 = updated[0].incharge || '';
        const inc1 = updated[1].incharge || '';
        if (inc0 !== inc1) {
          changed = true;
          const combined = [inc0, inc1].filter(Boolean).join('\n');
          updated[0].incharge = combined;
          updated[1].incharge = combined;
        }
      }

      return changed ? updated : prev;
    });
  }, []);

  const [clinicalMats, setClinicalMats] = useAutoSaveState<ClinicalMat[]>('clinicalMats', [
    { id: generateId(), param: 'Preoperative Assessment (PAC)', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Major surgeries', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Minor surgeries performed under only local anaesthesia', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'General Anaesthesia (GA)', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc', groupLabel: 'Anaesthesia procedures/techniques' },
    { id: generateId(), param: 'Central neuraxial blocks', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc' },
    { id: generateId(), param: 'Nerve blocks', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc' },
    { id: generateId(), param: 'GA + Regional Block', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc' },
    { id: generateId(), param: 'Monitored Anaesthesia Care under Sedation', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc' },
    { id: generateId(), param: 'Non-operating room anaesthesia (NORA)', day: '', prev: '', yr1: '', yr2: '', yr3: '', group: 'anesthesia-proc' },
    { id: generateId(), param: 'Number of Deliveries in institute', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Number of patients who received Labour analgesia', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Number of Caesarean sections', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Number of patients seen in Pain Clinic', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Number of Interventional Pain Procedures', day: '', prev: '', yr1: '', yr2: '', yr3: '' },
    { id: generateId(), param: 'Number of Emergency surgeries', day: '', prev: '', yr1: '', yr2: '', yr3: '' }
  ]);

  const [unitFaculties, setUnitFaculties] = useAutoSaveState<UnitFaculty[]>('unitFaculties', Array(10).fill(null).map(() => ({
    id: generateId(), designation: '', name: '', joiningDate: '', relieved: '',
    relievingDate: '', attendance: '', phone: '', email: '', signature: ''
  })));
  const [staffUnitNo, setStaffUnitNo] = useAutoSaveState('staffUnitNo', '');

  const [eligibleFaculties, setEligibleFaculties] = useAutoSaveState<EligibleFaculty[]>('eligibleFaculties', [
    { id: generateId(), designation: 'Professor', num: '', name: '', seats: '', adequate: '' },
    { id: generateId(), designation: 'Associate\nProfessor', num: '', name: '', seats: '', adequate: '' },
    { id: generateId(), designation: 'Assistant\nProfessor', num: '', name: '', seats: '', adequate: '' },
    { id: generateId(), designation: 'Senior Resident', num: '', name: '', seats: '', adequate: '' },
  ]);

  const [pgStudents, setPgStudents] = useAutoSaveState<PGStudent[]>('pgStudents', [
    { id: generateId(), name: '', joiningDate: '', phone: '', email: '' },
    { id: generateId(), name: '', joiningDate: '', phone: '', email: '' }
  ]);
  const [pastPgStudents, setPastPgStudents] = useAutoSaveState<PastPGStudent[]>('pastPgStudents', [
    { id: generateId(), name: '', joiningDate: '', relievingDate: '', phone: '', email: '' },
    { id: generateId(), name: '', joiningDate: '', relievingDate: '', phone: '', email: '' }
  ]);
  
  const [academicActivities, setAcademicActivities] = useAutoSaveState<AcademicActivity[]>('academicActivities', [
    { id: generateId(), name: 'Clinico- Pathological conference', count: '', remarks: '' },
    { id: generateId(), name: 'Clinical Seminars', count: '', remarks: '' },
    { id: generateId(), name: 'Journal Clubs', count: '', remarks: '' },
    { id: generateId(), name: 'Case presentations', count: '', remarks: '' },
    { id: generateId(), name: 'Group discussions', count: '', remarks: '' },
    { id: generateId(), name: 'Guest lectures', count: '', remarks: '' },
    { id: generateId(), name: 'Death Audit Meetings', count: '', remarks: '' },
    { id: generateId(), name: 'Physician conference/ Continuing\nMedical Education (CME)\norganized.', count: '', remarks: '' },
    { id: generateId(), name: 'Symposium', count: '', remarks: '' },
  ]);

  const [publicationsList, setPublicationsList] = useAutoSaveState('publicationsList', '');
  const [formativeAssessment, setFormativeAssessment] = useAutoSaveState('formativeAssessment', '');
  
  const [externalExaminers, setExternalExaminers] = useAutoSaveState<Examiner[]>('externalExaminers', [
    { id: generateId(), name: '', designation: '', institute: '' },
    { id: generateId(), name: '', designation: '', institute: '' },
    { id: generateId(), name: '', designation: '', institute: '' },
    { id: generateId(), name: '', designation: '', institute: '' }
  ]);
  const [internalExaminers, setInternalExaminers] = useAutoSaveState<InternalExaminer[]>('internalExaminers', [
    { id: generateId(), name: '', designation: '' },
    { id: generateId(), name: '', designation: '' },
    { id: generateId(), name: '', designation: '' },
    { id: generateId(), name: '', designation: '' }
  ]);
  const [examStudents, setExamStudents] = useAutoSaveState<ExamStudent[]>('examStudents', [
    { id: generateId(), name: '', result: '' },
    { id: generateId(), name: '', result: '' },
    { id: generateId(), name: '', result: '' },
    { id: generateId(), name: '', result: '' }
  ]);
  
  const [examDetails, setExamDetails] = useAutoSaveState('examDetails', '');
  const [assessorRemarks, setAssessorRemarks] = useAutoSaveState('assessorRemarks', '');
  const [miscData, setMiscData] = useAutoSaveState('miscData', { govt: '', national: '', other: '', defic: '' });

  useEffect(() => {
    if (!id) {
      setIsFetching(false);
      return;
    }
    
    const loadRecord = async () => {
      try {
        const docRef = doc(db, 'nmc_form_b', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGenDetails(data.genDetails || genDetails);
          setUnitBeds(data.unitBeds || unitBeds);
          setPgInspections(data.pgInspections || pgInspections);
          setOtherCourses(data.otherCourses || otherCourses);
          setInfra(data.infra || infra);
          setOpdAreas(data.opdAreas || opdAreas);
          setJournals(data.journals || journals);
          setEquipments(data.equipments || equipments);
          setIcus(data.icus || icus);
          setIcuEquips(data.icuEquips || icuEquips);
          setOtherIcuEquips(data.otherIcuEquips || otherIcuEquips);
          setHduEquips(data.hduEquips || hduEquips);
          setOtherHduEquips(data.otherHduEquips || otherHduEquips);
          setClinics(data.clinics || clinics);
          setClinicalMats(data.clinicalMats || clinicalMats);
          setUnitFaculties(data.unitFaculties || unitFaculties);
          setStaffUnitNo(data.staffUnitNo || staffUnitNo);
          setEligibleFaculties(data.eligibleFaculties || eligibleFaculties);
          setPgStudents(data.pgStudents || pgStudents);
          setPastPgStudents(data.pastPgStudents || pastPgStudents);
          setAcademicActivities(data.academicActivities || academicActivities);
          setPublicationsList(data.publicationsList || publicationsList);
          setFormativeAssessment(data.formativeAssessment || formativeAssessment);
          setExternalExaminers(data.externalExaminers || externalExaminers);
          setInternalExaminers(data.internalExaminers || internalExaminers);
          setExamStudents(data.examStudents || examStudents);
          setExamDetails(data.examDetails || examDetails);
          setAssessorRemarks(data.assessorRemarks || assessorRemarks);
          setMiscData(data.miscData || miscData);
        }
      } catch (err) {
        console.error("Error loading record:", err);
      } finally {
        setIsFetching(false);
      }
    };
    
    loadRecord();
  }, [id]);

  useEffect(() => {
    if (isFetching) return;

    const payloadString = JSON.stringify({
      genDetails, unitBeds, pgInspections, otherCourses, infra, opdAreas, journals, equipments, icus, icuEquips, otherIcuEquips, hduEquips, otherHduEquips, clinics, clinicalMats, unitFaculties, staffUnitNo, eligibleFaculties, pgStudents, pastPgStudents, academicActivities, publicationsList, formativeAssessment, externalExaminers, internalExaminers, examStudents, examDetails, assessorRemarks, miscData
    });

    const timeoutId = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        const recordId = id || Math.random().toString(36).substring(2, 10);
        const docRef = doc(db, 'nmc_form_b', recordId);
        
        const payload = {
          id: recordId,
          ...JSON.parse(payloadString),
          updatedAt: serverTimestamp(),
          ...(id ? {} : { createdAt: serverTimestamp() })
        };
        
        await setDoc(docRef, payload, { merge: true });
        setLastSaved(new Date());
        
        if (!id) {
          navigate(`/nmc-form-b/${recordId}`, { replace: true });
        }
      } catch (error) {
        console.error("Autosave error: ", error);
      } finally {
        setIsAutosaving(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [id, isFetching, navigate, genDetails, unitBeds, pgInspections, otherCourses, infra, opdAreas, journals, equipments, icus, icuEquips, otherIcuEquips, hduEquips, otherHduEquips, clinics, clinicalMats, unitFaculties, staffUnitNo, eligibleFaculties, pgStudents, pastPgStudents, academicActivities, publicationsList, formativeAssessment, externalExaminers, internalExaminers, examStudents, examDetails, assessorRemarks, miscData]);

  const handleSaveRecord = async () => {
    setIsSaving(true);
    try {
      const recordId = id || Math.random().toString(36).substring(2, 10);
      const docRef = doc(db, 'nmc_form_b', recordId);
      
      const payload = {
        id: recordId,
        genDetails, unitBeds, pgInspections, otherCourses, infra, opdAreas, journals, equipments, icus, icuEquips, otherIcuEquips, hduEquips, otherHduEquips, clinics, clinicalMats, unitFaculties, staffUnitNo, eligibleFaculties, pgStudents, pastPgStudents, academicActivities, publicationsList, formativeAssessment, externalExaminers, internalExaminers, examStudents, examDetails, assessorRemarks, miscData,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() })
      };
      
      await setDoc(docRef, payload, { merge: true });
      
      if (!id) {
        navigate(`/nmc-form-b/${recordId}`, { replace: true });
      }
      showToast('Record saved successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save record: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addRow = (setState: any, createNew: () => any) => setState((prev: any[]) => [...prev, createNew()]);
  const removeRow = (setState: any, id: string) => setState((prev: any[]) => prev.filter(item => item.id !== id));
  const updateRow = (setState: any, id: string, field: string, value: string) => setState((prev: any[]) => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

  const handleDownloadPDFClick = async () => {
    if (!printRef.current) return;
    setLoading(true);
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px'; // Set explicit width to fit landscape pages nicely
      tempContainer.style.height = '15000px'; // Extremely tall to prevent any vertical clipping from the layout viewport
      tempContainer.style.overflow = 'visible';
      
      const clone = printRef.current.cloneNode(true) as HTMLElement;
      // Strip layout-affecting classes and styles from cloned wrapper to prevent centering offsets
      clone.className = 'print-container-clone';
      clone.style.width = '100%';
      clone.style.display = 'block';
      clone.style.position = 'relative';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.margin = '0';
      clone.style.padding = '0';

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      clone.querySelectorAll('.no-print').forEach(el => { (el as HTMLElement).style.display = 'none'; });
      
      // Explicitly remove input underlines for PDF generation
      clone.querySelectorAll('.border-b.border-black').forEach(el => {
        if (!el.classList.contains('border-t') && el.tagName !== 'TABLE' && el.tagName !== 'TH' && el.tagName !== 'TD') {
          el.classList.remove('border-b', 'border-black');
        }
      });

      clone.querySelectorAll('input, textarea, select').forEach(input => {
        const el = input as HTMLInputElement | HTMLTextAreaElement;
        const div = document.createElement('div');
        div.innerText = el.value || '\u00A0';
        div.className = el.className;
        div.style.border = 'none';
        div.style.background = 'transparent';
        div.style.resize = 'none';
        if (el.tagName === 'TEXTAREA') div.style.whiteSpace = 'pre-wrap';
        el.parentNode?.replaceChild(div, el);
      });

      const printPages = clone.querySelectorAll('.print-page');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

      for (let i = 0; i < printPages.length; i++) {
        const page = printPages[i] as HTMLElement;
        const isLandscape = page.classList.contains('landscape-page');
        
        // Exact pixel dimensions at 96 DPI: Portrait is 794x1123, Landscape is 1123x794
        const width = isLandscape ? 1123 : 794;
        const height = isLandscape ? 794 : 1123;
        
        const dataUrl = await toJpeg(page, { 
          pixelRatio: 1.5, 
          quality: 0.85,
          backgroundColor: '#ffffff',
          width,
          height,
          style: {
            margin: '0',
            transform: 'none',
            left: '0',
            top: '0',
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            overflow: 'hidden'
          }
        });

        if (i > 0) pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
        if (isLandscape) pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210);
        else pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save('FORM-B_ANAESTHESIOLOGY_Complete.pdf');
      document.body.removeChild(tempContainer);
    } catch (err: any) {
      console.error(err);
      showToast(`Error generating PDF: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClick = () => window.print();

  const PageHeader = ({ pageNum }: { pageNum: number }) => (
    <div className="flex justify-between w-full mb-3 font-serif text-[11pt]">
      <div>FORM-B (ANAESTHESIOLOGY)/2024</div>
      <div>Page | {pageNum}</div>
    </div>
  );

  const PageFooter = () => (
    <div className="mt-auto pt-6 w-full flex justify-between text-[11pt] font-serif font-bold bg-white">
      <div>Signature of Dean</div>
      <div>Signature of Assessor</div>
    </div>
  );

  // ── Dynamic page overflow: faculty table ──────────────────────────────────
  const FACULTY_FIRST = 9;   // rows on page 8 (Sr. No. 1-9), rest overflow
  const FACULTY_CONT  = 11;  // rows that fit on continuation pages
  const facultyChunks = useMemo(
    () => chunkArray(unitFaculties, FACULTY_FIRST, FACULTY_CONT),
    [unitFaculties]
  );
  const extraFacultyPages = facultyChunks.length - 1;
  const pn = (base: number) => base + extraFacultyPages;

  // ── Import from Doctors (Firebase) ────────────────────────────────
  const [importTarget, setImportTarget] = useState<'faculty' | 'pgStudying' | 'pgCompleted' | null>(null);
  const [rowDoctorModalId, setRowDoctorModalId] = useState<string | null>(null);
  const [rowSelectedDoctorIds, setRowSelectedDoctorIds] = useState<Set<string>>(new Set());
  const [firestoreDoctors, setFirestoreDoctors] = useState<any[]>([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'doctors'), orderBy('first_name'));
    const unsub = onSnapshot(q, snap => {
      setFirestoreDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredFirestoreDoctors = firestoreDoctors
    .filter(d => {
      if (importTarget === 'pgStudying' || importTarget === 'pgCompleted') {
        const desig = d.designation || '';
        const isJRorSR = desig === 'Senior Resident' || desig.startsWith('Junior Resident');
        if (!isJRorSR) return false;
      }
      const q = doctorSearch.toLowerCase();
      return !q || `${d.first_name} ${d.middle_name || ''} ${d.last_name} ${d.designation}`.toLowerCase().includes(q);
    })
    .sort(sortDoctors);

  const handleImportDoctors = () => {
    const sortedSelected = filteredFirestoreDoctors.filter(d => selectedDoctorIds.has(d.id));
    
    if (importTarget === 'faculty') {
      const newRows: UnitFaculty[] = sortedSelected.map(d => ({
        id: generateId(),
        designation: d.designation || '',
        name: `${d.title || 'Dr.'} ${d.first_name || ''} ${d.middle_name || ''} ${d.last_name || ''}`.replace(/\s+/g, ' ').trim(),
        joiningDate: d.joining_date ? d.joining_date.split('-').reverse().join('-') : '',
        relieved: d.till_date ? 'Relieved' : 'Working',
        relievingDate: d.till_date ? d.till_date.split('-').reverse().join('-') : '',
        attendance: '',
        phone: d.mobile_number || '',
        email: d.email || '',
        signature: '',
      }));
      setUnitFaculties(prev => {
        const nonEmpty = prev.filter(r => r.name || r.designation || r.phone || r.email);
        const combined = [...nonEmpty, ...newRows];
        return combined.sort((a, b) => {
          const ra = designationHierarchy[a.designation] ?? 99;
          const rb = designationHierarchy[b.designation] ?? 99;
          if (ra !== rb) return ra - rb;
          
          const cleanNameA = (a.name || '').replace(/^(Dr\.|Mr\.|Mrs\.)\s*/i, '');
          const cleanNameB = (b.name || '').replace(/^(Dr\.|Mr\.|Mrs\.)\s*/i, '');
          const firstNameA = cleanNameA.split(' ')[0] || '';
          const firstNameB = cleanNameB.split(' ')[0] || '';
          
          const nameRankA = nameHierarchy[firstNameA.toLowerCase()] || 99;
          const nameRankB = nameHierarchy[firstNameB.toLowerCase()] || 99;
          if (nameRankA !== nameRankB) return nameRankA - nameRankB;

          return (a.name || '').localeCompare(b.name || '');
        });
      });
    } else if (importTarget === 'pgStudying' || importTarget === 'pgCompleted') {
      const newRows = sortedSelected.map(d => ({
        id: generateId(),
        name: `${d.title || 'Dr.'} ${d.first_name || ''} ${d.middle_name || ''} ${d.last_name || ''}`.replace(/\s+/g, ' ').trim(),
        joiningDate: d.joining_date ? d.joining_date.split('-').reverse().join('-') : '',
        relievingDate: d.till_date ? d.till_date.split('-').reverse().join('-') : '',
        phone: d.mobile_number || '',
        email: d.email || ''
      }));
      
      if (importTarget === 'pgStudying') {
        setPgStudents(prev => [...prev.filter(r => r.name || r.phone || r.email), ...newRows.map(r => ({id: r.id, name: r.name, joiningDate: r.joiningDate, phone: r.phone, email: r.email}))]);
      } else {
        setPastPgStudents(prev => [...prev.filter(r => r.name || r.phone || r.email), ...newRows]);
      }
    }

    setSelectedDoctorIds(new Set());
    setImportTarget(null);
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Loading Form B Record...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">Retrieving your standard inspection format data.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
          <div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/nmc-form-b')}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                title="Back to Hub"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-slate-800">
                NMC FORM B - Anaesthesiology {id ? '(Editing)' : '(New)'}
              </h1>
            </div>
              <p className="text-sm text-slate-500 ml-11">
                {isAutosaving ? (
                  <span className="flex items-center gap-1 text-blue-600"><Loader2 size={12} className="animate-spin" /> Saving to cloud...</span>
                ) : lastSaved ? (
                  <span className="text-emerald-600">All changes saved to cloud at {lastSaved.toLocaleTimeString()}</span>
                ) : (
                  <span>Auto-saves to cloud automatically. Use Save Record to force save.</span>
                )}
              </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveRecord}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                isSaving ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? 'Saving...' : 'Save Record'}</span>
            </button>
            <button onClick={() => {
              if (window.confirm("Are you sure you want to reset all form data? This will clear all your typed inputs.")) {
                localStorage.clear();
                window.location.reload();
              }
            }} className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 shadow-sm transition-colors">
              <Trash2 className="w-4 h-4" /><span>Reset Data</span>
            </button>
            <button onClick={handlePrintClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm">
              <Printer className="w-4 h-4" /><span>Print</span>
            </button>
            <button onClick={handleDownloadPDFClick} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50">
              <Download className="w-4 h-4" /><span>{loading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 flex flex-col items-center overflow-x-auto overflow-y-auto bg-slate-200" ref={printRef}>
          
          <style dangerouslySetInnerHTML={{__html: `
            .a4-page, .a4-page * {
              box-sizing: border-box !important;
            }
            @media print {
              @page { size: A4 portrait; margin: 0; }
              @page landscape { size: A4 landscape; margin: 0; }
              body { background: white; -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
              .print-page { 
                box-shadow: none !important; margin: 0 !important; page-break-after: always;
                overflow: hidden !important; position: relative;
              }
              .portrait-page { width: 210mm !important; height: 297mm !important; }
              .landscape-page { width: 297mm !important; height: 210mm !important; page: landscape; }
              .print-page:last-child { page-break-after: auto; }
            }
            .a4-page {
              background: white; padding: 12.7mm 12.7mm 25mm 12.7mm; margin-bottom: 20px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); position: relative; color: black;
              font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5;
            }
            .portrait-page { width: 210mm; min-height: 297mm; }
            .landscape-page { width: 297mm; min-height: 210mm; }
            .nmc-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .nmc-table th, .nmc-table td { border: 1px solid black; padding: 4px 6px; vertical-align: top; overflow-wrap: break-word; word-break: normal; }
            .nmc-table th { font-weight: bold; text-align: center; }
            .tight-table th, .tight-table td { padding: 2px 4px !important; line-height: 1.1 !important; }
            .tight-table textarea, .tight-table input, .tight-table select { line-height: 1.1 !important; }
            .nmc-table textarea, .nmc-table input, .nmc-table select { font-weight: bold !important; }
            .text-center { text-align: center !important; }
            .a4-page table.ml-8 {
              margin-left: 2rem !important;
              width: calc(100% - 2rem) !important;
            }
            .a4-page table.ml-4 {
              margin-left: 1rem !important;
              width: calc(100% - 1rem) !important;
            }
          `}} />

          {/* PAGE 1 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={1} />
            <div className="text-center mb-3 leading-tight">
              <h2 className="font-bold text-[16pt] underline decoration-[1.5px] underline-offset-4">STANDARD ASSESSMENT FORM- B</h2>
              <h3 className="text-[12pt] mt-1">(DEPARTMENTAL INFORMATION)</h3>
              <h3 className="font-bold text-[14pt] mt-0.5">ANAESTHESIOLOGY</h3>
            </div>
            
            <div className="border-[1.5px] border-black p-1.5 mb-3 mx-8">
              <ol className="list-decimal pl-4 italic text-[11pt] space-y-0.5 m-0">
                <li>Kindly read the instructions mentioned in the <strong>Form 'A'</strong>.</li>
                <li>Write <strong>N/A</strong> where it is <strong>Not Applicable</strong>. Write <strong>'Not Available'</strong>, if the facility is <strong>Not Available</strong>.</li>
              </ol>
            </div>

            <h4 className="font-bold text-[12pt] mb-1.5 flex"><span className="w-8">A.</span><span>GENERAL:</span></h4>
            <div className="pl-4 space-y-1.5 mb-2 text-[10.5pt]">
              <div className="flex items-end">
                <span className="w-8">a.</span>
                <span className="mr-2 whitespace-nowrap">Date of LoP when PG course was first Permitted:</span>
                <span className="border-b border-black w-64"><InlineInput value={genDetails.lopDate} onChange={(v:string)=>setGenDetails({...genDetails, lopDate: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">b.</span>
                <span className="mr-2 whitespace-nowrap">Number of years since start of PG course:</span>
                <span className="border-b border-black w-64"><InlineInput value={genDetails.yearsSince} onChange={(v:string)=>setGenDetails({...genDetails, yearsSince: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">c.</span>
                <span className="mr-2 whitespace-nowrap">Name of the Head of Department:</span>
                <span className="border-b border-black w-96"><InlineInput value={genDetails.hod} onChange={(v:string)=>setGenDetails({...genDetails, hod: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">d.</span>
                <span className="mr-2 whitespace-nowrap">Number of PG Admissions (Seats):</span>
                <span className="border-b border-black w-32"><InlineInput value={genDetails.seats} onChange={(v:string)=>setGenDetails({...genDetails, seats: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">e.</span>
                <span className="mr-2 whitespace-nowrap">Number of Increase of Admissions (Seats) applied for:</span>
                <span className="border-b border-black w-32"><InlineInput value={genDetails.increaseApplied} onChange={(v:string)=>setGenDetails({...genDetails, increaseApplied: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">f.</span>
                <span className="mr-2 whitespace-nowrap">Total number of Units:</span>
                <span className="border-b border-black w-32"><InlineInput value={genDetails.units} onChange={(v:string)=>setGenDetails({...genDetails, units: v})} /></span>
              </div>
              <div className="flex items-end">
                <span className="w-8">g.</span>
                <span className="mr-2 whitespace-nowrap">Number of beds in the Department:</span>
                <span className="border-b border-black w-32"><InlineInput value={genDetails.beds} onChange={(v:string)=>setGenDetails({...genDetails, beds: v})} /></span>
              </div>
              <div className="flex flex-col mt-1.5">
                <div className="flex items-end mb-1">
                  <span className="w-8">h.</span>
                  <span className="mr-2 whitespace-nowrap">Number of Units with beds in each unit:</span>
                  <span className="border-b border-black w-96"><InlineInput value={genDetails.numUnitsBeds || ''} onChange={(v:string)=>setGenDetails({...genDetails, numUnitsBeds: v})} /></span>
                </div>
                <table className="nmc-table tight-table w-full text-[10pt] ml-8 w-[calc(100%-2rem)] mb-0">
                  <thead>
                    <tr><th className="w-1/4">Unit</th><th className="w-1/4">Number of Beds</th><th className="w-1/4">Unit</th><th className="w-1/4">Number of beds</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Unit-I</td><td><InlineInput value={unitBeds.u1} onChange={(v:string)=>setUnitBeds({...unitBeds, u1:v})} /></td><td>Unit-V</td><td><InlineInput value={unitBeds.u5} onChange={(v:string)=>setUnitBeds({...unitBeds, u5:v})} /></td></tr>
                    <tr><td>Unit-II</td><td><InlineInput value={unitBeds.u2} onChange={(v:string)=>setUnitBeds({...unitBeds, u2:v})} /></td><td>Unit-VI</td><td><InlineInput value={unitBeds.u6} onChange={(v:string)=>setUnitBeds({...unitBeds, u6:v})} /></td></tr>
                    <tr><td>Unit-III</td><td><InlineInput value={unitBeds.u3} onChange={(v:string)=>setUnitBeds({...unitBeds, u3:v})} /></td><td>Unit-VII</td><td><InlineInput value={unitBeds.u7} onChange={(v:string)=>setUnitBeds({...unitBeds, u7:v})} /></td></tr>
                    <tr><td>Unit-IV</td><td><InlineInput value={unitBeds.u4} onChange={(v:string)=>setUnitBeds({...unitBeds, u4:v})} /></td><td>Unit-VIII</td><td><InlineInput value={unitBeds.u8} onChange={(v:string)=>setUnitBeds({...unitBeds, u8:v})} /></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pl-4 mt-2">
              <div className="flex items-end mb-1">
                <span className="w-8">i.</span>
                <span className="mr-2 whitespace-nowrap">Details of PG inspections of the department in last five years:</span>
                <span className="border-b border-black w-[500px]"><InlineInput value={genDetails.pgInspectionsText || ''} onChange={(v:string)=>setGenDetails({...genDetails, pgInspectionsText: v})} /></span>
              </div>
              <table className="nmc-table tight-table text-[8.5pt] leading-[1.2] w-full">
                <thead>
                  <tr>
                    <th className="w-[10%]">Date of<br/>Inspection</th>
                    <th className="w-[24%]">Purpose of<br/>Inspection<br/><span className="font-normal italic">(LoP for starting a course/permission for increase of seats/ Recognition of course/ Recognition of increased seats /Renewal of Recognition/Surprise /Random Inspection/ Compliance Verification inspection/other)</span></th>
                    <th className="w-[12%]">Type of<br/>Inspection<br/><span className="font-normal">(Physical/<br/>Virtual)</span></th>
                    <th className="w-[24%]">Outcome<br/><span className="font-normal italic">(LoP received/denied. Permission for increase of seats received/denied. Recognition of course done/denied. Recognition of increased seats done/denied /Renewal of Recognition done/denied /other)</span></th>
                    <th className="w-[8%]">No of seats<br/>Increased</th>
                    <th className="w-[8%]">No of seats<br/>Decreased</th>
                    <th className="w-[14%]">Order issued<br/>on the basis of<br/>inspection<br/><span className="font-normal italic">(Attach copy of all the order issued by NMC/MCI) as Annexure</span></th>
                    <th className="w-10 no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {pgInspections.map(insp => (
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
                </tbody>
              </table>
              <button className="no-print text-indigo-600 text-sm mb-2 flex items-center" onClick={()=>addRow(setPgInspections, ()=>({id:generateId(), date:'', purpose:'', type:'', outcome:'', seatsInc:'', seatsDec:'', order:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 2 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={2} />
            <div className="pl-4 mt-3">
              <p className="mb-1 flex"><span className="w-8">j.</span><span>Any other Course/observer ship (PDCC, PDF, DNB, M.Sc., PhD, FNB, etc.) permitted/ not permitted by MCI/NMC is being run by the department? If so, the details thereof:</span></p>
              <table className="nmc-table tight-table w-full text-[10pt]">
                <thead><tr><th className="w-1/2">Name of Qualification (course)</th><th className="w-1/4">Permitted/not Permitted by<br/>MCI/NMC</th><th className="w-1/4">Number of<br/>Seats</th></tr></thead>
                <tbody>
                  {otherCourses.map(c => (
                    <tr key={c.id}>
                      <td><InlineInput value={c.name} onChange={(v:string)=>updateRow(setOtherCourses, c.id, 'name', v)} /></td>
                      <td className="text-center">
                        <InlineInput value={c.permitted} onChange={(v:string)=>updateRow(setOtherCourses, c.id, 'permitted', v)} className="text-center" />
                      </td>
                      <td><InlineInput value={c.seats} onChange={(v:string)=>updateRow(setOtherCourses, c.id, 'seats', v)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-[12pt] mt-4 mb-2 flex"><span className="w-8">B.</span><span>INFRASTRUCTURE OF THE DEPARTMENT:</span></h4>
            <div className="pl-8 text-[10.5pt]">
              <p className="font-bold mb-1 flex"><span className="w-8">a.</span><span>OPD</span></p>
              <div className="pl-8">
                <div className="flex mb-1"><span className="w-28">No of rooms:</span><span className="border-b border-black w-40"><InlineInput value={infra.opdRooms} onChange={(v:string)=>setInfra({...infra, opdRooms: v})} /></span></div>
                <p className="font-bold mb-1 mt-2">Area of each OPD room (add rows)</p>
                <table className="nmc-table tight-table w-1/2 text-[10pt]">
                  <thead><tr><th className="w-1/2"></th><th>Area in M<sup>2</sup></th></tr></thead>
                  <tbody>
                    {opdAreas.map((r) => {
                      return (
                        <tr key={r.id}>
                          <td className="font-bold"><InlineInput value={r.name} onChange={(v:string)=>updateRow(setOpdAreas, r.id, 'name', v)} /></td>
                          <td>
                            <InlineInput 
                              value={r.area} 
                              onChange={(v:string)=>updateRow(setOpdAreas, r.id, 'area', v)} 
                              onBlur={() => { updateRow(setOpdAreas, r.id, 'area', formatAreaOnBlur(r.area)); }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex mb-1 mt-2"><span className="w-28">Waiting area:</span><span className="border-b border-black w-32"><InlineInput value={infra.waitingArea} onChange={(v:string)=>setInfra({...infra, waitingArea: v})} onBlur={() => setInfra({...infra, waitingArea: formatAreaOnBlur(infra.waitingArea)})} /></span></div>
                <div className="flex mb-1"><span className="w-44">Space and arrangements:</span><span className="flex-1 font-bold"><InlineSelect value={infra.spaceAdequate} onChange={(v:string)=>setInfra({...infra, spaceAdequate: v})} options={["Adequate", "Not Adequate", "--"]} /></span></div>
                <div className="flex mb-3"><span className="w-80">If not adequate, give reasons/details/comments:</span><span className="border-b border-black flex-1"><InlineTextarea value={infra.spaceReason} onChange={(v:string)=>setInfra({...infra, spaceReason: v})} /></span></div>
              </div>

              <p className="font-bold mb-1 mt-3 flex"><span className="w-8">b.</span><span>Department office details:</span></p>
              <div className="pl-8 w-[60%]">
                <table className="nmc-table tight-table text-[10pt] mb-3">
                  <thead><tr><th colSpan={2}>Department Office</th></tr></thead>
                  <tbody>
                    <tr><td className="w-1/2">Department office</td><td><InlineSelect value={infra.officeDept} onChange={(v:string)=>setInfra({...infra, officeDept: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Staff (Steno /Clerk)</td><td><InlineSelect value={infra.officeStaff} onChange={(v:string)=>setInfra({...infra, officeStaff: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Computer and related office<br/>equipment</td><td><InlineSelect value={infra.officeComputer} onChange={(v:string)=>setInfra({...infra, officeComputer: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Storage space for files</td><td><InlineSelect value={infra.officeStorage} onChange={(v:string)=>setInfra({...infra, officeStorage: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                  </tbody>
                </table>
                <table className="nmc-table tight-table text-[10pt] mb-0">
                  <thead><tr><th colSpan={2}>Office Space for Teaching Faculty/residents</th></tr></thead>
                  <tbody>
                    <tr><td className="w-1/2">Faculty</td><td><InlineSelect value={infra.officeFaculty} onChange={(v:string)=>setInfra({...infra, officeFaculty: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Head of the Department</td><td><InlineSelect value={infra.officeHod} onChange={(v:string)=>setInfra({...infra, officeHod: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Professors</td><td><InlineSelect value={infra.officeProf} onChange={(v:string)=>setInfra({...infra, officeProf: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Associate Professors</td><td><InlineSelect value={infra.officeAssoc} onChange={(v:string)=>setInfra({...infra, officeAssoc: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Assistant Professor</td><td><InlineSelect value={infra.officeAsst} onChange={(v:string)=>setInfra({...infra, officeAsst: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>Senior residents rest room</td><td><InlineSelect value={infra.srRestRoom} onChange={(v:string)=>setInfra({...infra, srRestRoom: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                    <tr><td>PG rest room</td><td><InlineSelect value={infra.pgRestRoom} onChange={(v:string)=>setInfra({...infra, pgRestRoom: v})} options={["Available", "Not Available", "--"]} /></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 3 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={3} />
            <div className="pl-8 mt-3 text-[10.5pt]">
              <p className="font-bold mb-1 flex"><span className="w-8">c.</span><span>Seminar room</span></p>
              <div className="pl-8 mb-4">
                <div className="flex mb-1"><span className="w-36">Space and facility:</span><span className="w-64"><InlineSelect value={infra.seminarSpace} onChange={(v:string)=>setInfra({...infra, seminarSpace: v})} options={["Adequate", "Not Adequate", "--"]} /></span></div>
                <div className="flex mb-1"><span className="w-36">Internet facility:</span><span className="w-64"><InlineSelect value={infra.internet} onChange={(v:string)=>setInfra({...infra, internet: v})} options={["Available", "Not Available", "--"]} /></span></div>
                <div className="flex mb-1"><span className="w-56">Audiovisual equipment details:</span><span className="flex-1 border-b border-transparent hover:border-slate-300"><InlineInput value={infra.audioVisual} onChange={(v:string)=>setInfra({...infra, audioVisual: v})} /></span></div>
              </div>

              <p className="font-bold mb-2 flex"><span className="w-8">d.</span><span>Library facility pertaining to the Department/Speciality (Combined Departmental and Central Library data):</span></p>
              <div className="pl-8 mb-2 w-full">
                <table className="nmc-table tight-table text-[10pt] w-full">
                  <thead><tr><th className="w-[60%]">Particulars</th><th>Details</th></tr></thead>
                  <tbody>
                    <tr><td>Number of Books</td><td><InlineInput value={infra.libBooks} onChange={(v:string)=>setInfra({...infra, libBooks: v})} /></td></tr>
                    <tr><td>Total books purchased in the last three years (attach list as Annexure)</td><td><InlineInput value={infra.libPurchased} onChange={(v:string)=>setInfra({...infra, libPurchased: v})} /></td></tr>
                    <tr><td>Total Indian Journals available</td><td><InlineInput value={infra.libIndian} onChange={(v:string)=>setInfra({...infra, libIndian: v})} /></td></tr>
                    <tr><td>Total Foreign Journals available</td><td><InlineInput value={infra.libForeign} onChange={(v:string)=>setInfra({...infra, libForeign: v})} /></td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pl-8 mb-3">
                <div className="flex mb-1"><span className="w-48">Internet Facility:</span><span className="w-40 text-center"><InlineSelect value={infra.libInternet} onChange={(v:string)=>setInfra({...infra, libInternet: v})} options={["Yes", "No"]} className="text-center" /></span></div>
                <div className="flex mb-1"><span className="w-48">Central Library Timing:</span><span className="w-48 border-b border-black"><InlineInput value={infra.libCentralTiming} onChange={(v:string)=>setInfra({...infra, libCentralTiming: v})} /></span></div>
                <div className="flex mb-1"><span className="w-56">Central Reading Room Timing:</span><span className="w-40 border-b border-black"><InlineInput value={infra.libReadingTiming} onChange={(v:string)=>setInfra({...infra, libReadingTiming: v})} /></span></div>
              </div>

              <div className="pl-8 mb-3">
                <p className="font-bold mb-1">Journal details</p>
                <table className="nmc-table tight-table text-[10pt] w-full">
                  <thead><tr><th className="w-1/2">Name of Journal</th><th>Indian/foreign</th><th>Online/offline</th><th>Available up to</th><th className="w-10 no-print"></th></tr></thead>
                  <tbody>
                    {journals.map(j => (
                      <tr key={j.id}>
                        <td><InlineInput value={j.name} onChange={(v:string)=>updateRow(setJournals, j.id, 'name', v)} /></td>
                        <td>
                          <InlineSelect 
                            value={j.indian} 
                            onChange={(v:string)=>updateRow(setJournals, j.id, 'indian', v)} 
                            options={["Indian", "Foreign"]} 
                            className="text-center"
                          />
                        </td>
                        <td>
                          <InlineSelect 
                            value={j.online} 
                            onChange={(v:string)=>updateRow(setJournals, j.id, 'online', v)} 
                            options={["Online", "Offline"]} 
                            className="text-center"
                          />
                        </td>
                        <td className="text-center"><InlineInput value={j.available} onChange={(v:string)=>updateRow(setJournals, j.id, 'available', v)} className="text-center" /></td>
                        <td className="no-print text-center">
                          <button 
                            className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                            onClick={() => removeRow(setJournals, j.id)}
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  className="no-print text-indigo-600 hover:text-indigo-800 text-sm mt-1 flex items-center" 
                  onClick={() => addRow(setJournals, () => ({ id: generateId(), name: '', indian: '', online: '', available: '' }))}
                >
                  <Plus className="w-4 h-4 mr-1"/> Add Record
                </button>
              </div>

              <p className="font-bold mb-1 mt-4 flex"><span className="w-8">e.</span><span>Departmental Research Lab:</span></p>
              <div className="pl-8 w-full">
                <table className="nmc-table tight-table text-[10pt] w-full">
                  <tbody>
                    <tr><td className="w-1/2">Space</td><td><InlineInput value={infra.resSpace} onChange={(v:string)=>setInfra({...infra, resSpace: v})} onBlur={() => setInfra({...infra, resSpace: formatAreaOnBlur(infra.resSpace)})} /></td></tr>
                    <tr><td>Equipment</td><td><InlineTextarea value={infra.resEquip} onChange={(v:string)=>setInfra({...infra, resEquip: v})} /></td></tr>
                    <tr><td>Research Projects Done in past 3 years</td><td><InlineTextarea value={infra.resPast} onChange={(v:string)=>setInfra({...infra, resPast: v})} /></td></tr>
                    <tr><td>list Research projects in progress in research lab</td><td><InlineTextarea value={infra.resProgress} onChange={(v:string)=>setInfra({...infra, resProgress: v})} /></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 4 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={4} />
            <div className="pl-8 mt-3 text-[10.5pt]">
              <p className="font-bold mb-1 flex"><span className="w-8">f.</span><span>Departmental Museum:</span></p>
              <div className="pl-8 w-full mb-3">
                <table className="nmc-table tight-table text-[10pt] w-full">
                  <tbody>
                    <tr><td className="w-1/2">Space</td><td><InlineInput value={infra.museumSpace} onChange={(v:string)=>setInfra({...infra, museumSpace: v})} onBlur={() => setInfra({...infra, museumSpace: formatAreaOnBlur(infra.museumSpace)})} /></td></tr>
                    <tr><td>Total number of Specimens</td><td><InlineInput value={infra.museumSpecimens} onChange={(v:string)=>setInfra({...infra, museumSpecimens: v})} /></td></tr>
                    <tr><td>Total number of Chart/ Diagrams</td><td><InlineInput value={infra.museumCharts} onChange={(v:string)=>setInfra({...infra, museumCharts: v})} /></td></tr>
                  </tbody>
                </table>
              </div>

              <p className="font-bold mb-2 mt-4 flex"><span className="w-8">g.</span><span>Equipment:</span></p>
              <table className="nmc-table tight-table text-[9.5pt] w-[95%] ml-4">
                <thead>
                  <tr>
                    <th className="w-[26%]">Equipment name</th>
                    <th className="w-[16%]">Numbers<br/>available</th>
                    <th className="w-[14%]">Functional<br/>status</th>
                    <th className="w-[32%]">Important<br/>Specification in Brief</th>
                    <th className="w-[12%]">Adequate<br/>Yes/No</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((eq, idx) => {
                    const isStandard = idx < 12;
                    return (
                      <tr key={eq.id}>
                        <td>
                          {isStandard ? (
                            <span className="font-bold px-1 py-0.5 block whitespace-pre-wrap">{eq.name}</span>
                          ) : (
                            <InlineTextarea value={eq.name} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'name', v)} />
                          )}
                        </td>
                        <td><InlineTextarea value={eq.available} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'available', v)} /></td>
                        <td><InlineTextarea value={eq.functional} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'functional', v)} /></td>
                        <td><InlineTextarea value={eq.specs} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'specs', v)} /></td>
                        <td>
                          {isStandard ? (
                            <InlineSelect value={eq.adequate} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'adequate', v)} options={["Yes", "No"]} />
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <InlineSelect value={eq.adequate} onChange={(v:string)=>updateRow(setEquipments, eq.id, 'adequate', v)} options={["Yes", "No"]} />
                              </div>
                              <button 
                                className="no-print text-red-500 hover:text-red-700 p-1 flex items-center justify-center shrink-0"
                                onClick={() => removeRow(setEquipments, eq.id)}
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button className="no-print text-indigo-600 text-sm mb-2 ml-4 flex items-center" onClick={()=>addRow(setEquipments, ()=>({id:generateId(), name:'', available:'', functional:'', specs:'', adequate:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>

              <p className="font-bold mb-2 mt-4 flex"><span className="w-8">h.</span><span>Intensive care facilities under Anaesthesia department</span></p>
              <table className="nmc-table tight-table text-[9.5pt] w-[95%] ml-4 mb-2">
                <thead>
                  <tr>
                    <th rowSpan={2} className="w-1/4">Name of ICU</th>
                    <th rowSpan={2} className="w-20">Number of beds</th>
                    <th colSpan={4}>Bed occupancy</th>
                  </tr>
                  <tr>
                    <th className="w-24">Bed occupancy on the day of inspection</th>
                    <th>Average bed occupancy per day for the year 1</th>
                    <th>Average bed occupancy per day for the year 2</th>
                    <th>Average bed occupancy per day for the year 3 (last year)</th>
                  </tr>
                </thead>
                <tbody>
                  {icus.map(icu => (
                    <tr key={icu.id}>
                      <td><InlineInput value={icu.name} onChange={(v:string)=>updateRow(setIcus, icu.id, 'name', v)} /></td>
                      <td className="text-center"><StackedInput value={icu.beds} onChange={(v:string)=>updateRow(setIcus, icu.id, 'beds', v)} className="text-center" /></td>
                      <td className="text-center"><StackedInput value={icu.occDay} onChange={(v:string)=>updateRow(setIcus, icu.id, 'occDay', v)} className="text-center" /></td>
                      <td className="text-center"><StackedInput value={icu.occYr1} onChange={(v:string)=>updateRow(setIcus, icu.id, 'occYr1', v)} className="text-center" /></td>
                      <td className="text-center"><StackedInput value={icu.occYr2} onChange={(v:string)=>updateRow(setIcus, icu.id, 'occYr2', v)} className="text-center" /></td>
                      <td className="text-center"><StackedInput value={icu.occYr3} onChange={(v:string)=>updateRow(setIcus, icu.id, 'occYr3', v)} className="text-center" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 5 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={5} />
            <div className="pl-12 w-full text-[10.5pt] mt-3">
              <p className="font-bold mb-2 flex"><span className="w-8">i.</span><span>Equipment in ICU (Required with each Intensive Care Unit Bed)</span></p>
              <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
                <thead><tr><th className="w-[45%]">Item</th><th className="w-16">Number</th><th className="w-20">Available/Not<br/>Available</th><th className="w-20">Functional<br/>Status</th><th>Remarks</th></tr></thead>
                <tbody>
                  {icuEquips.map((eq, idx) => {
                    const isStandard = idx < 6;
                    return (
                      <tr key={eq.id}>
                        <td>
                          {isStandard ? (
                            renderFormattedItemText(eq.item)
                          ) : (
                            <InlineTextarea value={eq.item} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'item', v)} />
                          )}
                        </td>
                        <td className="font-bold text-center"><InlineTextarea value={eq.num} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'num', v)} /></td>
                        <td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'available', v)} options={["Available", "Not Available", "--"]} /></td>
                        <td><InlineTextarea value={eq.functional} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'functional', v)} /></td>
                        <td>
                          {isStandard ? (
                            <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'remarks', v)} />
                          ) : (
                            <div className="flex items-start gap-1">
                              <div className="flex-1">
                                <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setIcuEquips, eq.id, 'remarks', v)} />
                              </div>
                              <button 
                                className="no-print text-red-500 hover:text-red-700 p-1 flex items-center justify-center shrink-0"
                                onClick={() => removeRow(setIcuEquips, eq.id)}
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button 
                className="no-print text-indigo-600 text-sm mb-2 flex items-center" 
                onClick={() => addRow(setIcuEquips, () => ({ id: generateId(), item: '', num: '', available: '', functional: '', remarks: '' }))}
              >
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>

              <p className="font-bold mb-2 mt-4 flex"><span className="w-8">j.</span><span>Other Equipment required in the ICU Facility</span></p>
              <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
                <thead><tr><th className="w-[45%]">Item</th><th className="w-16">Number</th><th className="w-20">Available/Not<br/>Available</th><th className="w-20">Functional<br/>Status</th><th>Remarks</th></tr></thead>
                <tbody>
                  {otherIcuEquips.map((eq, idx) => {
                    const isStandard = idx < 9;
                    return (
                      <tr key={eq.id}>
                        <td>
                          {isStandard ? (
                            renderFormattedItemText(eq.item)
                          ) : (
                            <InlineTextarea value={eq.item} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'item', v)} />
                          )}
                        </td>
                        <td><InlineTextarea value={eq.num} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'num', v)} /></td>
                        <td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'available', v)} options={["Available", "Not Available", "--"]} /></td>
                        <td><InlineTextarea value={eq.functional} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'functional', v)} /></td>
                        <td>
                          {isStandard ? (
                            <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'remarks', v)} />
                          ) : (
                            <div className="flex items-start gap-1">
                              <div className="flex-1">
                                <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setOtherIcuEquips, eq.id, 'remarks', v)} />
                              </div>
                              <button 
                                className="no-print text-red-500 hover:text-red-700 p-1 flex items-center justify-center shrink-0"
                                onClick={() => removeRow(setOtherIcuEquips, eq.id)}
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button 
                className="no-print text-indigo-600 text-sm mb-2 flex items-center" 
                onClick={() => addRow(setOtherIcuEquips, () => ({ id: generateId(), item: '', num: '', available: '', functional: '', remarks: '' }))}
              >
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>

              <div className="flex mb-2 mt-4 font-bold items-start">
                <div className="w-[320px] shrink-0 leading-tight">
                  Nurse patient ratio in ICU
                  <div className="font-normal text-[9pt] text-slate-600">(Min 1:2 required)</div>
                </div>
                <div className="flex items-center flex-1 min-w-0">
                  <span className="mr-2 whitespace-nowrap">Available Ratio =</span>
                  <span className="border-b border-black flex-1">
                    <InlineInput value={infra.icuRatioNurse} onChange={(v:string)=>setInfra({...infra, icuRatioNurse: v})} />
                  </span>
                </div>
              </div>
              <div className="flex mb-4 font-bold items-start">
                <div className="w-[320px] shrink-0 leading-tight">
                  Doctor patient ratio
                  <div className="font-normal text-[9pt] text-slate-600">(Min 1:6 required)</div>
                </div>
                <div className="flex items-center flex-1 min-w-0">
                  <span className="mr-2 whitespace-nowrap">Available Ratio =</span>
                  <span className="border-b border-black flex-1">
                    <InlineInput value={infra.icuRatioDoctor} onChange={(v:string)=>setInfra({...infra, icuRatioDoctor: v})} />
                  </span>
                </div>
              </div>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 6 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={6} />
            <div className="pl-12 pr-4 w-full text-[10.5pt] mt-2 space-y-4">

              <div>
                <p className="font-bold mb-2 flex"><span className="w-8">k.</span><span>Equipments required with each High Dependency Unit (HDU)/Step down ICU Bed</span></p>
                <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
                  <thead>
                    <tr><th className="w-[40%]">Item</th><th className="w-16">Number per<br/><span className="line-through">ICU bed</span><br/>Number</th><th className="w-24">Available/Not<br/>Available</th><th className="w-20">Functional<br/>Status</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {hduEquips.map((eq, idx) => {
                      const isStandard = idx < 5;
                      return (
                        <tr key={eq.id}>
                          <td>
                            {isStandard ? (
                              renderFormattedItemText(eq.item)
                            ) : (
                              <InlineTextarea value={eq.item} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'item', v)} />
                            )}
                          </td>
                          <td className="font-bold text-center"><InlineTextarea value={eq.num} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'num', v)} /></td>
                          <td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'available', v)} options={["Available", "Not Available", "--"]} /></td>
                          <td><InlineTextarea value={eq.functional} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'functional', v)} /></td>
                          <td>
                            {isStandard ? (
                              <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'remarks', v)} />
                            ) : (
                              <div className="flex items-start gap-1">
                                <div className="flex-1">
                                  <InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setHduEquips, eq.id, 'remarks', v)} />
                                </div>
                                <button 
                                  className="no-print text-red-500 hover:text-red-700 p-1 flex items-center justify-center shrink-0"
                                  onClick={() => removeRow(setHduEquips, eq.id)}
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button 
                  className="no-print text-indigo-600 text-sm mb-2 flex items-center" 
                  onClick={() => addRow(setHduEquips, () => ({ id: generateId(), item: '', num: '', available: '', functional: '', remarks: '' }))}
                >
                  <Plus className="w-4 h-4 mr-1"/> Add Record
                </button>
              </div>

              <div>
                <p className="font-bold mb-2 flex"><span className="w-8">l.</span><span>Other Equipment required in the HDU/Step down ICU Facility</span></p>
                <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
                  <thead>
                    <tr><th className="w-[40%]">Item</th><th className="w-16">Number</th><th className="w-24">Available/Not<br/>Available</th><th className="w-20">Functional<br/>Status</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {otherHduEquips.map(eq => (
                      <tr key={eq.id}>
                        <td className="whitespace-pre-wrap">{renderFormattedItemText(eq.item)}</td>
                        <td><InlineTextarea value={eq.num} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, 'num', v)} /></td>
                        <td><InlineSelect value={eq.available} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, 'available', v)} options={["Available", "Not Available", "--"]} /></td>
                        <td><InlineTextarea value={eq.functional} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, 'functional', v)} /></td>
                        <td><InlineTextarea value={eq.remarks} onChange={(v:string)=>updateRow(setOtherHduEquips, eq.id, 'remarks', v)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex mb-2 font-bold items-start">
                  <div className="w-[320px] shrink-0 leading-tight">
                    Nurse patient ratio in HDU/Step down ICU
                    <div className="font-normal text-[9pt] text-slate-600">(Min 1:3 required)</div>
                  </div>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="mr-2 whitespace-nowrap">Available Ratio =</span>
                    <span className="border-b border-black flex-1">
                      <InlineInput value={infra.hduRatioNurse} onChange={(v:string)=>setInfra({...infra, hduRatioNurse: v})} />
                    </span>
                  </div>
                </div>
                <div className="flex mb-4 font-bold items-start">
                  <div className="w-[320px] shrink-0 leading-tight">
                    Doctor patient ratio in HDU/Step down ICU
                    <div className="font-normal text-[9pt] text-slate-600">(Min 1:8 required)</div>
                  </div>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="mr-2 whitespace-nowrap">Available Ratio =</span>
                    <span className="border-b border-black flex-1">
                      <InlineInput value={infra.hduRatioDoctor} onChange={(v:string)=>setInfra({...infra, hduRatioDoctor: v})} />
                    </span>
                  </div>
                </div>
              </div>

            </div>
            <PageFooter />
          </div>

          {/* PAGE 7 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={7} />
            <div className="pl-12 pr-4 w-full -mt-2 text-[10.5pt]">
              <h4 className="font-bold text-[12pt] mb-1.5 mt-4 flex"><span className="w-8">C.</span><span>SERVICES:</span></h4>
              <p className="font-bold mb-1 flex"><span className="w-6">i.</span><span>Specialty clinics run by the department of Anaesthesia with number of patients in each:</span></p>
              
              <datalist id="doctor-names">
                {firestoreDoctors.map(d => (
                  <option key={d.id} value={`${d.title || 'Dr.'} ${d.first_name} ${d.middle_name ? d.middle_name + ' ' : ''}${d.last_name}`} />
                ))}
              </datalist>

              <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
                <thead>
                  <tr><th className="w-[30%] text-left pl-2">Name of the Clinic</th><th className="w-[12%]">Weekday/s</th><th className="w-[12%]">Timings</th><th className="w-[12%]">Average<br/>cases/days</th><th className="w-[34%] text-left pl-2">Name of Clinic In-charge</th></tr>
                </thead>
                <tbody>
                  {clinics.map((c, i) => {
                    const isStandard = i < 2;
                    return (
                      <tr key={c.id}>
                        <td className="pl-2">
                          {isStandard ? (
                            <span>{i+1}) {c.name}</span>
                          ) : (
                            <div className="flex items-start gap-1">
                              <span className="shrink-0">{i+1})&nbsp;</span>
                              <div className="flex-1">
                                <InlineTextarea value={c.name} onChange={(v:string)=>updateRow(setClinics, c.id, 'name', v)} />
                              </div>
                            </div>
                          )}
                        </td>
                        <td><InlineTextarea value={c.days} onChange={(v:string)=>updateRow(setClinics, c.id, 'days', v)} /></td>
                        <td><InlineTextarea value={c.timings} onChange={(v:string)=>updateRow(setClinics, c.id, 'timings', v)} /></td>
                        <td><InlineTextarea value={c.cases} onChange={(v:string)=>updateRow(setClinics, c.id, 'cases', v)} /></td>
                        {isStandard ? (
                          i === 0 ? (
                            <td rowSpan={2} className="align-middle px-1 py-1">
                              <MultiDoctorInput
                                value={clinics[0].incharge}
                                onChange={(v: string) => {
                                  updateRow(setClinics, clinics[0].id, 'incharge', v);
                                  if (clinics[1]) updateRow(setClinics, clinics[1].id, 'incharge', v);
                                }}
                                datalistId="doctor-names"
                              />
                            </td>
                          ) : null
                        ) : (
                          <td className="px-1 py-1">
                            <div className="flex items-start gap-1">
                              <div className="flex-1">
                                <MultiDoctorInput value={c.incharge} onChange={(v:string)=>updateRow(setClinics, c.id, 'incharge', v)} datalistId="doctor-names" />
                              </div>
                              <button 
                                className="no-print text-red-500 hover:text-red-700 p-1 flex items-center justify-center shrink-0"
                                onClick={() => removeRow(setClinics, c.id)}
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button 
                className="no-print text-indigo-600 text-sm mb-2 flex items-center" 
                onClick={() => addRow(setClinics, () => ({ id: generateId(), name: '', days: '', timings: '', cases: '', incharge: '' }))}
              >
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>

              <h4 className="font-bold text-[12pt] mb-3 flex mt-4">
                <span className="w-8">D.</span>
                <span>CLINICAL MATERIAL AND INVESTIGATIVE WORKLOAD OF THE DEPARTMENT OF ANAESTHESIOLOGY</span>
              </h4>

              <table className="nmc-table tight-table text-[9.5pt] w-full">
                <thead>
                  <tr>
                    <th rowSpan={2} className="w-48 text-left pl-2">Parameter</th>
                    <th colSpan={5}>Total numbers</th>
                  </tr>
                  <tr>
                    <th className="w-24">Number on<br/>day of<br/>assessment</th>
                    <th className="w-24">Previous day<br/>data</th>
                    <th className="w-20">Year1<br/><span className="font-normal text-[8pt]">(2023)</span></th>
                    <th className="w-20">Year2<br/><span className="font-normal text-[8pt]">(2024)</span></th>
                    <th className="w-24">Year3 (last<br/>year)<br/><span className="font-normal text-[8pt]">(2025)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {clinicalMats.map((cm, idx) => {
                    const isGroupStart = !!cm.groupLabel;
                    const isGroupMember = !!cm.group && !cm.groupLabel;
                    const isGroupLast = !!cm.group && (idx === clinicalMats.length - 1 || !clinicalMats[idx + 1]?.group);
                    let groupSpan = 0;
                    if (isGroupStart) {
                      for (let k = idx; k < clinicalMats.length && clinicalMats[k].group === cm.group; k++) groupSpan++;
                    }
                    // Compute border style to erase inner dividers completely
                    let seamless: React.CSSProperties = {};
                    if (isGroupStart) {
                      seamless = { borderBottom: 'none' };
                    } else if (isGroupMember && isGroupLast) {
                      seamless = { borderTop: 'none' };
                    } else if (isGroupMember) {
                      seamless = { borderTop: 'none', borderBottom: 'none' };
                    }
                    return (
                      <tr key={cm.id}>
                        {isGroupStart ? (
                          <td rowSpan={groupSpan} className="pl-2 align-top whitespace-pre-wrap">
                            {'Anaesthesia procedures/techniques\n  \u2022 General Anaesthesia (GA)\n  \u2022 Central neuraxial blocks\n  \u2022 Nerve blocks\n  \u2022 GA + Regional Block\n  \u2022 Monitored Anaesthesia Care under Sedation\n  \u2022 Non-operating room anaesthesia (NORA)'}
                          </td>
                        ) : isGroupMember ? null : (
                          <td className="whitespace-pre-wrap pl-2">{cm.param}</td>
                        )}
                        <td style={seamless}><InlineInput value={cm.day} onChange={(v:string)=>updateRow(setClinicalMats, cm.id, 'day', v)} /></td>
                        <td style={seamless}><InlineInput value={cm.prev} onChange={(v:string)=>updateRow(setClinicalMats, cm.id, 'prev', v)} /></td>
                        <td style={seamless}><InlineInput value={cm.yr1} onChange={(v:string)=>updateRow(setClinicalMats, cm.id, 'yr1', v)} /></td>
                        <td style={seamless}><InlineInput value={cm.yr2} onChange={(v:string)=>updateRow(setClinicalMats, cm.id, 'yr2', v)} /></td>
                        <td style={seamless}><InlineInput value={cm.yr3} onChange={(v:string)=>updateRow(setClinicalMats, cm.id, 'yr3', v)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-8 px-8 text-[11pt] italic">
                <span className="font-bold">Note:</span> Please provide details of Clinical Material and Investigative Workload of the Department of Anaesthesiology in the above format for the last three years (Calendar Year).
              </div>
            </div>
            <PageFooter />
          </div>

          {/* PAGE 8+ (Landscape) — auto-paginating unit faculty table */}
          {facultyChunks.map((chunk, ci) => (
            <div key={`faculty-page-${ci}`} className="a4-page landscape-page print-page relative">
              <PageHeader pageNum={8 + ci} />
              {ci === 0 ? (
                <>
                  <h4 className="font-bold text-[12pt] mb-2 flex pl-16">
                    <span className="w-12">E.</span>
                    <span>STAFF:</span>
                  </h4>
                  <p className="font-bold mb-1 pl-24 flex"><span className="w-8">i.</span><span>Unit-wise faculty and Senior Resident details:</span></p>
                  <div className="flex mb-2 pl-24 text-[11pt]">
                    <span className="w-20">Unit no:</span>
                    <span className="w-48 border-b border-black"><InlineInput value={staffUnitNo} onChange={setStaffUnitNo} /></span>
                  </div>
                </>
              ) : null}
              <div className="px-4 pb-16">
                <table className="nmc-table tight-table table-fixed text-[9pt] w-full">
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '8.5%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '8.5%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '8%' }} />
                    <col className="no-print" style={{ width: '3%' }} />
                  </colgroup>
                  {ci === 0 && (
                    <thead>
                      <tr>
                        <th>Sr.<br/>No.</th>
                        <th>Designation</th>
                        <th>Name</th>
                        <th>Joining<br/>date</th>
                        <th>Relieved/<br/>Retired/work<br/>ing</th>
                        <th>Relieving<br/>Date/<br/>Retirement<br/>Date</th>
                        <th>Attendance in<br/>days for the<br/>year/part of<br/>the year *<br/>with<br/>percentage of<br/>total working<br/>days**<br/>[days ( %)]</th>
                        <th>Phone No.</th>
                        <th>E-mail</th>
                        <th>Signature</th>
                        <th className="no-print"></th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {chunk.map((f, ci_row) => {
                      // Compute the global Sr. No. from the start index of this chunk
                      const chunkStart = ci === 0 ? 0 : FACULTY_FIRST + (ci - 1) * FACULTY_CONT;
                      const globalIdx = chunkStart + ci_row;
                      return (
                      <tr key={f.id} className="align-top">
                        <td className="text-center font-bold text-[9pt]">{globalIdx + 1}</td>
                        <td><InlineTextarea rows={1} value={f.designation} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'designation', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.name} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'name', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.joiningDate} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'joiningDate', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.relieved} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'relieved', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.relievingDate} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'relievingDate', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.attendance} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'attendance', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.phone} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'phone', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.email} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'email', v)} /></td>
                        <td><InlineTextarea rows={1} value={f.signature} onChange={(v:string)=>updateRow(setUnitFaculties, f.id, 'signature', v)} /></td>
                        <td className="no-print text-center">
                          <button
                            className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                            onClick={() => removeRow(setUnitFaculties, f.id)}
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Show Add Record + Import Doctors only on the last faculty page */}
                {ci === facultyChunks.length - 1 && (
                  <div className="no-print flex gap-3 mt-1 items-center">
                    <button
                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                      onClick={() => setUnitFaculties(prev => [...prev, {
                        id: generateId(),
                        designation: '', name: '', joiningDate: '', relieved: '',
                        relievingDate: '', attendance: '', phone: '', email: '', signature: ''
                      }])}
                    >
                      <Plus className="w-4 h-4 mr-1"/> Add Record
                    </button>
                    <button
                      className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1 border border-emerald-300 rounded px-2 py-0.5"
                      onClick={() => { setDoctorSearch(''); setSelectedDoctorIds(new Set()); setImportTarget('faculty'); }}
                    >
                      <Users className="w-4 h-4"/> Import from Doctors
                    </button>
                  </div>
                )}
                {ci === facultyChunks.length - 1 && (
                  <div className="px-4 text-[11pt] space-y-1 mt-4">
                    <p>* - Year will be previous Calendar Year (from 1st January to 31st December)</p>
                    <p>** - Those who have joined mid-way should count the percentage of the working days accordingly.</p>
                  </div>
                )}
              </div>
              <PageFooter />
            </div>
          ))}

          {/* PAGE 9+offset */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={pn(9)} />
            <p className="font-bold mb-4 flex pl-8 pr-4">
              <span className="w-8">ii.</span>
              <span className="text-justify">Total eligible faculties and Senior Residents (fulfilling the TEQ requirement, attendance requirement and other requirements prescribed by NMC from time-to-time) available in the department:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] ml-8 w-[92%] mb-2">
              <thead>
                <tr>
                  <th className="w-32 text-left pl-2">Designation</th>
                  <th className="w-16 text-left pl-2">Number</th>
                  <th className="w-64 text-left pl-2">Name</th>
                  <th className="w-28 text-left pl-2">Total<br/>number of<br/>Admission<br/>(Seats)</th>
                  <th className="w-40 text-left pl-2">Adequate / Not<br/>Adequate for<br/>number of<br/>Admission</th>
                  <th className="w-10 no-print"></th>
                </tr>
              </thead>
              <tbody>
                {eligibleFaculties.map((f, i) => (
                  <tr key={f.id} className="align-top">
                    <td><InlineTextarea rows={1} value={f.designation} onChange={(v:string)=>updateRow(setEligibleFaculties, f.id, 'designation', v)} /></td>
                    <td><InlineTextarea rows={1} value={f.num} onChange={(v:string)=>updateRow(setEligibleFaculties, f.id, 'num', v)} /></td>
                    <td className="relative group">
                      <InlineTextarea rows={1} value={f.name} onChange={(v:string)=>updateRow(setEligibleFaculties, f.id, 'name', v)} />
                      <button 
                        className="no-print absolute top-1 right-1 p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        onClick={() => {
                          setRowSelectedDoctorIds(new Set());
                          setRowDoctorModalId(f.id);
                        }}
                        title="Select Doctors from Faculty Table"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                    </td>
                    {i === 0 && (
                      <>
                        <td rowSpan={Math.max(1, eligibleFaculties.length)}><InlineTextarea className="h-full" value={f.seats} onChange={(v:string)=>updateRow(setEligibleFaculties, f.id, 'seats', v)} /></td>
                        <td rowSpan={Math.max(1, eligibleFaculties.length)}><InlineTextarea className="h-full" value={f.adequate} onChange={(v:string)=>updateRow(setEligibleFaculties, f.id, 'adequate', v)} /></td>
                      </>
                    )}
                    <td className="no-print text-center">
                      <button
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setEligibleFaculties, f.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="no-print flex gap-3 mt-1 ml-8 mb-2 items-center">
              <button
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                onClick={() => setEligibleFaculties(prev => [...prev, { id: generateId(), designation: '', num: '', name: '', seats: '', adequate: '' }])}
              >
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>
            </div>

            <p className="font-bold mb-2 flex pl-8">
              <span className="w-8">iii.</span>
              <span>P.G students presently studying in the Department:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] ml-8 w-[92%] mb-2">
              <thead>
                <tr><th className="w-48">Name</th><th className="w-32">Joining date</th><th className="w-32">Phone No</th><th>E-mail</th><th className="w-10 no-print"></th></tr>
              </thead>
              <tbody>
                {pgStudents.map(s => (
                  <tr key={s.id}>
                    <td><InlineInput value={s.name} onChange={(v:string)=>updateRow(setPgStudents, s.id, 'name', v)} /></td>
                    <td><InlineInput value={s.joiningDate} onChange={(v:string)=>updateRow(setPgStudents, s.id, 'joiningDate', v)} /></td>
                    <td><InlineInput value={s.phone} onChange={(v:string)=>updateRow(setPgStudents, s.id, 'phone', v)} /></td>
                    <td><InlineInput value={s.email} onChange={(v:string)=>updateRow(setPgStudents, s.id, 'email', v)} /></td>
                    <td className="no-print text-center">
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setPgStudents, s.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mb-6 ml-8 mt-2">
              <button className="no-print text-indigo-600 text-sm flex items-center" onClick={()=>addRow(setPgStudents, ()=>({id:generateId(), name:'', joiningDate:'', phone:'', email:''}))}>
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>
              <button className="no-print text-emerald-600 text-sm flex items-center border border-emerald-300 rounded px-2 py-0.5" onClick={() => { setDoctorSearch(''); setSelectedDoctorIds(new Set()); setImportTarget('pgStudying'); }}>
                <Users className="w-4 h-4 mr-1"/> Import from Doctors
              </button>
            </div>

            <p className="font-bold mb-2 flex pl-8">
              <span className="w-8">iv.</span>
              <span>PG students who completed their course in the last year:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] ml-8 w-[92%] mb-2">
              <thead>
                <tr><th className="w-48">Name</th><th className="w-24">Joining<br/>date</th><th className="w-24">Relieving<br/>Date</th><th className="w-28">Phone no</th><th>E-mail</th><th className="w-10 no-print"></th></tr>
              </thead>
              <tbody>
                {pastPgStudents.map(s => (
                  <tr key={s.id}>
                    <td><InlineInput value={s.name} onChange={(v:string)=>updateRow(setPastPgStudents, s.id, 'name', v)} /></td>
                    <td><InlineInput value={s.joiningDate} onChange={(v:string)=>updateRow(setPastPgStudents, s.id, 'joiningDate', v)} /></td>
                    <td><InlineInput value={s.relievingDate} onChange={(v:string)=>updateRow(setPastPgStudents, s.id, 'relievingDate', v)} /></td>
                    <td><InlineInput value={s.phone} onChange={(v:string)=>updateRow(setPastPgStudents, s.id, 'phone', v)} /></td>
                    <td><InlineInput value={s.email} onChange={(v:string)=>updateRow(setPastPgStudents, s.id, 'email', v)} /></td>
                    <td className="no-print text-center">
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setPastPgStudents, s.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mb-8 ml-8 mt-2">
              <button className="no-print text-indigo-600 text-sm flex items-center" onClick={()=>addRow(setPastPgStudents, ()=>({id:generateId(), name:'', joiningDate:'', relievingDate:'', phone:'', email:''}))}>
                <Plus className="w-4 h-4 mr-1"/> Add Record
              </button>
              <button className="no-print text-emerald-600 text-sm flex items-center border border-emerald-300 rounded px-2 py-0.5" onClick={() => { setDoctorSearch(''); setSelectedDoctorIds(new Set()); setImportTarget('pgCompleted'); }}>
                <Users className="w-4 h-4 mr-1"/> Import from Doctors
              </button>
            </div>

            <h4 className="font-bold text-[12pt] mb-4 flex pl-8">
              <span className="w-8">F.</span>
              <span>ACADEMIC ACTIVITIES:</span>
            </h4>
            <table className="nmc-table tight-table text-[10pt] ml-8 w-[90%]">
              <thead>
                <tr><th className="w-12 text-left pl-2">S.<br/>No.</th><th className="w-64 text-left pl-2">Details</th><th className="w-32">Number in the last<br/>Year</th><th>Remarks<br/>Adequate/ Inadequate</th></tr>
              </thead>
              <tbody>
                {academicActivities.slice(0, 3).map((a, i) => (
                  <tr key={a.id}>
                    <td className="pl-2">{i+1}.</td>
                    <td className="pl-2">{a.name}</td>
                    <td><InlineInput value={a.count} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, 'count', v)} /></td>
                    <td><InlineSelect value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, 'remarks', v)} options={["Adequate", "Inadequate"]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PageFooter />
          </div>

          {/* PAGE 11 */}
          <div className="a4-page portrait-page print-page">
            <PageHeader pageNum={pn(10)} />
            <div className="pl-8 pr-4 w-full -mt-2 text-[10.5pt]">
              <table className="nmc-table tight-table text-[10pt] border-t-0 mb-2 w-full ml-8">
                <tbody>
                {academicActivities.slice(3).map((a, i) => (
                  <tr key={a.id}>
                    <td className="w-12 border-t-0 pl-2">{i+4}.</td>
                    <td className="w-64 border-t-0 whitespace-pre-wrap pl-2">{a.name}</td>
                    <td className="w-32 border-t-0"><InlineInput value={a.count} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, 'count', v)} /></td>
                    <td className="border-t-0"><InlineSelect value={a.remarks} onChange={(v:string)=>updateRow(setAcademicActivities, a.id, 'remarks', v)} options={["Adequate", "Inadequate"]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pl-8 pr-4 text-[10.5pt] mb-6 italic flex">
              <span className="font-bold mr-2">Note:</span>
              <span className="text-justify">For Seminars, Journal Clubs, Case presentations, Guest Lectures the details of dates, subjects, name & designations of teachers and attendance sheets to be maintained by the institution and to be produced on request by the Assessors/PGMEB.</span>
            </div>

            <div className="pl-8 mb-4">
              <p className="font-bold mb-1">Publications from the department during the past 3 years:</p>
              <div className="border border-black h-24 p-2">
                <InlineTextarea value={publicationsList} onChange={setPublicationsList} className="h-full w-full" rows={4} />
              </div>
            </div>

            <h4 className="font-bold text-[12pt] mb-2 flex pl-8">
              <span className="w-8">G.</span>
              <span>EXAMINATION:</span>
            </h4>
            
            <p className="font-bold mb-1 flex pl-8">
              <span className="w-6">i.</span>
              <span>Periodic Evaluation methods (FORMATIVE ASSESSMENT):</span>
            </p>
            <p className="pl-14 mb-2 text-[10pt]">(Details in the space below)</p>
            <div className="pl-14 w-[90%] mb-2">
              <InlineTextarea value={formativeAssessment} onChange={setFormativeAssessment} rows={3} />
            </div>

            <p className="font-bold mb-3 flex pl-8 mt-4">
              <span className="w-8">ii.</span>
              <span>Detail of the Last Summative Examination:</span>
            </p>
            
            <p className="font-bold mb-2 flex pl-16">
              <span className="w-8">a.</span>
              <span>List of External Examiners:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] w-[90%] ml-8 mb-2">
              <thead>
                <tr><th className="w-1/3">Name</th><th className="w-1/3">Designation</th><th className="w-1/3">College/ Institute</th><th className="w-10 no-print"></th></tr>
              </thead>
              <tbody>
                {externalExaminers.map(e => (
                  <tr key={e.id}>
                    <td><InlineInput value={e.name} onChange={(v:string)=>updateRow(setExternalExaminers, e.id, 'name', v)} /></td>
                    <td><InlineInput value={e.designation} onChange={(v:string)=>updateRow(setExternalExaminers, e.id, 'designation', v)} /></td>
                    <td><InlineInput value={e.institute} onChange={(v:string)=>updateRow(setExternalExaminers, e.id, 'institute', v)} /></td>
                    <td className="no-print text-center">
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setExternalExaminers, e.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="no-print text-indigo-600 text-sm mb-2 ml-8 flex items-center -mt-1" onClick={()=>addRow(setExternalExaminers, ()=>({id:generateId(), name:'', designation:'', institute:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>

            </div>
            <PageFooter />
          </div>

          {/* PAGE 12 */}
          <div className="a4-page portrait-page print-page relative">
            <PageHeader pageNum={pn(11)} />
            <div className="pl-8 pr-4 w-full -mt-2 text-[10.5pt]">

            <p className="font-bold mb-2 flex pl-16">
              <span className="w-8">b.</span>
              <span>List of Internal Examiners:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] w-[90%] ml-8 mb-2">
              <thead>
                <tr><th className="w-1/2">Name</th><th className="w-1/2">Designation</th><th className="w-10 no-print"></th></tr>
              </thead>
              <tbody>
                {internalExaminers.map(e => (
                  <tr key={e.id}>
                    <td><InlineInput value={e.name} onChange={(v:string)=>updateRow(setInternalExaminers, e.id, 'name', v)} /></td>
                    <td><InlineInput value={e.designation} onChange={(v:string)=>updateRow(setInternalExaminers, e.id, 'designation', v)} /></td>
                    <td className="no-print text-center">
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setInternalExaminers, e.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="no-print text-indigo-600 text-sm mb-2 ml-8 flex items-center -mt-1" onClick={()=>addRow(setInternalExaminers, ()=>({id:generateId(), name:'', designation:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>

            <p className="font-bold mb-2 flex pl-16">
              <span className="w-8">c.</span>
              <span>List of Students:</span>
            </p>
            <table className="nmc-table tight-table text-[10pt] w-[90%] ml-8 mb-2">
              <thead>
                <tr><th className="w-1/2">Name</th><th className="w-1/2">Result<br/>(Pass/ Fail)</th><th className="w-10 no-print"></th></tr>
              </thead>
              <tbody>
                {examStudents.map(e => (
                  <tr key={e.id}>
                    <td><InlineInput value={e.name} onChange={(v:string)=>updateRow(setExamStudents, e.id, 'name', v)} /></td>
                    <td className="text-center"><InlineInput value={e.result} className="text-center" onChange={(v:string)=>updateRow(setExamStudents, e.id, 'result', v)} /></td>
                    <td className="no-print text-center">
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center w-full h-full"
                        onClick={() => removeRow(setExamStudents, e.id)}
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="no-print text-indigo-600 text-sm mb-2 ml-8 flex items-center -mt-1" onClick={()=>addRow(setExamStudents, ()=>({id:generateId(), name:'', result:''}))}><Plus className="w-4 h-4 mr-1"/> Add Record</button>

            <div className="flex mb-4 pl-16 font-bold">
              <span className="w-8">d.</span>
              <div className="flex-1">
                <div className="flex mb-1">
                  <span className="w-56 whitespace-nowrap">Details of the Examination:</span>
                  <span className="border-b border-black w-96 mr-8"><InlineInput value={examDetails} onChange={setExamDetails} /></span>
                </div>
                <div className="font-normal text-[11pt]">Insert video clip (5 minutes) and photographs (ten).</div>
              </div>
            </div>
            </div>

            <PageFooter />
          </div>


          {/* PAGE 13 */}
          <div className="a4-page portrait-page print-page relative">
            <PageHeader pageNum={pn(12)} />
            <div className="pl-8 pr-4 w-full -mt-2 text-[10.5pt]">
              <h4 className="font-bold text-[12pt] mb-3 flex pl-8">
                <span className="w-8">H.</span>
                <span>MISCELLANEOUS:</span>
              </h4>
              
              <p className="font-bold mb-1 flex pl-16">
                <span className="w-6">i.</span>
                <span>Details of data being submitted to government authorities, if any:</span>
              </p>
              <div className="pl-24 w-full mb-4">
                <InlineTextarea value={miscData.govt} onChange={(v:string)=>setMiscData({...miscData, govt: v})} rows={2} />
              </div>

              <p className="font-bold mb-1 flex pl-16">
                <span className="w-8">ii.</span>
                <span>Participation in National Programs. (If yes, provide details)</span>
              </p>
              <div className="pl-24 w-full mb-4">
                <InlineTextarea value={miscData.national} onChange={(v:string)=>setMiscData({...miscData, national: v})} rows={2} />
              </div>

              <p className="font-bold mb-1 flex pl-16">
                <span className="w-8">iii.</span>
                <span>Any Other Information</span>
              </p>
              <div className="pl-24 w-full mb-6">
                <InlineTextarea value={miscData.other} onChange={(v:string)=>setMiscData({...miscData, other: v})} rows={2} />
              </div>

              <p className="font-bold flex mb-3 pl-8">
                <span className="w-8">I.</span>
                <span>Please enumerate the deficiencies and write measures which are being taken to rectify those deficiencies:</span>
              </p>
              <div className="pl-16 w-full mb-6">
                <InlineTextarea value={miscData.defic} onChange={(v:string)=>setMiscData({...miscData, defic: v})} rows={10} />
              </div>
            </div>

            <div className="flex justify-between text-[11pt] font-bold mt-20 px-8">
              <div className="flex">
                <span className="w-16">Date:</span>
                <span className="border-b border-black w-32">&nbsp;</span>
              </div>
              <div>Signature of Dean with Seal</div>
              <div>Signature of HoD with Seal</div>
            </div>

            <PageFooter />
          </div>

          {/* PAGE 14 */}
          <div className="a4-page portrait-page print-page relative">
            <PageHeader pageNum={pn(13)} />
            <div className="pl-8 pr-8">
              <p className="font-bold flex mb-6 text-[12pt]">
                <span className="w-12">J.</span>
                <span className="underline underline-offset-4 decoration-[1.5px] text-center w-full block -ml-12">REMARKS OF THE ASSESSOR</span>
              </p>

              <div className="border border-black p-2 pl-6 pr-4 mb-8 italic text-[11pt]">
                <ol className="list-decimal space-y-1 m-0">
                  <li>Please <strong>DO NOT</strong> repeat information already provided elsewhere in this form.</li>
                  <li>Please <strong>DO NOT</strong> make any recommendation regarding grant of permission/recognition.</li>
                  <li className="text-justify">Please <strong>PROVIDE DETAILS</strong> of deficiencies and irregularities like fake/ dummy faculty, fake/dummy patients, fabrication/falsification of data of clinical material, etc. if any that you have noticed/came across, during the assessment. Please attach the table of list of the patients (IP no., diagnosis and comments) available on the day of the assessment/inspection.</li>
                  <li>Please comment on the infrastructure, variety of clinical material for the all-round training of the students.</li>
                </ol>
              </div>

              <div className="min-h-[400px]">
                <InlineTextarea value={assessorRemarks} onChange={setAssessorRemarks} rows={20} />
              </div>
            </div>

            <PageFooter />
          </div>

        </div>

        {/* ── Doctor Import Modal ──────────────────────────────────────── */}
        {importTarget && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" /> Import from Doctors
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {importTarget === 'faculty' ? 'Select doctors/SRs to auto-fill in the faculty table' : 'Select Junior/Senior Residents'}
                  </p>
                </div>
                <button onClick={() => setImportTarget(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Search */}
              <div className="px-6 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name or designation..."
                    value={doctorSearch}
                    onChange={e => setDoctorSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>
              {/* Select All */}
              <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-emerald-600"
                    checked={filteredFirestoreDoctors.length > 0 && filteredFirestoreDoctors.every(d => selectedDoctorIds.has(d.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedDoctorIds(new Set(filteredFirestoreDoctors.map(d => d.id)));
                      } else {
                        setSelectedDoctorIds(new Set());
                      }
                    }}
                  />
                  Select all ({filteredFirestoreDoctors.length})
                </label>
                <span className="text-xs text-emerald-600 font-medium">{selectedDoctorIds.size} selected</span>
              </div>
              {/* Doctor List */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {filteredFirestoreDoctors.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    {firestoreDoctors.length === 0 ? 'Loading doctors...' : 'No doctors match your search'}
                  </div>
                ) : (
                  filteredFirestoreDoctors.map(d => {
                    const fullName = `${d.title || 'Dr.'} ${d.first_name || ''} ${d.middle_name || ''} ${d.last_name || ''}`.replace(/\s+/g, ' ').trim();
                    const isSelected = selectedDoctorIds.has(d.id);
                    const desigColors: Record<string, string> = {
                      'Professor and Head': 'bg-purple-100 text-purple-700',
                      'Associate Professor': 'bg-blue-100 text-blue-700',
                      'Assistant Professor': 'bg-emerald-100 text-emerald-700',
                      'Senior Resident': 'bg-amber-100 text-amber-700',
                    };
                    const badge = desigColors[d.designation] || 'bg-slate-100 text-slate-600';
                    return (
                      <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl mb-1 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedDoctorIds(prev => {
                              const next = new Set(prev);
                              if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                              return next;
                            });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate">{fullName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{d.designation || 'Unknown'}</span>
                            {d.mobile_number && <span className="text-xs text-slate-400">{d.mobile_number}</span>}
                          </div>
                        </div>
                        {d.joining_date && <span className="text-xs text-slate-400 flex-shrink-0">Joined: {d.joining_date}</span>}
                      </label>
                    );
                  })
                )}
              </div>
              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setImportTarget(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportDoctors}
                  disabled={selectedDoctorIds.size === 0}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Import {selectedDoctorIds.size > 0 ? `${selectedDoctorIds.size} Selected` : 'Selected'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Row Doctor Selection Modal (for Eligible Faculties Table) ──────────────────────────────────────── */}
        {rowDoctorModalId && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ListPlus className="w-5 h-5 text-emerald-600" /> Select Names
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Pick names to auto-fill this row</p>
                </div>
                <button onClick={() => setRowDoctorModalId(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {unitFaculties.filter(f => f.name.trim()).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">No doctors available. Import them in the top table first.</div>
                ) : (
                  unitFaculties.filter(f => f.name.trim()).map(d => {
                    const isSelected = rowSelectedDoctorIds.has(d.id);
                    return (
                      <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl mb-1 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                          checked={isSelected}
                          onChange={() => {
                            setRowSelectedDoctorIds(prev => {
                              const next = new Set(prev);
                              if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                              return next;
                            });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate">{d.name}</div>
                          {(() => {
                            const desigColors: Record<string, string> = {
                              'Professor and Head': 'bg-purple-100 text-purple-700',
                              'Associate Professor': 'bg-blue-100 text-blue-700',
                              'Assistant Professor': 'bg-emerald-100 text-emerald-700',
                              'Senior Resident': 'bg-amber-100 text-amber-700',
                            };
                            const badge = desigColors[d.designation] || 'bg-slate-100 text-slate-600';
                            return (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{d.designation || 'Unknown'}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setRowDoctorModalId(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-white transition-colors">Cancel</button>
                <button
                  onClick={() => {
                    const selected = unitFaculties.filter(d => rowSelectedDoctorIds.has(d.id));
                    const names = selected.map(d => d.name).join('\n');
                    updateRow(setEligibleFaculties, rowDoctorModalId, 'name', names);
                    updateRow(setEligibleFaculties, rowDoctorModalId, 'num', selected.length.toString());
                    setRowDoctorModalId(null);
                  }}
                  disabled={rowSelectedDoctorIds.size === 0}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <ListPlus className="w-4 h-4" /> Save ({rowSelectedDoctorIds.size})
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

