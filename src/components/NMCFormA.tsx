import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, Save, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const generateId = () => Math.random().toString(36).substr(2, 9);

const isCenteredValue = (val: any) => {
  if (val === undefined || val === null) return false;
  const strVal = String(val);
  const trimmed = strVal.trim();
  if (trimmed === '--') return true;
  if (trimmed && !isNaN(Number(trimmed))) return true;
  return false;
};

const InlineInput = ({ value, onChange, placeholder = '', className = '', onBlur, list }: any) => (
  <>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onBlur={onBlur} list={list}
      className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-normal transition-colors print:hidden ${isCenteredValue(value) ? 'text-center' : ''} ${className}`} />
    <span className={`hidden print:inline-block w-full min-h-[1.5em] whitespace-pre-wrap ${isCenteredValue(value) ? 'text-center' : ''} ${className}`}>{value}</span>
  </>
);

const InlineSelect = ({ value, onChange, options, className = '' }: any) => (
  <>
    <select value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5 font-normal transition-colors cursor-pointer print:hidden ${className}`}>
      <option value="">Select...</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <span className={`hidden print:inline-block w-full min-h-[1.5em] whitespace-pre-wrap ${className}`}>{value}</span>
  </>
);

const updateRow = (setter: any, id: string, field: string, value: string) => {
  setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
};



export default function NMCFormA() {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const useAutoSaveState = <T,>(key: string, initialValue: T) => {
    const [state, setState] = useState<T>(() => {
      const storageKey = `nmc_forma_${id || 'new'}_${key}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return initialValue;
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch {
        return initialValue;
      }
    });

    useEffect(() => {
      const storageKey = `nmc_forma_${id || 'new'}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
  };

  // Basic Info State
  const [instInfo, setInstInfo] = useAutoSaveState('instInfo', {
    name: '',
    type: '',
    standalone: '',
    periodFrom: '',
    periodTo: '',
    date: ''
  });

  const [genInfo, setGenInfo] = useAutoSaveState('genInfo', {
    name: '',
    type: '',
    standalone: '',
    lopDate: '',
    workingDays: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    website: '',
    email: '',
    landline: '',
    mobile: '',
    competentAuthorityDesignation: '',
    competentAuthorityName: '',
    competentAuthorityEmail: '',
    competentAuthorityMobile: '',
    competentAuthorityLandline: '',
    affiliatedUniversity: '',
    viceChancellorName: '',
    viceChancellorPhone: '',
    viceChancellorEmail: ''
  });

  const [ugDetail, setUgDetail] = useAutoSaveState('ugDetail', {
    seats: '',
    beds: '',
    opdDay: '', opdYr1: '', opdYr2: '', opdYr3: '',
    bedOccDay: '', bedOccYr1: '', bedOccYr2: '', bedOccYr3: ''
  });

  const [departments, setDepartments] = useAutoSaveState('departments', [
    { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' },
    { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' },
    { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' },
    { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' },
    { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' }
  ]);

  const [commonInfra, setCommonInfra] = useAutoSaveState('commonInfra', {
    oxygenAvail: '', oxygenAdeq: '',
    suctionAvail: '', suctionAdeq: '',
    sterilizationAvail: '', sterilizationAdeq: '',
    laundryAvail: '', laundryAdeq: '',
    kitchenAvail: '', kitchenAdeq: '',
    generatorAvail: '', generatorAdeq: '',
    bioWasteAvail: '', bioWasteAdeq: '',
    medRecordAvail: '', medRecordAdeq: '',
    icdAvail: '', icdAdeq: ''
  });

  const [opd, setOpd] = useAutoSaveState('opd', {
    space: '',
    patientsDay: '', patientsYr1: '', patientsYr2: '', patientsYr3: ''
  });

  const [bloodBank, setBloodBank] = useAutoSaveState('bloodBank', {
    licenseDate: '',
    componentFacility: '',
    issuedDay: '', issuedYr1: '', issuedYr2: '', issuedYr3: '',
    utilizedDay: '', utilizedYr1: '', utilizedYr2: '', utilizedYr3: '',
    dailyDay: '', dailyYr1: '', dailyYr2: '', dailyYr3: '',
    collectedDay: '', collectedYr1: '', collectedYr2: '', collectedYr3: '',
    crossMatchDay: '', crossMatchYr1: '', crossMatchYr2: '', crossMatchYr3: '',
    storedDay: '', storedYr1: '', storedYr2: '', storedYr3: '',
    availableDay: '', availableYr1: '', availableYr2: '', availableYr3: ''
  });

  const [emergencyDept, setEmergencyDept] = useAutoSaveState('emergencyDept', {
    beds: '',
    patientsDay: '', patientsYr1: '', patientsYr2: '', patientsYr3: ''
  });

  const [emergencyEquips, setEmergencyEquips] = useAutoSaveState('emergencyEquips', [
    { id: generateId(), name: 'Ventilators', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Defibrillators', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Fully equipped disaster trolleys', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Multipara monitors', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Dedicated portable x-ray machine available:', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Number of Ambulances', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Ultrasonography with color Doppler and curvilinear probe, Linear probe, and Phased array probe(cardiac)', available: '', functional: '', specs: '' }
  ]);

  const [emergencyWorkload, setEmergencyWorkload] = useAutoSaveState('emergencyWorkload', {
    admissionsDay: '', admissionsYr1: '', admissionsYr2: '', admissionsYr3: '',
    totalAdmissionsDay: '', totalAdmissionsYr1: '', totalAdmissionsYr2: '', totalAdmissionsYr3: '',
    bedOccPercDay: '', bedOccPercYr1: 'X', bedOccPercYr2: 'X', bedOccPercYr3: 'X',
    bedOccYearDay: 'X', bedOccYearYr1: '', bedOccYearYr2: '', bedOccYearYr3: '',
    majorSurgDay: '', majorSurgYr1: '', majorSurgYr2: '', majorSurgYr3: '',
    minorSurgDay: '', minorSurgYr1: '', minorSurgYr2: '', minorSurgYr3: '',
    bloodUnitsDay: '', bloodUnitsYr1: '', bloodUnitsYr2: '', bloodUnitsYr3: '',
    xraysDay: '', xraysYr1: '', xraysYr2: '', xraysYr3: '',
    usgDay: '', usgYr1: '', usgYr2: '', usgYr3: '',
    ctDay: '', ctYr1: '', ctYr2: '', ctYr3: '',
    mriDay: '', mriYr1: '', mriYr2: '', mriYr3: '',
    opdHemaDay: '', opdHemaYr1: '', opdHemaYr2: '', opdHemaYr3: '',
    opdBioDay: '', opdBioYr1: '', opdBioYr2: '', opdBioYr3: '',
    opdMicroDay: '', opdMicroYr1: '', opdMicroYr2: '', opdMicroYr3: '',
    abgDay: '', abgYr1: '', abgYr2: '', abgYr3: '',
    cardiacDay: '', cardiacYr1: '', cardiacYr2: '', cardiacYr3: '',
    deathsDay: '', deathsYr1: '', deathsYr2: '', deathsYr3: ''
  });

  const [emergencyProcs, setEmergencyProcs] = useAutoSaveState('emergencyProcs', [
    { id: generateId(), name: 'Central Line placement', day: '', lastYear: '' },
    { id: generateId(), name: 'Non-invasive ventilations', day: '', lastYear: '' },
    { id: generateId(), name: 'Pleural Tapping/Chest tube insertion', day: '', lastYear: '' },
    { id: generateId(), name: 'Pericardiocentesis', day: '', lastYear: '' },
    { id: generateId(), name: 'Cardioversion/Defibrillation', day: '', lastYear: '' },
    { id: generateId(), name: 'Incision and Drainage of abscess', day: '', lastYear: '' },
    { id: generateId(), name: 'Endotracheal Intubation with direct laryngoscopy', day: '', lastYear: '' },
    { id: generateId(), name: 'Major trauma primary care like splinting/dressing', day: '', lastYear: '' },
    { id: generateId(), name: 'Endotracheal intubation with video laryngoscopy', day: '', lastYear: '' },
    { id: generateId(), name: 'Tracheostomy', day: '', lastYear: '' },
    { id: generateId(), name: 'Ultrasonography', day: '', lastYear: '' },
    { id: generateId(), name: 'Transcutaneous Pacing', day: '', lastYear: '' },
    { id: generateId(), name: 'Regional Block', day: '', lastYear: '' }
  ]);

  const [intensiveCare, setIntensiveCare] = useAutoSaveState('intensiveCare', {
    totalBeds: '',
    hduBeds: '',
    pacuBeds: ''
  });

  const [icuFacilities, setIcuFacilities] = useAutoSaveState('icuFacilities', [
    { id: generateId(), type: 'Medical ICU- MICU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' },
    { id: generateId(), type: 'Surgical ICU – SICU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' },
    { id: generateId(), type: 'Neonatal ICU- NICU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' },
    { id: generateId(), type: 'Paediatrics ICU- PICU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' },
    { id: generateId(), type: 'Intensive Coronary Care Unit – ICCU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' },
    { id: generateId(), type: 'Critical care unit-CCU', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' }
  ]);

  const [dialysis, setDialysis] = useAutoSaveState('dialysis', {
    beds: '', machines: '',
    hemoDay: '', hemoYr1: '', hemoYr2: '', hemoYr3: '',
    periDay: '', periYr1: '', periYr2: '', periYr3: ''
  });

  const [radiologyEquips, setRadiologyEquips] = useAutoSaveState('radiologyEquips', [
    { id: generateId(), name: 'X-Ray Machines- Static', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'X-Ray Machines- Portable', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'X-Ray Machines- TV/Imaging facility', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'CT Scan (Mention slices, year of manufacturing with other specifications)', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'MRI (Mention Tesla, year of manufacture with other specifications)', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'USG – Grey Scale (mention probes available with each machine)', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'USG – Colour Doppler (mention probes available with each machine)', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'Mammography', available: '', functional: '', specs: '' },
    { id: generateId(), name: 'DSA', available: '', functional: '', specs: '' }
  ]);

  const [radiologyWorkload, setRadiologyWorkload] = useAutoSaveState('radiologyWorkload', {
    plainXraysDay: '', plainXraysYr1: '', plainXraysYr2: '', plainXraysYr3: '',
    ivpDay: '', ivpYr1: '', ivpYr2: '', ivpYr3: '',
    swallowDay: '', swallowYr1: '', swallowYr2: '', swallowYr3: '',
    giDay: '', giYr1: '', giYr2: '', giYr3: '',
    mealDay: '', mealYr1: '', mealYr2: '', mealYr3: '',
    enemaDay: '', enemaYr1: '', enemaYr2: '', enemaYr3: '',
    hsgDay: '', hsgYr1: '', hsgYr2: '', hsgYr3: '',
    silographyDay: '', silographyYr1: '', silographyYr2: '', silographyYr3: '',
    urethrogramDay: '', urethrogramYr1: '', urethrogramYr2: '', urethrogramYr3: '',
    mcugDay: '', mcugYr1: '', mcugYr2: '', mcugYr3: '',
    fistuloDay: '', fistuloYr1: '', fistuloYr2: '', fistuloYr3: '',
    totalUsgDay: '', totalUsgYr1: '', totalUsgYr2: '', totalUsgYr3: '',
    numUsgDay: '', numUsgYr1: '', numUsgYr2: '', numUsgYr3: '',
    dopplerAbdDay: '', dopplerAbdYr1: '', dopplerAbdYr2: '', dopplerAbdYr3: '',
    dopplerPeriDay: '', dopplerPeriYr1: '', dopplerPeriYr2: '', dopplerPeriYr3: '',
    dopplerCarDay: '', dopplerCarYr1: '', dopplerCarYr2: '', dopplerCarYr3: '',
    dopplerOthDay: '', dopplerOthYr1: '', dopplerOthYr2: '', dopplerOthYr3: '',
    usgFnacDay: '', usgFnacYr1: '', usgFnacYr2: '', usgFnacYr3: '',
    usgAspDay: '', usgAspYr1: '', usgAspYr2: '', usgAspYr3: '',
    totalCtDay: '', totalCtYr1: '', totalCtYr2: '', totalCtYr3: ''
  });

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchData = async () => {
        setIsFetching(true);
        try {
          const docRef = doc(db, 'nmc_form_a', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setInstInfo(data.instInfo || {});
            setGenInfo(data.genInfo || {});
            if (data.ugDetail) setUgDetail(data.ugDetail);
            if (data.departments && data.departments.length > 0) setDepartments(data.departments);
            if (data.commonInfra) setCommonInfra(data.commonInfra);
            if (data.opd) setOpd(data.opd);
            if (data.bloodBank) setBloodBank(data.bloodBank);
            if (data.emergencyDept) setEmergencyDept(data.emergencyDept);
            if (data.emergencyEquips && data.emergencyEquips.length > 0) setEmergencyEquips(data.emergencyEquips);
            if (data.emergencyWorkload) setEmergencyWorkload(data.emergencyWorkload);
            if (data.emergencyProcs && data.emergencyProcs.length > 0) setEmergencyProcs(data.emergencyProcs);
            if (data.intensiveCare) setIntensiveCare(data.intensiveCare);
            if (data.icuFacilities && data.icuFacilities.length > 0) setIcuFacilities(data.icuFacilities);
            if (data.dialysis) setDialysis(data.dialysis);
            if (data.radiologyEquips && data.radiologyEquips.length > 0) setRadiologyEquips(data.radiologyEquips);
            if (data.radiologyWorkload) setRadiologyWorkload(data.radiologyWorkload);
          } else {
            showToast("Record not found", "error");
          }
        } catch (error) {
          console.error("Error fetching record:", error);
          showToast("Error loading record", "error");
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    } else {
      setIsFetching(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    if (isFetching) return;

    const payloadString = JSON.stringify({
      instInfo,
      genInfo,
      ugDetail,
      departments,
      commonInfra,
      opd,
      bloodBank,
      emergencyDept,
      emergencyEquips,
      emergencyWorkload,
      emergencyProcs,
      intensiveCare,
      icuFacilities,
      dialysis,
      radiologyEquips,
      radiologyWorkload
    });

    const timeoutId = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        const recordId = id && id !== 'new' ? id : Math.random().toString(36).substring(2, 10);
        const docRef = doc(db, 'nmc_form_a', recordId);
        
        const payload = {
          id: recordId,
          ...JSON.parse(payloadString),
          updatedAt: serverTimestamp(),
          ...(id && id !== 'new' ? {} : { createdAt: serverTimestamp() })
        };
        
        await setDoc(docRef, payload, { merge: true });
        setLastSaved(new Date());
        
        if (!id || id === 'new') {
          navigate(`/nmc-form-a/${recordId}`, { replace: true });
        }
      } catch (error) {
        console.error("Autosave error: ", error);
      } finally {
        setIsAutosaving(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [id, isFetching, navigate, instInfo, genInfo, ugDetail, departments, commonInfra, opd, bloodBank, emergencyDept, emergencyEquips, emergencyWorkload, emergencyProcs, intensiveCare, icuFacilities, dialysis, radiologyEquips, radiologyWorkload]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordId = id && id !== 'new' ? id : Math.random().toString(36).substring(2, 10);
      const payload = {
        id: recordId,
        instInfo,
        genInfo,
        ugDetail,
        departments,
        commonInfra,
        opd,
        bloodBank,
        emergencyDept,
        emergencyEquips,
        emergencyWorkload,
        emergencyProcs,
        intensiveCare,
        icuFacilities,
        dialysis,
        radiologyEquips,
        radiologyWorkload,
        updatedAt: serverTimestamp(),
        ...(id && id !== 'new' ? {} : { createdAt: serverTimestamp() })
      };
      await setDoc(doc(db, 'nmc_form_a', recordId), payload, { merge: true });
      setLastSaved(new Date());
      if (!id || id === 'new') {
        navigate(`/nmc-form-a/${recordId}`, { replace: true });
      }
      showToast("Record saved successfully!", "success");
    } catch (error) {
      console.error("Error saving form:", error);
      showToast("Error saving form", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintClick = () => window.print();

  const PageHeader = ({ pageNum }: { pageNum: number }) => (
    <div className="flex justify-between w-full mb-3 font-serif text-[11pt]">
      <div>STANDARD ASSESSMENT FORM-A/2024</div>
      <div>{pageNum}</div>
    </div>
  );

  const PageFooter = () => (
    <div className="mt-auto pt-6 w-full flex justify-between text-[11pt] font-serif font-bold bg-white">
      <div>Signature of Dean</div>
      <div>Signature of Assessor</div>
    </div>
  );

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-serif print:block print:min-h-0 print:h-auto print:bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>
      
      {/* ACTION BAR */}
      <div className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/nmc-form-a')} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-sans font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h1 className="text-lg font-bold text-slate-800 font-sans">
            NMC Form A {id && id !== 'new' ? <span className="text-slate-400 font-normal text-sm ml-2">ID: {id.substring(0,8)}</span> : <span className="text-emerald-500 font-normal text-sm ml-2">New Draft</span>}
          </h1>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <div className="hidden md:block mr-2 text-sm text-right">
            {isAutosaving ? (
              <span className="flex items-center text-slate-500">
                <Loader2 size={14} className="animate-spin mr-1.5" />
                Saving to cloud...
              </span>
            ) : lastSaved ? (
              <span className="text-emerald-600">All changes saved to cloud at {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Auto-saves to cloud automatically. Use Save Record to force save.</span>
            )}
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
              isSaving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSaving ? 'Saving...' : 'Save Record'}</span>
          </button>
          <button onClick={handlePrintClick} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* FORM PAGES CONTAINER */}
      <div className="flex-1 overflow-auto py-8 print:py-0 print:overflow-visible print:block print:h-auto flex flex-col items-center gap-8 print:gap-0" ref={printRef}>
        
        {/* PAGE 1 */}
        <div className="a4-page portrait-page print-page relative">
          <PageHeader pageNum={1} />
          
          <div className="flex items-center justify-center mb-6 relative h-28">
            <div className="absolute left-0 top-0 h-24 w-auto">
              <img src="/NMC%20LOGO.png" alt="NMC Logo" className="h-full object-contain" />
            </div>
            <div className="text-center flex-1 ml-[120px]">
              <h2 className="text-[15pt] font-bold mb-3">POST-GRADUATE MEDICAL EDUCATION BOARD</h2>
              <h3 className="text-[15pt] font-bold">NATIONAL MEDICAL COMMISSION</h3>
            </div>
          </div>

          <div className="text-center mb-4 mt-6">
            <h1 className="text-[16pt] font-bold underline underline-offset-4 mb-2">STANDARD ASSESSMENT FORM-A</h1>
            <p className="text-[13pt]">(Institutional Information Common for <span className="font-bold">all PG Specialities</span>)</p>
          </div>

          <div className="text-center mb-6 mt-6">
            <h2 className="text-[14pt] font-bold underline underline-offset-4">INSTITUTIONAL INFORMATION</h2>
          </div>

          <div className="space-y-4 text-[13pt] mb-2 pl-4">
            <div className="flex items-center">
              <span className="w-48 whitespace-nowrap">Name of Institution:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={instInfo.name} onChange={(v:string) => setInstInfo({...instInfo, name: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-64 whitespace-nowrap">Government/ Non-Government:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={instInfo.type} onChange={(v:string) => setInstInfo({...instInfo, type: v})} /></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="whitespace-nowrap">Standalone PG:</span>
              <span className="flex-1 border-b border-black font-bold"><InlineSelect value={instInfo.standalone} onChange={(v:string) => setInstInfo({...instInfo, standalone: v})} options={['Yes', 'No']} /></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Period:</span>
              <span className="w-64 border-b border-black"><InlineInput value={instInfo.periodFrom} onChange={(v:string) => setInstInfo({...instInfo, periodFrom: v})} /></span>
              <span className="whitespace-nowrap pl-2 pr-2">to</span>
              <span className="w-64 border-b border-black"><InlineInput value={instInfo.periodTo} onChange={(v:string) => setInstInfo({...instInfo, periodTo: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-44 whitespace-nowrap">Date of the Report:</span>
              <span className="w-64 border-b border-black"><InlineInput value={instInfo.date} onChange={(v:string) => setInstInfo({...instInfo, date: v})} /></span>
            </div>
          </div>

          <hr className="border-black border-t-[1.5px] my-3 w-full" />
          
          <div className="text-center mb-4 mt-2">
            <h3 className="text-[12pt] font-bold italic">INSTRUCTIONS TO DEAN/ DIRECTOR/PRINCIPAL & HEAD OF THE DEPARTMENT</h3>
          </div>

          <ol className="list-decimal pl-6 space-y-3 text-[11.5pt] text-justify leading-snug">
            <li>
              This Standard Assessment Form is meant for the purpose of giving Annual Disclosure Report (<span className="font-bold">Annual Self-Declaration</span>) by Medical Colleges/Institutions as required under <span className="font-bold">Section 4</span> of MSMER-2023 regulation and for the Assessment/Inspection of a medical college/an institution by the Assessor. It will be in <span className="font-bold">Three Parts:</span>
              <ol className="list-[lower-roman] pl-10 mt-2 space-y-1">
                <li><span className="font-bold">Form-A</span> is for the Institutional Information and is common for all PG Specialities.</li>
                <li><span className="font-bold">Form-B</span> is for Speciality specific information (<span className="font-bold">Broad/Super Speciality</span>).</li>
                <li>Faculty, Senior Resident and Post-Graduate Students Declaration Forms.</li>
              </ol>
            </li>
            <li>These Forms will be updated/modified from time to time. Please download it afresh at the time of any application/submission.</li>
            <li>For the purpose of Annual Disclosure Report (<span className="font-bold">Annual Self-Declaration</span>), the Data of previous year (1<sup>st</sup> January to 31<sup>st</sup> December) will be considered.</li>
            <li>Medical college/institution will fill up all the details/data. The Assessor will verify availability and functional status of major infrastructure and major equipment of the institution mentioned in <span className="font-bold">Form-A</span> and may verify the relevant workload data furnished by the medical college/institution as per the requirement. Assessor will verify in detail all the items mentioned in <span className="font-bold">Form-B</span> (Department Specific form).</li>
            <li>The original copy of the Annual Self-Declaration Form shall be preserved by the medical colleges. The PDF copy of SAF will be sent by e-mail.</li>
            <li>Please read the FORM carefully before filling it up. Retrospective changes in Data will not be allowed.</li>
            <li>Do NOT edit or modify any part of the Form. Tampering with the format of this Form will render your submission invalid.</li>
            <li>Write <span className="font-bold">N/A</span> where it is <span className="font-bold">not applicable</span>. Write <span className="font-bold">'Not Available'</span>, if the facility is <span className="font-bold">not available</span>.</li>
            <li>Head of the Department and Dean will be responsible for filling all columns and signing on all pages and at the end of the Form. Do NOT leave any section of the Form or part thereof unanswered. Incompletely filled up Form shall be summarily rejected.</li>
          </ol>

          <PageFooter />
        </div>

        {/* PAGE 2 */}
        <div className="a4-page portrait-page print-page relative">
          <PageHeader pageNum={2} />
          
          <ol start={10} className="list-decimal pl-6 space-y-3 text-[11.5pt] text-justify leading-snug">
            <li>Dean, Head of Department (HoD) and Faculty should be thoroughly well-versed with all Regulations and MSRs of NMC.</li>
            <li>All Faculty, Senior Residents and Post-Graduate students will fill up the <span className="font-bold">respective Declaration Forms</span>. It should be countersigned by HoD and Head of the institution. The original Declaration Form shall be preserved by the medical colleges/institutions.</li>
            <li>Medical College shall maintain the <span className="font-bold">Declaration Forms</span> who are relieved or retired during the reported year.</li>
            <li>Add rows in a Table as per requirement.</li>
            <li>Non-compliance/wrong declaration or fake documents will invite penalties as per NMC regulations.</li>
            <li>The working days will be calculated as per the following formula [365 - 52 (Sundays) -Holidays declared by the respective Government/medical college]. The dates of the Holidays to be provided by the medical college/institution as Annexure.</li>
            <li>Annual detail of all clinical workload/ investigations will be provided as per the <span className="font-bold">Data Table</span> as and when asked for. Template of the Data Table is at end of this document.</li>
          </ol>

          <PageFooter />
        </div>

        {/* PAGE 3 */}
        <div className="a4-page portrait-page print-page relative">
          <PageHeader pageNum={3} />
          
          <div className="flex mb-2 text-[12pt] font-bold">
            <span className="w-12">A.</span>
            <span className="underline underline-offset-4 w-full text-center block -ml-12">GENERAL INFORMATION OF MEDICAL COLLEGE/ INSTITUTION</span>
          </div>

          <div className="space-y-1 text-[11.5pt] pl-4">
            <div className="flex items-center">
              <span className="w-8">1.</span>
              <span className="w-80">Name of Medical College/Institution:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.name} onChange={(v:string)=>setGenInfo({...genInfo, name: v})} /></span>
            </div>
            
            <div className="flex items-center">
              <span className="w-8">2.</span>
              <span className="w-80">College Type: Government/ Non-Government:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.type} onChange={(v:string)=>setGenInfo({...genInfo, type: v})} /></span>
            </div>

            <div className="flex items-center gap-4">
              <span className="w-8">3.</span>
              <span className="w-40">Stand-alone PG:</span>
              <span className="w-32 border-b border-black font-bold"><InlineSelect value={genInfo.standalone} onChange={(v:string)=>setGenInfo({...genInfo, standalone: v})} options={['Yes', 'No']} className="text-center" /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">4.</span>
              <span className="w-[450px]">LOP date of establishment of undergraduate college:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.lopDate} onChange={(v:string)=>setGenInfo({...genInfo, lopDate: v})} /></span>
            </div>

            <div className="flex items-center gap-6">
              <span className="w-8">5.</span>
              <span>Dates of the Holidays of last year.</span>
              <span className="font-bold">Attach file as Annexure.</span>
            </div>

            <div className="flex items-center">
              <span className="w-8">6.</span>
              <span className="w-64">Total working days of last year:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.workingDays} onChange={(v:string)=>setGenInfo({...genInfo, workingDays: v})} /></span>
            </div>

            <div className="flex items-center mt-2">
              <span className="w-8">7.</span>
              <span className="w-64">College Address:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.address} onChange={(v:string)=>setGenInfo({...genInfo, address: v})} /></span>
            </div>
            <div className="flex items-center pl-8">
              <span className="w-64">College City/Town:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.city} onChange={(v:string)=>setGenInfo({...genInfo, city: v})} /></span>
            </div>
            <div className="flex items-center pl-8">
              <span className="w-64">College District:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.district} onChange={(v:string)=>setGenInfo({...genInfo, district: v})} /></span>
            </div>
            <div className="flex items-center pl-8">
              <span className="w-64">College State:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.state} onChange={(v:string)=>setGenInfo({...genInfo, state: v})} /></span>
            </div>
            <div className="flex items-center pl-8">
              <span className="w-64">Pin Code:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.pinCode} onChange={(v:string)=>setGenInfo({...genInfo, pinCode: v})} /></span>
            </div>

            <div className="flex items-center mt-2">
              <span className="w-8">8.</span>
              <span className="w-64">College Website:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.website} onChange={(v:string)=>setGenInfo({...genInfo, website: v})} /></span>
            </div>
            
            <div className="flex items-center">
              <span className="w-8">9.</span>
              <span className="w-64">College E-mail ID:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.email} onChange={(v:string)=>setGenInfo({...genInfo, email: v})} /></span>
            </div>
            
            <div className="flex items-center">
              <span className="w-8">10.</span>
              <span className="w-64">College Landline No.:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.landline} onChange={(v:string)=>setGenInfo({...genInfo, landline: v})} /></span>
            </div>
            
            <div className="flex items-center">
              <span className="w-8">11.</span>
              <span className="w-64">College Mobile/Phone No.:</span>
              <span className="w-96 border-b border-black"><InlineInput value={genInfo.mobile} onChange={(v:string)=>setGenInfo({...genInfo, mobile: v})} /></span>
            </div>

            <div className="flex items-center mt-2 mb-1">
              <span className="w-8">12.</span>
              <span className="w-72">College Competent Authority:</span>
              <span className="font-bold text-[12pt] w-48"><InlineSelect value={genInfo.competentAuthorityDesignation} onChange={(v:string)=>setGenInfo({...genInfo, competentAuthorityDesignation: v})} options={['Dean', 'Director', 'Principal']} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">13.</span>
              <span className="w-[300px]">College Competent Authority Name:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.competentAuthorityName} onChange={(v:string)=>setGenInfo({...genInfo, competentAuthorityName: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">14.</span>
              <span className="w-[300px]">College Competent Authority E-mail ID:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.competentAuthorityEmail} onChange={(v:string)=>setGenInfo({...genInfo, competentAuthorityEmail: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">15.</span>
              <span className="w-[300px]">College Competent Authority Mobile No:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.competentAuthorityMobile} onChange={(v:string)=>setGenInfo({...genInfo, competentAuthorityMobile: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">16.</span>
              <span className="w-[300px]">College Competent Authority Landline No:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.competentAuthorityLandline} onChange={(v:string)=>setGenInfo({...genInfo, competentAuthorityLandline: v})} /></span>
            </div>

            <div className="flex items-center mt-2">
              <span className="w-8">17.</span>
              <span className="w-[300px]">Name and Address of Affiliated University:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.affiliatedUniversity} onChange={(v:string)=>setGenInfo({...genInfo, affiliatedUniversity: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">18.</span>
              <span className="w-[300px]">Name and address of the Vice-Chancellor:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.viceChancellorName} onChange={(v:string)=>setGenInfo({...genInfo, viceChancellorName: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">19.</span>
              <span className="w-[300px]">Landline No./Mobile No of the Vice-Chancellor:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.viceChancellorPhone} onChange={(v:string)=>setGenInfo({...genInfo, viceChancellorPhone: v})} /></span>
            </div>

            <div className="flex items-center">
              <span className="w-8">20.</span>
              <span className="w-[300px]">E-mail address of the Vice-Chancellor:</span>
              <span className="flex-1 border-b border-black"><InlineInput value={genInfo.viceChancellorEmail} onChange={(v:string)=>setGenInfo({...genInfo, viceChancellorEmail: v})} /></span>
            </div>

          </div>

          <PageFooter />
        </div>
        {/* PAGE 4 */}
        <div className="a4-page portrait-page print-page relative">
          <PageHeader pageNum={4} />

          <div className="flex mb-4 text-[11.5pt] font-bold">
            <span className="w-12">B.</span>
            <span className="w-full">DETAIL OF UNDERGRADUATE MEDICAL COLLEGE/INSTITUTE:</span>
          </div>

          <div className="pl-12 space-y-3 text-[11.5pt] mb-6">
            <div className="flex items-center">
              <span className="w-[350px]">Total number of UG seats:</span>
              <span className="w-48 border-b border-black"><InlineInput value={ugDetail.seats} onChange={(v:string)=>setUgDetail({...ugDetail, seats: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-[450px]">Total hospital beds of all Departments required for UG College:</span>
              <span className="w-48 border-b border-black"><InlineInput value={ugDetail.beds} onChange={(v:string)=>setUgDetail({...ugDetail, beds: v})} /></span>
            </div>
          </div>

          <table className="nmc-table text-[11pt] w-full mb-8">
            <thead>
              <tr>
                <th className="w-[30%]">Parameter</th>
                <th className="w-[20%]">On the day of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[20%]">Year 3<br/>(Last Year)</th>
              </tr>
              <tr className="text-center font-bold">
                <td>(1)</td><td>(2)</td><td>(3)</td><td>(4)</td><td>(5)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2 pr-2 text-justify">
                  Total OPD patients of all departments required for UG college
                  <br/><span className="italic text-[10pt] font-normal">(Write the average of all the OPD days in a year in column 3, 4, 5)</span>
                </td>
                <td><InlineInput value={ugDetail.opdDay} onChange={(v:string)=>setUgDetail({...ugDetail, opdDay: v})} /></td>
                <td><InlineInput value={ugDetail.opdYr1} onChange={(v:string)=>setUgDetail({...ugDetail, opdYr1: v})} /></td>
                <td><InlineInput value={ugDetail.opdYr2} onChange={(v:string)=>setUgDetail({...ugDetail, opdYr2: v})} /></td>
                <td><InlineInput value={ugDetail.opdYr3} onChange={(v:string)=>setUgDetail({...ugDetail, opdYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2 pr-2 text-justify">
                  Bed Occupancy of all the required In-patient beds for UG College.
                  <br/><span className="italic text-[10pt] font-normal">(Write average of all days in a year in column 3, 4, 5)</span>
                </td>
                <td><InlineInput value={ugDetail.bedOccDay} onChange={(v:string)=>setUgDetail({...ugDetail, bedOccDay: v})} /></td>
                <td><InlineInput value={ugDetail.bedOccYr1} onChange={(v:string)=>setUgDetail({...ugDetail, bedOccYr1: v})} /></td>
                <td><InlineInput value={ugDetail.bedOccYr2} onChange={(v:string)=>setUgDetail({...ugDetail, bedOccYr2: v})} /></td>
                <td><InlineInput value={ugDetail.bedOccYr3} onChange={(v:string)=>setUgDetail({...ugDetail, bedOccYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <div className="flex mb-4 text-[11.5pt] font-bold">
            <span className="w-12">C.</span>
            <span className="w-full">LIST OF ALL BROAD SPECIALITY AND SUPER SPECIALITY DEPARTMENTS EXISTING IN THE INSTITUTION WITH BASIC DETAILS:</span>
          </div>

          <table className="nmc-table tight-table text-[10.5pt] w-full mb-2">
            <thead>
              <tr>
                <th className="w-[35%]">Name of Department</th>
                <th className="w-[15%]">Total Beds</th>
                <th className="w-[15%]">Total No. of<br/>Units</th>
                <th className="w-[18%]">Total No. of<br/>Admissions<br/>per year</th>
                <th className="w-[17%]">Year of<br/>Starting the<br/>Course</th>
                <th className="w-8 print:hidden !border-transparent !bg-transparent"></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dep, idx) => (
                <tr key={dep.id}>
                  <td><InlineInput value={dep.name} onChange={(v:string)=>updateRow(setDepartments, dep.id, 'name', v)} /></td>
                  <td><InlineInput value={dep.beds} onChange={(v:string)=>updateRow(setDepartments, dep.id, 'beds', v)} /></td>
                  <td><InlineInput value={dep.units} onChange={(v:string)=>updateRow(setDepartments, dep.id, 'units', v)} /></td>
                  <td><InlineInput value={dep.admissions} onChange={(v:string)=>updateRow(setDepartments, dep.id, 'admissions', v)} /></td>
                  <td><InlineInput value={dep.startYear} onChange={(v:string)=>updateRow(setDepartments, dep.id, 'startYear', v)} /></td>
                  <td className="print:hidden !border-transparent !bg-transparent text-center align-middle">
                    <button onClick={() => setDepartments(departments.filter(d => d.id !== dep.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mb-8 print:hidden">
            <button 
              onClick={() => setDepartments([...departments, { id: generateId(), name: '', beds: '', units: '', admissions: '', startYear: '' }])}
              className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Department Record
            </button>
          </div>

          <div className="flex mb-4 text-[11.5pt] font-bold">
            <span className="w-12">D.</span>
            <span className="w-full">COMMON INFRASTRUCTURE:</span>
          </div>
          
          <div className="flex mb-2 text-[11.5pt] font-bold pl-8">
            <span className="w-8">I.</span>
            <span className="w-full">General:</span>
          </div>

          <table className="nmc-table text-[11pt] w-[80%] mx-auto">
            <thead>
              <tr>
                <th className="w-[45%]">Parameters</th>
                <th className="w-[25%]">Availability</th>
                <th className="w-[30%]">Adequate/ Not<br/>Adequate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2">Central supply of Oxygen</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.oxygenAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, oxygenAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.oxygenAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, oxygenAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
            </tbody>
          </table>

          <PageFooter />
        </div>

        {/* PAGE 5 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={5} />

          <table className="nmc-table text-[11pt] w-[80%] mx-auto mb-8">
            <thead>
              <tr>
                <th className="w-[45%]">Parameters</th>
                <th className="w-[25%]">Availability</th>
                <th className="w-[30%]">Adequate/ Not<br/>Adequate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2">Central Suction</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.suctionAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, suctionAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.suctionAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, suctionAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Central Sterilization Department</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.sterilizationAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, sterilizationAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.sterilizationAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, sterilizationAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Laundry</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.laundryAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, laundryAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.laundryAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, laundryAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Kitchen</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.kitchenAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, kitchenAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.kitchenAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, kitchenAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Generator facility</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.generatorAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, generatorAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.generatorAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, generatorAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Bio-waste disposal</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.bioWasteAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, bioWasteAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.bioWasteAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, bioWasteAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Computerized Medical Record Section</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.medRecordAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, medRecordAvail: v})} options={['Yes', 'No']} /></td>
                <td><InlineSelect value={commonInfra.medRecordAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, medRecordAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
              <tr>
                <td className="pl-2">Which ICD classification being used</td>
                <td className="text-center font-bold"><InlineSelect value={commonInfra.icdAvail} onChange={(v:string)=>setCommonInfra({...commonInfra, icdAvail: v})} options={['ICD10', 'ICD11']} /></td>
                <td><InlineSelect value={commonInfra.icdAdeq} onChange={(v:string)=>setCommonInfra({...commonInfra, icdAdeq: v})} options={['Adequate', 'Not Adequate']} /></td>
              </tr>
            </tbody>
          </table>

          <div className="flex mb-4 text-[11.5pt] font-bold pl-8">
            <span className="w-8">II.</span>
            <span className="w-full">Out-Patient Department:</span>
          </div>

          <div className="flex items-center mb-2 text-[11pt] pl-16">
            <span className="w-64">Space and arrangements</span>
            <span className="w-8">:</span>
            <span className="w-48"><InlineSelect value={opd.space} onChange={(v:string)=>setOpd({...opd, space: v})} options={['Adequate', 'Not Adequate']} /></span>
          </div>

          <table className="nmc-table text-[11pt] w-full mb-8">
            <thead>
              <tr>
                <th className="w-[30%]">Parameter</th>
                <th className="w-[20%]">On the day of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[20%]">Year 3<br/>(Last Year)</th>
              </tr>
              <tr className="text-center font-bold">
                <td>(1)</td><td>(2)</td><td>(3)</td><td>(4)</td><td>(5)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2 pr-2 font-bold">
                  Total OPD Patients of all the Departments in the hospital
                  <br/><span className="italic text-[10pt] font-normal">(Write the average of all the OPD days in a year in column 3, 4, 5)</span>
                </td>
                <td><InlineInput value={opd.patientsDay} onChange={(v:string)=>setOpd({...opd, patientsDay: v})} /></td>
                <td><InlineInput value={opd.patientsYr1} onChange={(v:string)=>setOpd({...opd, patientsYr1: v})} /></td>
                <td><InlineInput value={opd.patientsYr2} onChange={(v:string)=>setOpd({...opd, patientsYr2: v})} /></td>
                <td><InlineInput value={opd.patientsYr3} onChange={(v:string)=>setOpd({...opd, patientsYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <div className="flex mb-4 text-[11.5pt] font-bold pl-8">
            <span className="w-8">III.</span>
            <span className="w-full">Blood Bank:</span>
          </div>

          <div className="pl-16 space-y-4 text-[11.5pt] mb-4">
            <div className="flex items-center">
              <span className="w-64">License valid till date:</span>
              <span className="w-64 border-b border-black"><InlineInput value={bloodBank.licenseDate} onChange={(v:string)=>setBloodBank({...bloodBank, licenseDate: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-64">Blood component facility:</span>
              <span className="font-bold"><InlineSelect value={bloodBank.componentFacility} onChange={(v:string)=>setBloodBank({...bloodBank, componentFacility: v})} options={['Available', 'Not Available']} /></span>
            </div>
          </div>

          <table className="nmc-table tight-table text-[10.5pt] w-full">
            <thead>
              <tr>
                <th className="w-[30%]">Parameter</th>
                <th className="w-[18%]">On the day<br/>of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[20%]">Year 3<br/>(Last Year)</th>
              </tr>
              <tr className="text-center font-bold">
                <td>(1)</td><td>(2)</td><td>(3)</td><td>(4)</td><td>(5)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2">Blood Units including Components issued</td>
                <td><InlineInput value={bloodBank.issuedDay} onChange={(v:string)=>setBloodBank({...bloodBank, issuedDay: v})} /></td>
                <td><InlineInput value={bloodBank.issuedYr1} onChange={(v:string)=>setBloodBank({...bloodBank, issuedYr1: v})} /></td>
                <td><InlineInput value={bloodBank.issuedYr2} onChange={(v:string)=>setBloodBank({...bloodBank, issuedYr2: v})} /></td>
                <td><InlineInput value={bloodBank.issuedYr3} onChange={(v:string)=>setBloodBank({...bloodBank, issuedYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Blood Units including Components utilized in the hospital <span className="italic">(write average of all days in column 3,4,5)</span></td>
                <td><InlineInput value={bloodBank.utilizedDay} onChange={(v:string)=>setBloodBank({...bloodBank, utilizedDay: v})} /></td>
                <td><InlineInput value={bloodBank.utilizedYr1} onChange={(v:string)=>setBloodBank({...bloodBank, utilizedYr1: v})} /></td>
                <td><InlineInput value={bloodBank.utilizedYr2} onChange={(v:string)=>setBloodBank({...bloodBank, utilizedYr2: v})} /></td>
                <td><InlineInput value={bloodBank.utilizedYr3} onChange={(v:string)=>setBloodBank({...bloodBank, utilizedYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Average number of units utilized daily by the various Specialities <span className="italic font-bold">(Attach Annexure)</span></td>
                <td><InlineInput value={bloodBank.dailyDay} onChange={(v:string)=>setBloodBank({...bloodBank, dailyDay: v})} /></td>
                <td><InlineInput value={bloodBank.dailyYr1} onChange={(v:string)=>setBloodBank({...bloodBank, dailyYr1: v})} /></td>
                <td><InlineInput value={bloodBank.dailyYr2} onChange={(v:string)=>setBloodBank({...bloodBank, dailyYr2: v})} /></td>
                <td><InlineInput value={bloodBank.dailyYr3} onChange={(v:string)=>setBloodBank({...bloodBank, dailyYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Blood units collected</td>
                <td><InlineInput value={bloodBank.collectedDay} onChange={(v:string)=>setBloodBank({...bloodBank, collectedDay: v})} /></td>
                <td><InlineInput value={bloodBank.collectedYr1} onChange={(v:string)=>setBloodBank({...bloodBank, collectedYr1: v})} /></td>
                <td><InlineInput value={bloodBank.collectedYr2} onChange={(v:string)=>setBloodBank({...bloodBank, collectedYr2: v})} /></td>
                <td><InlineInput value={bloodBank.collectedYr3} onChange={(v:string)=>setBloodBank({...bloodBank, collectedYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Total Number of Cross matchings</td>
                <td><InlineInput value={bloodBank.crossMatchDay} onChange={(v:string)=>setBloodBank({...bloodBank, crossMatchDay: v})} /></td>
                <td><InlineInput value={bloodBank.crossMatchYr1} onChange={(v:string)=>setBloodBank({...bloodBank, crossMatchYr1: v})} /></td>
                <td><InlineInput value={bloodBank.crossMatchYr2} onChange={(v:string)=>setBloodBank({...bloodBank, crossMatchYr2: v})} /></td>
                <td><InlineInput value={bloodBank.crossMatchYr3} onChange={(v:string)=>setBloodBank({...bloodBank, crossMatchYr3: v})} /></td>
              </tr>
              <tr>
                <td className="w-[30%] pl-2 font-normal">Number of units stored <br/><span className="italic">(write average of all days in column 3,4,5)</span></td>
                <td className="w-[18%]"><InlineInput value={bloodBank.storedDay} onChange={(v:string)=>setBloodBank({...bloodBank, storedDay: v})} /></td>
                <td className="w-[15%]"><InlineInput value={bloodBank.storedYr1} onChange={(v:string)=>setBloodBank({...bloodBank, storedYr1: v})} /></td>
                <td className="w-[15%]"><InlineInput value={bloodBank.storedYr2} onChange={(v:string)=>setBloodBank({...bloodBank, storedYr2: v})} /></td>
                <td className="w-[20%]"><InlineInput value={bloodBank.storedYr3} onChange={(v:string)=>setBloodBank({...bloodBank, storedYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2 font-normal">Number of Units available on Assessment Day</td>
                <td><InlineInput value={bloodBank.availableDay} onChange={(v:string)=>setBloodBank({...bloodBank, availableDay: v})} /></td>
                <td><InlineInput value={bloodBank.availableYr1 || ''} onChange={(v:string)=>setBloodBank({...bloodBank, availableYr1: v})} /></td>
                <td><InlineInput value={bloodBank.availableYr2 || ''} onChange={(v:string)=>setBloodBank({...bloodBank, availableYr2: v})} /></td>
                <td><InlineInput value={bloodBank.availableYr3 || ''} onChange={(v:string)=>setBloodBank({...bloodBank, availableYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <PageFooter />
        </div>

        {/* PAGE 6 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={6} />

          <div className="flex mb-4 text-[11.5pt] font-bold pl-8">
            <span className="w-12">IV.</span>
            <span className="w-full">Emergency Department/ Casualty Services</span>
          </div>

          <div className="flex items-center mb-6 pl-16 text-[11pt]">
            <span className="w-auto mr-4">Number of Beds <span className="font-bold italic">(Exclude beds in the Triage area)</span>:</span>
            <span className="w-64 border-b border-black"><InlineInput value={emergencyDept.beds} onChange={(v:string)=>setEmergencyDept({...emergencyDept, beds: v})} /></span>
          </div>

          <div className="mb-2 text-[11.5pt] font-bold pl-12">
            a. Equipment:
          </div>

          <table className="nmc-table tight-table text-[10.5pt] w-full mb-8">
            <thead>
              <tr className="text-center">
                <th className="w-[30%] font-bold">Name of the<br/>Equipment</th>
                <th className="w-[15%] font-bold">Numbers<br/>Available</th>
                <th className="w-[15%] font-bold">Functional<br/>Status</th>
                <th className="w-[40%] font-bold">Important Specifications in brief</th>
              </tr>
            </thead>
            <tbody>
              {emergencyEquips.map((equip:any, index:number) => (
                <tr key={equip.id}>
                  <td className="pl-2">{equip.name}</td>
                  <td><InlineInput value={equip.available} onChange={(v:string)=>{
                    const newEquips = [...emergencyEquips];
                    newEquips[index].available = v;
                    setEmergencyEquips(newEquips);
                  }} /></td>
                  <td><InlineInput value={equip.functional} onChange={(v:string)=>{
                    const newEquips = [...emergencyEquips];
                    newEquips[index].functional = v;
                    setEmergencyEquips(newEquips);
                  }} /></td>
                  <td><InlineInput value={equip.specs} onChange={(v:string)=>{
                    const newEquips = [...emergencyEquips];
                    newEquips[index].specs = v;
                    setEmergencyEquips(newEquips);
                  }} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-2 text-[11.5pt] font-bold pl-12">
            b. Specific Clinical/ Investigative Workload of the Emergency Department:
          </div>

          <table className="nmc-table tight-table text-[10.5pt] w-full">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[35%]">Particulars</th>
                <th className="w-[18%]">On the<br/>day of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[17%]">Year 3<br/>(Last<br/>Year)</th>
              </tr>
              <tr className="text-center font-bold">
                <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2">
                  Number of patients attended (in the green zone/ OPD of the Emergency Department) for OPD workload.<br/>
                  <span className="italic">(Write average daily attendance in columns 3, 4 and 5*)</span>
                </td>
                <td><InlineInput value={emergencyDept.patientsDay} onChange={(v:string)=>setEmergencyDept({...emergencyDept, patientsDay: v})} /></td>
                <td><InlineInput value={emergencyDept.patientsYr1} onChange={(v:string)=>setEmergencyDept({...emergencyDept, patientsYr1: v})} /></td>
                <td><InlineInput value={emergencyDept.patientsYr2} onChange={(v:string)=>setEmergencyDept({...emergencyDept, patientsYr2: v})} /></td>
                <td><InlineInput value={emergencyDept.patientsYr3} onChange={(v:string)=>setEmergencyDept({...emergencyDept, patientsYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <PageFooter />
        {/* PAGE 7 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={7} />
          
          <table className="nmc-table tight-table text-[10.5pt] w-full">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[35%]">Particulars</th>
                <th className="w-[18%]">On the<br/>day of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[17%]">Year 3<br/>(Last<br/>Year)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2">Admissions (number of patients admitted in Red and Yellow Zones).<br/><span className="italic">(Write average daily admission in columns 3, 4 and 5*)</span></td>
                <td><InlineInput value={emergencyWorkload.admissionsDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, admissionsDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.admissionsYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, admissionsYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.admissionsYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, admissionsYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.admissionsYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, admissionsYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Total number of patients admitted in the hospital through EM Deptt.</td>
                <td><InlineInput value={emergencyWorkload.totalAdmissionsDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, totalAdmissionsDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.totalAdmissionsYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, totalAdmissionsYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.totalAdmissionsYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, totalAdmissionsYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.totalAdmissionsYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, totalAdmissionsYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Bed occupancy for Percentage of Bed Occupancy</td>
                <td><InlineInput value={emergencyWorkload.bedOccPercDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bedOccPercDay: v})} /></td>
                <td className="text-center">X</td>
                <td className="text-center">X</td>
                <td className="text-center">X</td>
              </tr>
              <tr>
                <td className="pl-2">Bed occupancy for the whole year above 75% (Prepare a Data Table)</td>
                <td className="text-center">X</td>
                <td><InlineSelect options={['Yes', 'No']} value={emergencyWorkload.bedOccYearYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bedOccYearYr1: v})} /></td>
                <td><InlineSelect options={['Yes', 'No']} value={emergencyWorkload.bedOccYearYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bedOccYearYr2: v})} /></td>
                <td><InlineSelect options={['Yes', 'No']} value={emergencyWorkload.bedOccYearYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bedOccYearYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Number of Major surgeries for patients attending EM#</td>
                <td><InlineInput value={emergencyWorkload.majorSurgDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, majorSurgDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.majorSurgYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, majorSurgYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.majorSurgYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, majorSurgYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.majorSurgYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, majorSurgYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Number of Minor Surgery/Procedures in EM @</td>
                <td><InlineInput value={emergencyWorkload.minorSurgDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, minorSurgDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.minorSurgYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, minorSurgYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.minorSurgYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, minorSurgYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.minorSurgYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, minorSurgYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Details of the Procedures<br/><span className="italic">(Give the details in the Table given below)</span></td>
                <td></td><td></td><td></td><td></td>
              </tr>
              <tr>
                <td className="pl-2">Consumption of blood units for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.bloodUnitsDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bloodUnitsDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.bloodUnitsYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bloodUnitsYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.bloodUnitsYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bloodUnitsYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.bloodUnitsYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, bloodUnitsYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">X-rays per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.xraysDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, xraysDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.xraysYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, xraysYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.xraysYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, xraysYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.xraysYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, xraysYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Ultrasonography per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.usgDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, usgDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.usgYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, usgYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.usgYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, usgYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.usgYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, usgYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">CT scans per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.ctDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, ctDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.ctYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, ctYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.ctYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, ctYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.ctYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, ctYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">MRI scans per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.mriDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, mriDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.mriYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, mriYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.mriYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, mriYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.mriYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, mriYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">OPD Haematology workload per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.opdHemaDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdHemaDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdHemaYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdHemaYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdHemaYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdHemaYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdHemaYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdHemaYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">OPD Biochemistry workload per day for EM patients</td>
                <td><InlineInput value={emergencyWorkload.opdBioDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdBioDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdBioYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdBioYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdBioYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdBioYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdBioYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdBioYr3: v})} /></td>
              </tr>
            </tbody>
          </table>
          <PageFooter />
        </div>

        {/* PAGE 8 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={8} />

          <table className="nmc-table tight-table text-[10.5pt] w-full mb-4">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[35%]">Particulars</th>
                <th className="w-[18%]">On the<br/>day of<br/>Assessment</th>
                <th className="w-[15%]">Year 1</th>
                <th className="w-[15%]">Year 2</th>
                <th className="w-[17%]">Year 3<br/>(Last<br/>Year)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2 italic">(Write average of all 365 days in column 3,4,5)</td>
                <td></td><td></td><td></td><td></td>
              </tr>
              <tr>
                <td className="pl-2">OPD Microbiology workload per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.opdMicroDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdMicroDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdMicroYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdMicroYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdMicroYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdMicroYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.opdMicroYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, opdMicroYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">ABG per day for EM patients <br/><span className="italic">(Write average of all 365 days in column 3,4,5)</span></td>
                <td><InlineInput value={emergencyWorkload.abgDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, abgDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.abgYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, abgYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.abgYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, abgYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.abgYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, abgYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Cardiac biomarkers per day (average) for EM patients</td>
                <td><InlineInput value={emergencyWorkload.cardiacDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, cardiacDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.cardiacYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, cardiacYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.cardiacYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, cardiacYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.cardiacYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, cardiacYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2">Total deaths in the EM Department</td>
                <td><InlineInput value={emergencyWorkload.deathsDay} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, deathsDay: v})} /></td>
                <td><InlineInput value={emergencyWorkload.deathsYr1} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, deathsYr1: v})} /></td>
                <td><InlineInput value={emergencyWorkload.deathsYr2} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, deathsYr2: v})} /></td>
                <td><InlineInput value={emergencyWorkload.deathsYr3} onChange={(v)=>setEmergencyWorkload({...emergencyWorkload, deathsYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <div className="text-[11pt] space-y-4 px-8 mb-6">
            <div className="flex">
              <span className="w-8">*</span>
              <span className="flex-1">Average daily attendance is calculated as below.<br/><span className="italic">Total patients attending EM in the year divided by total number of days in a year</span></span>
            </div>
            <div className="flex">
              <span className="w-8">#</span>
              <span className="flex-1">Total number of major surgeries of patients shifted to Hospital/Operating Room directly from ED or are operated in the ED Operation Theatre.</span>
            </div>
            <div className="flex">
              <span className="w-8">@</span>
              <span className="flex-1">Minor Operation can be those that are done in the Procedure Room /Minor Operation Room inside the ED. These may include wound wash/debridement in the ED, wound suturing or removal, K-wiring, dislocation reduction, etc.</span>
            </div>
          </div>

          <div className="text-center font-bold text-[11.5pt] mb-4">Details of Procedures</div>

          <table className="nmc-table tight-table text-[10.5pt] w-[80%] mx-auto mb-8">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[50%]">Procedures</th>
                <th className="w-[25%]">On the day of<br/>Assessment</th>
                <th className="w-[25%]">(Last Year)</th>
              </tr>
            </thead>
            <tbody>
              {emergencyProcs.slice(0, 8).map((proc, idx) => (
                <tr key={proc.id}>
                  <td className="pl-2">{proc.name}</td>
                  <td><InlineInput value={proc.day} onChange={(v)=>{
                    const np = [...emergencyProcs]; np[idx].day = v; setEmergencyProcs(np);
                  }} /></td>
                  <td><InlineInput value={proc.lastYear} onChange={(v)=>{
                    const np = [...emergencyProcs]; np[idx].lastYear = v; setEmergencyProcs(np);
                  }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <PageFooter />
        </div>

        {/* PAGE 9 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={9} />

          <table className="nmc-table tight-table text-[10.5pt] w-[80%] mx-auto mb-8">
            <tbody>
              {emergencyProcs.slice(8).map((proc, idx) => {
                const rIdx = idx + 8;
                return (
                <tr key={proc.id}>
                  <td className="w-[50%] pl-2">{proc.name}</td>
                  <td className="w-[25%]"><InlineInput value={proc.day} onChange={(v)=>{
                    const np = [...emergencyProcs]; np[rIdx].day = v; setEmergencyProcs(np);
                  }} /></td>
                  <td className="w-[25%]"><InlineInput value={proc.lastYear} onChange={(v)=>{
                    const np = [...emergencyProcs]; np[rIdx].lastYear = v; setEmergencyProcs(np);
                  }} /></td>
                </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex mb-4 text-[11.5pt] font-bold pl-8">
            <span className="w-12">V.</span>
            <span className="w-full">Intensive Care Facility:</span>
          </div>

          <div className="pl-16 mb-4 space-y-2 text-[11pt]">
            <div className="flex items-center">
              <span className="w-[300px]">Total intensive care unit beds in hospital:</span>
              <span className="w-32 border-b border-black"><InlineInput value={intensiveCare.totalBeds} onChange={(v)=>setIntensiveCare({...intensiveCare, totalBeds: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-[300px]">Total and high dependency beds in hospital:</span>
              <span className="w-32 border-b border-black"><InlineInput value={intensiveCare.hduBeds} onChange={(v)=>setIntensiveCare({...intensiveCare, hduBeds: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-[450px]">Total Post-operative/ Post Anaesthesia care unit beds in hospital:</span>
              <span className="w-32 border-b border-black"><InlineInput value={intensiveCare.pacuBeds} onChange={(v)=>setIntensiveCare({...intensiveCare, pacuBeds: v})} /></span>
            </div>
          </div>

          <div className="font-bold text-[11pt] pl-12 mb-2">Intensive care facilities:</div>
          <table className="nmc-table tight-table text-[10.5pt] w-full mb-8">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[20%]">Type</th>
                <th className="w-[15%]">Managed by<br/>which<br/>Department</th>
                <th className="w-[10%]">Number<br/>of total<br/>beds</th>
                <th className="w-[25%]">List of Major Equipment<br/>and their Numbers</th>
                <th className="w-[15%]">Bed<br/>occupancy on<br/>the day of<br/>Assessment</th>
                <th className="w-[15%]">Average<br/>bed<br/>occupancy<br/>for the last<br/>year</th>
              </tr>
            </thead>
            <tbody>
              {icuFacilities.map((icu, idx) => (
                <tr key={icu.id}>
                  <td className="pl-2">
                    {idx < 6 ? icu.type : <InlineInput value={icu.type} onChange={(v)=>{
                      const n = [...icuFacilities]; n[idx].type = v; setIcuFacilities(n);
                    }} placeholder="Any other ICU" />}
                  </td>
                  <td><InlineInput value={icu.managedBy} onChange={(v)=>{
                    const n = [...icuFacilities]; n[idx].managedBy = v; setIcuFacilities(n);
                  }} /></td>
                  <td><InlineInput value={icu.beds} onChange={(v)=>{
                    const n = [...icuFacilities]; n[idx].beds = v; setIcuFacilities(n);
                  }} /></td>
                  <td><InlineInput value={icu.equipment} onChange={(v)=>{
                    const n = [...icuFacilities]; n[idx].equipment = v; setIcuFacilities(n);
                  }} /></td>
                  <td><InlineInput value={icu.occDay} onChange={(v)=>{
                    const n = [...icuFacilities]; n[idx].occDay = v; setIcuFacilities(n);
                  }} /></td>
                  <td><InlineInput value={icu.occYear} onChange={(v)=>{
                    const n = [...icuFacilities]; n[idx].occYear = v; setIcuFacilities(n);
                  }} /></td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="text-center p-1">
                  <button onClick={() => setIcuFacilities([...icuFacilities, { id: generateId(), type: '', managedBy: '', beds: '', equipment: '', occDay: '', occYear: '' }])}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 text-sm">
                    + Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex mb-4 text-[11.5pt] font-bold pl-8">
            <span className="w-12">VI.</span>
            <span className="w-full">Dialysis:</span>
          </div>

          <div className="pl-16 space-y-4 text-[11pt]">
            <div className="flex items-center">
              <span className="w-8">a.</span>
              <span className="w-[250px]">Number of Beds:</span>
              <span className="w-48 border-b border-black"><InlineInput value={dialysis.beds} onChange={(v)=>setDialysis({...dialysis, beds: v})} /></span>
            </div>
            <div className="flex items-center">
              <span className="w-8">b.</span>
              <span className="w-[250px]">Number of Hemodialysis Machines:</span>
              <span className="w-48 border-b border-black"><InlineInput value={dialysis.machines} onChange={(v)=>setDialysis({...dialysis, machines: v})} /></span>
            </div>
          </div>

          <PageFooter />
        </div>

        {/* PAGE 10 */}
        <div className="a4-page portrait-page print-page relative flex flex-col">
          <PageHeader pageNum={10} />

          <table className="nmc-table tight-table text-[10pt] w-full mb-2">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[35%] p-0"></th>
                <th className="w-[18%] p-0">On the<br/>day of<br/>assessment</th>
                <th className="w-[15%] p-0">Year 1</th>
                <th className="w-[15%] p-0">Year 2</th>
                <th className="w-[17%] p-0">Year 3<br/>(last year)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2 py-0">Total Hemodialysis</td>
                <td className="p-0"><InlineInput value={dialysis.hemoDay} onChange={(v)=>setDialysis({...dialysis, hemoDay: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.hemoYr1} onChange={(v)=>setDialysis({...dialysis, hemoYr1: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.hemoYr2} onChange={(v)=>setDialysis({...dialysis, hemoYr2: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.hemoYr3} onChange={(v)=>setDialysis({...dialysis, hemoYr3: v})} /></td>
              </tr>
              <tr>
                <td className="pl-2 py-0">Total Peritoneal Dialysis</td>
                <td className="p-0"><InlineInput value={dialysis.periDay} onChange={(v)=>setDialysis({...dialysis, periDay: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.periYr1} onChange={(v)=>setDialysis({...dialysis, periYr1: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.periYr2} onChange={(v)=>setDialysis({...dialysis, periYr2: v})} /></td>
                <td className="p-0"><InlineInput value={dialysis.periYr3} onChange={(v)=>setDialysis({...dialysis, periYr3: v})} /></td>
              </tr>
            </tbody>
          </table>

          <div className="flex mb-1 text-[11pt] font-bold pl-8">
            <span className="w-12">VII.</span>
            <span className="w-full">Radiology Department:</span>
          </div>

          <div className="mb-1 text-[10.5pt] font-bold pl-12">
            a. Equipment:
          </div>

          <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[5%] p-0">Sl.<br/>No.</th>
                <th className="w-[25%] p-0">Name of the<br/>Equipment</th>
                <th className="w-[15%] p-0">Numbers<br/>Available</th>
                <th className="w-[15%] p-0">Functional<br/>Status</th>
                <th className="w-[40%] p-0">Important Specifications in brief</th>
              </tr>
            </thead>
            <tbody>
              {radiologyEquips.map((eq:any, idx:number) => (
                <tr key={eq.id}>
                  <td className="text-center py-0">{idx + 1}.</td>
                  <td className="pl-2 py-0">
                    {idx < 9 ? <span className="whitespace-pre-wrap">{eq.name}</span> : <InlineInput value={eq.name} onChange={(v)=>{
                      const n = [...radiologyEquips]; n[idx].name = v; setRadiologyEquips(n);
                    }} placeholder="Any other equipment" />}
                  </td>
                  <td className="p-0"><InlineInput value={eq.available} onChange={(v)=>{
                    const n = [...radiologyEquips]; n[idx].available = v; setRadiologyEquips(n);
                  }} /></td>
                  <td className="p-0"><InlineInput value={eq.functional} onChange={(v)=>{
                    const n = [...radiologyEquips]; n[idx].functional = v; setRadiologyEquips(n);
                  }} /></td>
                  <td className="p-0"><InlineInput value={eq.specs} onChange={(v)=>{
                    const n = [...radiologyEquips]; n[idx].specs = v; setRadiologyEquips(n);
                  }} /></td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="text-center p-0">
                  <button onClick={() => setRadiologyEquips([...radiologyEquips, { id: generateId(), name: '', available: '', functional: '', specs: '' }])}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 text-xs">
                    + Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-1 text-[10.5pt] font-bold pl-12">
            b. Clinical workload of the Radio-diagnosis Department:
          </div>
          
          <table className="nmc-table tight-table text-[9.5pt] w-full mb-2">
            <thead>
              <tr className="text-center font-bold">
                <th className="w-[35%] p-0">Parameter</th>
                <th className="w-[18%] p-0">On the day<br/>of<br/>assessment</th>
                <th className="w-[15%] p-0">Year 1</th>
                <th className="w-[15%] p-0">Year 2</th>
                <th className="w-[17%] p-0">Year 3<br/>(Last<br/>Year)</th>
              </tr>
              <tr className="text-center font-bold">
                <td className="p-0">(1)</td><td className="p-0">(2)</td><td className="p-0">(3)</td><td className="p-0">(4)</td><td className="p-0">(5)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-2 font-bold py-0 leading-tight">Total Plain X-rays (write average of all working days in a year in column 3, 4, 5)</td>
                <td className="p-0"><InlineInput value={radiologyWorkload.plainXraysDay} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, plainXraysDay: v})} /></td>
                <td className="p-0"><InlineInput value={radiologyWorkload.plainXraysYr1} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, plainXraysYr1: v})} /></td>
                <td className="p-0"><InlineInput value={radiologyWorkload.plainXraysYr2} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, plainXraysYr2: v})} /></td>
                <td className="p-0"><InlineInput value={radiologyWorkload.plainXraysYr3} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, plainXraysYr3: v})} /></td>
              </tr>
              {[
                ['IVP', 'ivp'],
                ['Barium Swallow', 'swallow'],
                ['Barium Upper GI studies', 'gi'],
                ['Barium Meal Follow through', 'meal'],
                ['Barium Enema', 'enema'],
                ['HSG', 'hsg'],
                ['Silography', 'silography'],
                ['Urethrogram', 'urethrogram'],
                ['MCUG', 'mcug'],
                ['Fistulography/Sinography', 'fistulo'],
                ['Total Number of Ultrasonography', 'totalUsg'],
                ['Number of Ultrasonography\n(write average of all working days in a year in column 3, 4, 5)', 'numUsg'],
                ['Doppler studies for abdominal vessels and scrotal conditions', 'dopplerAbd'],
                ['Doppler study for peripheral vessels', 'dopplerPeri'],
                ['Doppler study for carotid vessels', 'dopplerCar'],
                ['Other Doppler studies', 'dopplerOth'],
                ['USG Guided procedures-FNAC/ Biopsy', 'usgFnac'],
                ['USG Guided procedures –aspiration/intervention', 'usgAsp'],
                ['Total CT scan', 'totalCt']
              ].map(([label, key]) => (
                <tr key={key}>
                  <td className="pl-2 whitespace-pre-wrap py-0 leading-tight">{label}</td>
                  <td className="p-0"><InlineInput value={(radiologyWorkload as any)[key + 'Day']} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, [key + 'Day']: v})} /></td>
                  <td className="p-0"><InlineInput value={(radiologyWorkload as any)[key + 'Yr1']} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, [key + 'Yr1']: v})} /></td>
                  <td className="p-0"><InlineInput value={(radiologyWorkload as any)[key + 'Yr2']} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, [key + 'Yr2']: v})} /></td>
                  <td className="p-0"><InlineInput value={(radiologyWorkload as any)[key + 'Yr3']} onChange={(v)=>setRadiologyWorkload({...radiologyWorkload, [key + 'Yr3']: v})} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <PageFooter />
        </div>

        </div>
      </div>
    </div>
  );
}










