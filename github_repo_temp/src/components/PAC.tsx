import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ArrowLeft, ArrowRight, Printer, Download, Save, CheckCircle, AlertTriangle, FileSignature, X } from "lucide-react";
import { PACRecord } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { translations } from "../translations";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, orderBy } from "firebase/firestore";
import DatePickerInput from './ui/DatePickerInput';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const emptyPacForm: Omit<PACRecord, 'id'> = {
  patient_name: "", age: 0, sex: "Male", uhid: "", ward_bed: "", date_of_admission: "", surgery_date: "", surgeon: "",
  diagnosis: "", procedure: "", elective_emergency: "Elective", comorbidities: [], past_surgery: "", prev_anesthesia_comp: "", drug_history: "", allergy_history: "", addiction: [], family_history: "",
  pulse_rate: "", blood_pressure: "", spo2: "", respiratory_rate: "", temperature: "", general_exam_pallor: false, general_exam_icterus: false, general_exam_cyanosis: false, general_exam_clubbing: false, general_exam_edema: false, general_exam_lymph: false, airway_mallampati: "Class I", airway_mouth_opening: "Adequate", airway_neck_movement: "Adequate", airway_teeth: "Normal", cvs: "", rs: "", cns: "", pa: "", spine: "Normal",
  hb: "", platelets: "", blood_group: "", creatinine: "", rbs: "", electrolytes_na: "", electrolytes_k: "", ecg: "", cxr: "", pt_inr: "", ct_bt: "", viral_hiv: "Non-Reactive", viral_hbsag: "Non-Reactive", viral_hcv: "Non-Reactive", usg_imaging: "",
  asa_grade: "", risk: "", nbm_hours: "8", premedication: "", blood_required: "None", anesthesia_type: "GA", airway_plan: "Intubation", post_op_plan: "Ward", consent_anesthesia: false, consent_high_risk: false,
  fitness: "", remarks: ""
};

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, isFull = false, name, error }: any) => {
  const inputClass = `w-full px-4 py-3 rounded-2xl border focus:ring-4 outline-none transition-all font-medium ${error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500 bg-red-50/10 text-slate-900' : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/30 focus:bg-white text-slate-800'}`;
  
  return (
    <div className={isFull ? "col-span-full" : ""}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {type === 'date' ? (
        <DatePickerInput value={value} onChange={onChange} required={required} placeholder={placeholder} className={inputClass} />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClass}
        />
      )}
      {error && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{error}</p>}
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, isFull = false, required = false, error }: any) => (
  <div className={isFull ? "col-span-full" : ""}>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`w-full px-4 py-3 rounded-2xl border focus:ring-4 outline-none transition-all font-medium appearance-none ${error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500 bg-red-50/10 text-slate-900' : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/30 focus:bg-white text-slate-800'}`}
    >
      <option value="" disabled>Select...</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
    {error && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{error}</p>}
  </div>
);

export default function PAC() {
  const [records, setRecords] = useState<PACRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFitness, setFilterFitness] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Omit<PACRecord, 'id'> | PACRecord>(emptyPacForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const printRef = React.useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { role, userData } = useAuth();

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    showToast("Preparing medical record for print...", "info");
    
    // Create a new window for printing to bypass iframe restrictions
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print medical records.", "error");
      return;
    }

    const printContent = printRef.current?.innerHTML || "";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>PAC Record - ${formData.patient_name || 'Patient'}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
            .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; box-shadow: none; }
            @media print {
              body { background: white !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="print-page p-12">
            ${printContent}
          </div>
          <script>
            window.onload = () => {
              window.focus();
              setTimeout(() => {
                window.print();
                // window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Load from Firebase AND Offline
  useEffect(() => {
    // Attempt online load
    const q = query(collection(db, "pac_records"), orderBy("updated_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PACRecord[];
      setRecords(docs);
      
      // Sync to local storage
      localStorage.setItem("pac_records_offline", JSON.stringify(docs));
    }, (error) => {
      console.error("Firestore error, falling back to offline:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, "pac_records");
      } catch (e) {}
      loadOfflineRecords();
    });

    return () => unsubscribe();
  }, []);

  const loadOfflineRecords = () => {
    try {
      const offline = localStorage.getItem("pac_records_offline");
      if (offline) {
        setRecords(JSON.parse(offline));
        showToast("Loaded offline PAC records", "info");
      }
    } catch (e) {
      console.error("Failed to load offline records", e);
    }
  };

  // Smart Features hook
  useEffect(() => {
    let newFormData = { ...formData };
    let changed = false;

    // Check Hb
    if (newFormData.hb !== '' && Number(newFormData.hb) < 10) {
      if (newFormData.fitness !== 'Conditional') {
        newFormData.fitness = 'Conditional';
        changed = true;
      }
    }

    // BP check
    if (newFormData.blood_pressure) {
      const parts = newFormData.blood_pressure.split('/');
      if (parts.length === 2) {
        const sys = Number(parts[0]);
        const dia = Number(parts[1]);
        if (sys > 140 || dia > 90) {
          if (newFormData.fitness !== 'Conditional') {
            newFormData.fitness = 'Conditional';
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setFormData(prev => ({ ...prev, fitness: newFormData.fitness }));
    }
  }, [formData.hb, formData.blood_pressure, formData.comorbidities, formData.age]);

  const handleSave = async () => {
    // Client-side Validation helper
    const validate = () => {
      const e: Record<string, string> = {};
      if (!formData.patient_name || formData.patient_name.trim().length < 2) e.patient_name = "Patient name must be at least 2 characters.";
      if (!formData.uhid || formData.uhid.trim().length < 1) e.uhid = "UHID is required.";
      if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 150) e.age = "Valid age (1-150) is required.";
      if (!formData.ward_bed) e.ward_bed = "Ward / Bed is required.";
      if (!formData.date_of_admission) e.date_of_admission = "Date of Admission is required.";
      if (!formData.surgery_date) e.surgery_date = "Surgery Date is required.";
      if (formData.date_of_admission && formData.surgery_date) {
        if (new Date(formData.surgery_date) < new Date(formData.date_of_admission)) {
          e.surgery_date = "Surgery Date cannot be before the Date of Admission.";
        }
      }
      if (!formData.surgeon) e.surgeon = "Surgeon name is required.";
      if (!formData.diagnosis) e.diagnosis = "Diagnosis is required.";
      if (!formData.procedure) e.procedure = "Procedure is required.";
      if (!formData.fitness) e.fitness = "Fitness determination is required.";
      
      // Numeric range validations
      const checkRange = (val: any, fieldKey: string, name: string, min: number, max: number) => {
        if (val !== '') {
          const num = Number(val);
          if (isNaN(num) || num < min || num > max) {
            e[fieldKey] = `${name} must be a valid number between ${min} and ${max}.`;
          }
        }
      };

      checkRange(formData.pulse_rate, "pulse_rate", "Pulse Rate", 0, 300);
      checkRange(formData.spo2, "spo2", "SpO2", 0, 100);
      checkRange(formData.respiratory_rate, "respiratory_rate", "Respiratory Rate", 0, 100);
      checkRange(formData.hb, "hb", "Hemoglobin", 0, 25);
      checkRange(formData.temperature, "temperature", "Temperature (°F)", 70, 115);
      
      if (formData.blood_pressure && !/^\d{2,3}\/\d{2,3}$/.test(formData.blood_pressure)) {
        e.blood_pressure = "Blood Pressure must be in format SYS/DIA (e.g. 120/80).";
      }
      
      return e;
    };

    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      showToast(errors[firstErrorKey], "error");

      const step1Props = ['patient_name', 'uhid', 'age', 'ward_bed', 'date_of_admission', 'surgery_date', 'surgeon'];
      const step2Props = ['diagnosis', 'procedure'];
      const step3Props = ['blood_pressure', 'pulse_rate', 'spo2', 'respiratory_rate', 'temperature', 'cvs', 'rs', 'cns', 'pa', 'spine'];
      const step4Props = ['hb', 'platelets', 'blood_group', 'creatinine', 'rbs', 'electrolytes_na', 'electrolytes_k', 'pt_inr', 'viral_hiv', 'viral_hbsag', 'viral_hcv', 'ecg', 'cxr'];
      const step5Props = ['asa_grade', 'risk', 'nbm_hours', 'premedication', 'blood_required', 'anesthesia_type', 'airway_plan', 'post_op_plan'];
      
      if (step1Props.includes(firstErrorKey)) setCurrentStep(1);
      else if (step2Props.includes(firstErrorKey)) setCurrentStep(2);
      else if (step3Props.includes(firstErrorKey)) setCurrentStep(3);
      else if (step4Props.includes(firstErrorKey)) setCurrentStep(4);
      else if (step5Props.includes(firstErrorKey)) setCurrentStep(5);
      else setCurrentStep(6);

      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const isOnline = navigator.onLine;
      const pacId = (formData as PACRecord).id || `PAC-${Date.now()}`;
      
      const payload = {
        ...formData,
        id: pacId,
        updated_at: new Date().toISOString()
      };

      if (isOnline) {
        try {
          await setDoc(doc(db, "pac_records", pacId), payload);
          showToast("PAC Record saved to cloud", "success");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `pac_records/${pacId}`);
        }
      } else {
        // Save to offline storage
        let offlineRecords: PACRecord[] = [];
        try {
          offlineRecords = JSON.parse(localStorage.getItem("pac_records_offline") || "[]");
        } catch(e) {}
        
        const existingIndex = offlineRecords.findIndex(r => r.id === pacId);
        if (existingIndex >= 0) {
          offlineRecords[existingIndex] = payload as PACRecord;
        } else {
          offlineRecords.unshift(payload as PACRecord);
        }
        localStorage.setItem("pac_records_offline", JSON.stringify(offlineRecords));
        setRecords(offlineRecords);
        showToast("Saved offline. Will sync when online.", "success");
      }

      setIsFormOpen(false);
      setFormData(emptyPacForm);
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Save error:", error);
      let message = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) message = `Permission Denied or Invalid Data: ${parsed.error}`;
      } catch (e) {}
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        if (navigator.onLine) {
          try {
            await deleteDoc(doc(db, "pac_records", deleteId));
            showToast("Deleted from cloud", "success");
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `pac_records/${deleteId}`);
          }
        } else {
          let offlineRecords: PACRecord[] = JSON.parse(localStorage.getItem("pac_records_offline") || "[]");
          offlineRecords = offlineRecords.filter(r => r.id !== deleteId);
          localStorage.setItem("pac_records_offline", JSON.stringify(offlineRecords));
          setRecords(offlineRecords);
          showToast("Deleted offline", "success");
        }
        setDeleteModalOpen(false);
        setDeleteId(null);
      } catch (error: any) {
        console.error("Delete error:", error);
        let message = error.message;
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error) message = `Permission Denied: ${parsed.error}`;
        } catch (e) {}
        setDeleteError(message);
      }
    }
  };

  const openNew = () => {
    setFormData({ 
      ...emptyPacForm, 
      id: `PAC-${Date.now()}`, 
      created_at: new Date().toISOString(),
      // Auto-fill from profile if doctor
      surgeon: role === 'doctor' && userData?.name ? userData.name : emptyPacForm.surgeon
    });
    setFormErrors({});
    setCurrentStep(1);
    setIsReadOnly(false);
    setIsFormOpen(true);
  };

  const openView = (record: PACRecord) => {
    setFormData(record);
    setFormErrors({});
    setIsReadOnly(true);
    setIsFormOpen(true);
  };

  const openEdit = (record: PACRecord) => {
    setFormData(record);
    setFormErrors({});
    setCurrentStep(1);
    setIsReadOnly(false);
    setIsFormOpen(true);
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.uhid.includes(searchQuery);
    const matchFilter = filterFitness ? r.fitness === filterFitness : true;
    return matchSearch && matchFilter;
  });

  const renderStepIndicators = () => {
    const steps = ["Identification", "History", "Examination", "Investigations", "Plan & Consent", "Review"];
    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 custom-scrollbar">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-col items-center min-w-[80px] opacity-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${currentStep === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50' : currentStep > i + 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {currentStep > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-xs font-bold text-center ${currentStep === i + 1 ? 'text-indigo-600' : 'text-slate-400'}`}>{s}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleNextOrSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderFormStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Patient Name" name="patient_name" error={formErrors.patient_name} value={formData.patient_name} onChange={(v: string) => setFormData({...formData, patient_name: v})} required />
          <InputField label="UHID" name="uhid" error={formErrors.uhid} value={formData.uhid} onChange={(v: string) => setFormData({...formData, uhid: v})} required />
          <InputField label="Age" name="age" error={formErrors.age} value={formData.age} type="number" onChange={(v: string) => setFormData({...formData, age: Number(v)})} required />
          <SelectField label="Sex" name="sex" error={formErrors.sex} value={formData.sex} onChange={(v: string) => setFormData({...formData, sex: v})} options={["Male", "Female", "Other"]} />
          <InputField label="Ward / Bed" name="ward_bed" error={formErrors.ward_bed} value={formData.ward_bed} onChange={(v: string) => setFormData({...formData, ward_bed: v})} required />
          <InputField label="Date of Admission" name="date_of_admission" error={formErrors.date_of_admission} value={formData.date_of_admission} onChange={(v: string) => setFormData({...formData, date_of_admission: v})} type="date" required />
          <InputField label="Surgery Date" name="surgery_date" error={formErrors.surgery_date} value={formData.surgery_date} onChange={(v: string) => setFormData({...formData, surgery_date: v})} type="date" required />
          <InputField label="Surgeon" name="surgeon" error={formErrors.surgeon} value={formData.surgeon} onChange={(v: string) => setFormData({...formData, surgeon: v})} required />
        </div>
      );
      case 2: return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Diagnosis" name="diagnosis" error={formErrors.diagnosis} value={formData.diagnosis} onChange={(v: string) => setFormData({...formData, diagnosis: v})} isFull required />
          <InputField label="Procedure" name="procedure" error={formErrors.procedure} value={formData.procedure} onChange={(v: string) => setFormData({...formData, procedure: v})} isFull required />
          <SelectField label="Type" name="elective_emergency" error={formErrors.elective_emergency} value={formData.elective_emergency} onChange={(v: string) => setFormData({...formData, elective_emergency: v as any})} options={["Elective", "Emergency"]} />
          <div className="col-span-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Comorbidities (Comma separated)</label>
            <input type="text" name="comorbidities" value={formData.comorbidities.join(', ')} onChange={(e) => setFormData({...formData, comorbidities: e.target.value.split(',').map(s=>s.trim())})} placeholder="e.g. HTN, DM, IHD" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/30" />
          </div>
          <InputField label="Past Surgery" name="past_surgery" error={formErrors.past_surgery} value={formData.past_surgery} onChange={(v: string) => setFormData({...formData, past_surgery: v})} />
          <InputField label="Drug History" name="drug_history" error={formErrors.drug_history} value={formData.drug_history} onChange={(v: string) => setFormData({...formData, drug_history: v})} />
          <InputField label="Allergy History" name="allergy_history" error={formErrors.allergy_history} value={formData.allergy_history} onChange={(v: string) => setFormData({...formData, allergy_history: v})} />
          <InputField label="Prev Anesthesia Complications" name="prev_anesthesia_comp" error={formErrors.prev_anesthesia_comp} value={formData.prev_anesthesia_comp} onChange={(v: string) => setFormData({...formData, prev_anesthesia_comp: v})} />
          <div className="col-span-full">
            <InputField label="Addiction (Tobacco, Alcohol, etc)" name="addiction" error={formErrors.addiction} value={formData.addiction.join(', ')} onChange={(v: string) => setFormData({...formData, addiction: v.split(',').map(s=>s.trim())})} placeholder="Comma separated" />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-10">
          <div>
            <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span> VITALS & GENERAL EXAMINATION
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <InputField label="BP (mmHg)" name="blood_pressure" error={formErrors.blood_pressure} value={formData.blood_pressure} onChange={(v: string) => setFormData({...formData, blood_pressure: v})} placeholder="120/80" required />
              <InputField label="Pulse (bpm)" name="pulse_rate" error={formErrors.pulse_rate} value={formData.pulse_rate} onChange={(v: string) => setFormData({...formData, pulse_rate: v ? Number(v) : ''})} type="number" required />
              <InputField label="SpO2 (%)" name="spo2" error={formErrors.spo2} value={formData.spo2} onChange={(v: string) => setFormData({...formData, spo2: v ? Number(v) : ''})} type="number" required />
              <InputField label="RR (/min)" name="respiratory_rate" error={formErrors.respiratory_rate} value={formData.respiratory_rate} onChange={(v: string) => setFormData({...formData, respiratory_rate: v ? Number(v) : ''})} type="number" />
              <InputField label="Temp (°F)" name="temperature" error={formErrors.temperature} value={formData.temperature} onChange={(v: string) => setFormData({...formData, temperature: v ? Number(v) : ''})} type="number" />
            </div>
            {formData.blood_pressure && Number(formData.blood_pressure.split('/')[0]) > 140 && (
              <span className="text-xs text-red-500 font-bold mt-3 px-3 py-1 bg-red-50 rounded-lg inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> High BP Warning</span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> AIRAWAY & NECK
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <SelectField label="Mallampati" name="airway_mallampati" error={formErrors.airway_mallampati} value={formData.airway_mallampati} onChange={(v: string) => setFormData({...formData, airway_mallampati: v})} options={["Class I", "Class II", "Class III", "Class IV"]} />
               <SelectField label="Mouth Opening" name="airway_mouth_opening" error={formErrors.airway_mouth_opening} value={formData.airway_mouth_opening} onChange={(v: string) => setFormData({...formData, airway_mouth_opening: v})} options={["Adequate", "Inadequate"]} />
               <SelectField label="Neck Movement" name="airway_neck_movement" error={formErrors.airway_neck_movement} value={formData.airway_neck_movement} onChange={(v: string) => setFormData({...formData, airway_neck_movement: v})} options={["Adequate", "Restricted"]} />
               <SelectField label="Teeth" name="airway_teeth" error={formErrors.airway_teeth} value={formData.airway_teeth} onChange={(v: string) => setFormData({...formData, airway_teeth: v})} options={["Normal", "Loose/Missing", "Dentures"]} />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> SYSTEMIC REVIEW
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="CVS" name="cvs" error={formErrors.cvs} value={formData.cvs} onChange={(v: string) => setFormData({...formData, cvs: v})} required />
              <InputField label="RS" name="rs" error={formErrors.rs} value={formData.rs} onChange={(v: string) => setFormData({...formData, rs: v})} required />
              <InputField label="CNS" name="cns" error={formErrors.cns} value={formData.cns} onChange={(v: string) => setFormData({...formData, cns: v})} />
              <InputField label="Abdomen / PA" name="pa" error={formErrors.pa} value={formData.pa} onChange={(v: string) => setFormData({...formData, pa: v})} />
              <InputField label="Spine" name="spine" error={formErrors.spine} value={formData.spine} onChange={(v: string) => setFormData({...formData, spine: v})} isFull />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-8">
           <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span> CLINICAL INVESTIGATIONS
            </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InputField label="Hb (g/dL)" name="hb" error={formErrors.hb} value={formData.hb} onChange={(v: string) => setFormData({...formData, hb: v ? Number(v) : ''})} type="number" required />
            <InputField label="Platelets" name="platelets" error={formErrors.platelets} value={formData.platelets} onChange={(v: string) => setFormData({...formData, platelets: v ? Number(v) : ''})} type="number" />
            <InputField label="Blood Group" name="blood_group" error={formErrors.blood_group} value={formData.blood_group} onChange={(v: string) => setFormData({...formData, blood_group: v})} required />
            <InputField label="Creatinine" name="creatinine" error={formErrors.creatinine} value={formData.creatinine} onChange={(v: string) => setFormData({...formData, creatinine: v ? Number(v) : ''})} type="number" />
            <InputField label="RBS (mg/dL)" name="rbs" error={formErrors.rbs} value={formData.rbs} onChange={(v: string) => setFormData({...formData, rbs: v ? Number(v) : ''})} type="number" />
            <InputField label="Na+ (mmol/L)" name="electrolytes_na" error={formErrors.electrolytes_na} value={formData.electrolytes_na} onChange={(v: string) => setFormData({...formData, electrolytes_na: v ? Number(v) : ''})} type="number" />
            <InputField label="K+ (mmol/L)" name="electrolytes_k" error={formErrors.electrolytes_k} value={formData.electrolytes_k} onChange={(v: string) => setFormData({...formData, electrolytes_k: v ? Number(v) : ''})} type="number" />
            <InputField label="PT/INR" name="pt_inr" error={formErrors.pt_inr} value={formData.pt_inr} onChange={(v: string) => setFormData({...formData, pt_inr: v})} />
          </div>
          {formData.hb && Number(formData.hb) < 10 && (
             <span className="text-xs text-amber-600 font-bold px-3 py-1 bg-amber-50 rounded-lg flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3"/> Low Hemoglobin Warning</span>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <SelectField label="HIV" name="viral_hiv" error={formErrors.viral_hiv} value={formData.viral_hiv} onChange={(v: string) => setFormData({...formData, viral_hiv: v})} options={["Non-Reactive", "Reactive"]} />
            <SelectField label="HBsAg" name="viral_hbsag" error={formErrors.viral_hbsag} value={formData.viral_hbsag} onChange={(v: string) => setFormData({...formData, viral_hbsag: v})} options={["Non-Reactive", "Reactive"]} />
            <SelectField label="HCV" name="viral_hcv" error={formErrors.viral_hcv} value={formData.viral_hcv} onChange={(v: string) => setFormData({...formData, viral_hcv: v})} options={["Non-Reactive", "Reactive"]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="ECG Findings" name="ecg" error={formErrors.ecg} value={formData.ecg} onChange={(v: string) => setFormData({...formData, ecg: v})} />
            <InputField label="Chest X-Ray" name="cxr" error={formErrors.cxr} value={formData.cxr} onChange={(v: string) => setFormData({...formData, cxr: v})} />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-8">
          <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span> ANAESTHESIA PLAN & CONSENT
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectField label="ASA Grade" name="asa_grade" error={formErrors.asa_grade} value={formData.asa_grade} onChange={(v: string) => setFormData({...formData, asa_grade: v})} options={["I", "II", "III", "IV", "V", "VI", "IE", "IIE", "IIIE", "IVE", "VE"]} />
            <SelectField label="Surgical Risk" name="risk" error={formErrors.risk} value={formData.risk} onChange={(v: string) => setFormData({...formData, risk: v as any})} options={["Low", "Moderate", "High"]} />
            <InputField label="NBM Hours" name="nbm_hours" error={formErrors.nbm_hours} value={formData.nbm_hours} onChange={(v: string) => setFormData({...formData, nbm_hours: v})} />
            <InputField label="Premedication" name="premedication" error={formErrors.premedication} value={formData.premedication} onChange={(v: string) => setFormData({...formData, premedication: v})} />
            <InputField label="Blood Required" name="blood_required" error={formErrors.blood_required} value={formData.blood_required} onChange={(v: string) => setFormData({...formData, blood_required: v})} />
            <SelectField label="Planned Anaesthesia" name="anesthesia_type" error={formErrors.anesthesia_type} value={formData.anesthesia_type} onChange={(v: string) => setFormData({...formData, anesthesia_type: v})} options={["GA", "Spinal", "Epidural", "Regional Block", "MAC", "Local"]} />
            <InputField label="Airway Management" name="airway_plan" error={formErrors.airway_plan} value={formData.airway_plan} onChange={(v: string) => setFormData({...formData, airway_plan: v})} />
            <SelectField label="Post-Op Destination" name="post_op_plan" error={formErrors.post_op_plan} value={formData.post_op_plan} onChange={(v: string) => setFormData({...formData, post_op_plan: v})} options={["Ward", "HDU", "ICU"]} />
            
            <div className="col-span-full pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.consent_anesthesia ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                <input type="checkbox" checked={formData.consent_anesthesia} onChange={(e) => setFormData({...formData, consent_anesthesia: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-0" />
                <div>
                  <p className="font-bold text-slate-800">Anaesthesia Consent</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Obtained & Signed</p>
                </div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.consent_high_risk ? 'border-red-600 bg-red-50/50' : 'border-slate-100 bg-slate-50'}`}>
                <input type="checkbox" checked={formData.consent_high_risk} onChange={(e) => setFormData({...formData, consent_high_risk: e.target.checked})} className="w-6 h-6 rounded-lg border-red-300 text-red-600 focus:ring-0" />
                <div>
                  <p className="font-bold text-red-800">High Risk Consent</p>
                  <p className="text-[10px] text-red-500 font-bold uppercase">Critical Documentation</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
          <h3 className="text-2xl font-black text-slate-900 mb-8 text-center flex items-center justify-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Save className="w-6 h-6" /></div>
             Fitness Determination
          </h3>
          
          <div className="max-w-xl mx-auto space-y-8">
            <div className="grid grid-cols-3 gap-4">
              {["Fit", "Conditional", "Unfit"].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, fitness: status as any})}
                  className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${
                    formData.fitness === status 
                    ? (status === "Fit" ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200" : status === "Unfit" ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-200" : "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200")
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="col-span-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Anaesthesiologist's Final Remarks</label>
              <textarea
                rows={5}
                required
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium resize-none bg-white text-slate-800 shadow-sm"
                placeholder="Detail any specific instructions for optimization, drug preferences, or post-op care..."
              ></textarea>
            </div>
            
            {formData.fitness === "Conditional" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-900 text-sm">Conditionality Warning</p>
                  <p className="text-amber-800 text-xs font-semibold mt-1">Patient must be optimized. OT management should only proceed once specified conditions are met.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen relative">
      {!isFormOpen ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <FileSignature className="w-8 h-8 text-indigo-600" /> PAC Records
              </h2>
              <p className="text-slate-500 font-medium mt-1">Manage Pre-Anesthetic Checkups</p>
            </div>
            {!navigator.onLine && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Offline Mode
              </div>
            )}
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              New PAC
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient name or UHID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="w-full md:w-64">
                <select
                  value={filterFitness}
                  onChange={(e) => setFilterFitness(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Fit">Fit</option>
                  <option value="Conditional">Conditional</option>
                  <option value="Unfit">Unfit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => openView(record)}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col cursor-pointer group"
                >
                  <div className="p-5 border-b border-slate-100 bg-slate-50 relative group-hover:bg-indigo-50/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-black text-slate-900 text-lg leading-tight truncate pr-8">{record.patient_name}</h3>
                       <div className="flex gap-1 shrink-0 absolute right-4 top-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(record); }} 
                            className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase">
                      <span>{record.age}y / {record.sex.charAt(0)}</span>
                      <span>•</span>
                      <span className="text-indigo-600">UHID: {record.uhid}</span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                      <p className="font-medium text-slate-800 line-clamp-2">{record.diagnosis || "N/A"}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">ASA</p>
                        <p className="font-black text-indigo-600 text-lg">{record.asa_grade || "-"}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">BP</p>
                        <p className="font-black text-slate-700 text-lg">{record.blood_pressure || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.fitness === 'Fit' ? 'bg-emerald-100 text-emerald-700' :
                      record.fitness === 'Conditional' ? 'bg-amber-100 text-amber-700' :
                      record.fitness === 'Unfit' ? 'bg-red-100 text-red-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {record.fitness || "Pending"}
                    </span>
                    {role === 'admin' && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(record.id); }} className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1">
                        <Trash2 className="w-4 h-4"/> Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {filteredRecords.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex justify-center items-center mb-4">
                    <FileSignature className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No PAC Records Found</h3>
                  <p className="text-slate-500 mt-2">Start by creating a new pre-anesthetic checkup.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[calc(100vh-2rem)] border border-slate-100"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
              <div>
                <h2 className="text-xl font-black">{isReadOnly ? "PAC Details Viewer" : "Pre-Anesthetic Checkup"}</h2>
                <p className="text-indigo-300 text-sm font-medium">{formData.patient_name || "New Patient"}</p>
              </div>
              <div className="flex items-center gap-2">
                {isReadOnly && (
                  <button 
                    onClick={() => setIsReadOnly(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all mr-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
               <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                  {isReadOnly ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Summary View Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-slate-100">
                        <div className="flex items-center gap-5">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${
                            formData.fitness === 'Fit' ? 'bg-emerald-600 text-white' : 
                            formData.fitness === 'Unfit' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {formData.asa_grade || "?"}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900">{formData.patient_name}</h3>
                            <div className="flex gap-3 text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
                              <span>UHID: {formData.uhid}</span>
                              <span className="text-slate-300">|</span>
                              <span>{formData.age} yrs</span>
                              <span className="text-slate-300">|</span>
                              <span>{formData.sex}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest shadow-xl">
                          {formData.fitness || "PENDING"}
                        </div>
                      </div>

                      {/* Detail Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 text-slate-800">
                        {/* Clinical Section */}
                        <section className="space-y-5">
                          <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-indigo-600 rounded-full"></span> Clinical Status
                          </h4>
                          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnosis</p>
                              <p className="font-bold text-sm leading-snug">{formData.diagnosis || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Procedure</p>
                              <p className="font-bold text-sm leading-snug">{formData.procedure || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                              <p className="font-bold text-sm">{formData.elective_emergency}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Surgeon</p>
                              <p className="font-bold text-sm">{formData.surgeon || "-"}</p>
                            </div>
                          </div>
                        </section>

                        {/* Vitals Section */}
                        <section className="space-y-5">
                          <h4 className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-amber-600 rounded-full"></span> Vitals
                          </h4>
                          <div className="grid grid-cols-3 gap-6 bg-amber-50/30 p-5 rounded-2xl border border-amber-100">
                            <div>
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">BP</p>
                              <p className="font-black text-base">{formData.blood_pressure || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">PR</p>
                              <p className="font-black text-base">{formData.pulse_rate || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">SpO2</p>
                              <p className="font-black text-base">{formData.spo2 ? `${formData.spo2}%` : "-"}</p>
                            </div>
                          </div>
                        </section>

                         {/* History Section */}
                         <section className="col-span-full space-y-5 pt-4 border-t-2 border-slate-100">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-slate-600 rounded-full"></span> Medical History
                          </h4>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Past Surgery</p>
                              <p className="font-bold">{formData.past_surgery || "None"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Drug History</p>
                              <p className="font-bold">{formData.drug_history || "None"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Allergies</p>
                              <p className="font-bold text-red-600">{formData.allergy_history || "NKDA"}</p>
                            </div>
                            <div className="col-span-full">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Comorbidities</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {formData.comorbidities.length > 0 ? formData.comorbidities.map(c => (
                                  <span key={c} className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">{c}</span>
                                )) : <span className="text-slate-500 font-medium">None Reported</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Addictions</p>
                              <p className="font-bold">{formData.addiction.join(', ') || "None"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prev Anes. Comp.</p>
                              <p className="font-bold">{formData.prev_anesthesia_comp || "None"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Family History</p>
                              <p className="font-bold">{formData.family_history || "None"}</p>
                            </div>
                          </div>
                        </section>

                         {/* Systems Section */}
                         <section className="space-y-5">
                          <h4 className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-emerald-600 rounded-full"></span> Systems & Airway
                          </h4>
                          <div className="space-y-3 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100">
                             <div className="flex justify-between items-center text-xs border-b border-emerald-100/50 pb-2">
                               <span className="text-slate-400 uppercase font-black tracking-tighter">Mallampati</span>
                               <span className="font-black text-emerald-700">{formData.airway_mallampati}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs border-b border-emerald-100/50 pb-2">
                               <span className="text-slate-400 uppercase font-black tracking-tighter">Mouth Opening</span>
                               <span className="font-bold">{formData.airway_mouth_opening}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs border-b border-emerald-100/50 pb-2">
                               <span className="text-slate-400 uppercase font-black tracking-tighter">CVS</span>
                               <span className="font-bold">{formData.cvs || "Normal"}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs border-b border-emerald-100/50 pb-2">
                               <span className="text-slate-400 uppercase font-black tracking-tighter">RS</span>
                               <span className="font-bold">{formData.rs || "Normal"}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400 uppercase font-black tracking-tighter">Spine</span>
                               <span className="font-bold">{formData.spine || "Normal"}</span>
                             </div>
                          </div>
                          {/* General Exam Flags */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {['pallor', 'icterus', 'cyanosis', 'clubbing', 'edema', 'lymph'].map(flag => {
                               const key = `general_exam_${flag}` as keyof PACRecord;
                               if (formData[key]) {
                                 return <span key={flag} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 uppercase">{flag}+</span>
                               }
                               return null;
                            })}
                          </div>
                        </section>

                        {/* Investigations */}
                        <section className="space-y-5">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-slate-500 rounded-full"></span> Investigations
                          </h4>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-8 bg-slate-100/50 p-5 rounded-2xl border border-slate-200">
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Hb</span>
                               <span className={`font-bold ${Number(formData.hb) < 10 ? 'text-red-600' : 'text-slate-700'}`}>{formData.hb || "-"} g/dL</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Plt Count</span>
                               <span className="font-bold text-slate-700">{formData.platelets || "-"}</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Grp</span>
                               <span className="font-bold text-slate-700">{formData.blood_group || "-"}</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">RBS</span>
                               <span className="font-bold text-slate-700">{formData.rbs || "-"} mg/dL</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Viral Stat</span>
                               <span className="text-[10px] font-bold text-slate-700">{formData.viral_hiv}/{formData.viral_hbsag}</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Lytes (Na/K)</span>
                               <span className="font-bold text-slate-700">{formData.electrolytes_na}/{formData.electrolytes_k}</span>
                             </div>
                             <div className="col-span-full pt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Imaging (ECG/CXR)</p>
                                <p className="text-xs font-medium text-slate-600 truncate">{formData.ecg || "ECG: N/A"}, {formData.cxr || "X-Ray: N/A"}</p>
                             </div>
                          </div>
                        </section>

                         {/* Detailed Examination Section */}
                         <section className="col-span-full space-y-5 pt-4 border-t-2 border-slate-100">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-slate-800 rounded-full"></span> Systemic Examination
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">CNS</p>
                              <p className="font-medium text-slate-700">{formData.cns || "Normal / No issues noted"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Abdomen / PA</p>
                              <p className="font-medium text-slate-700">{formData.pa || "Soft, non-tender, no organomegaly"}</p>
                            </div>
                            <div className="col-span-full">
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Airway Details</p>
                               <div className="flex flex-wrap gap-8 bg-white p-4 rounded-xl border border-slate-200 mt-1">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Neck Movement</p>
                                    <p className="font-bold text-slate-800">{formData.airway_neck_movement}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Teeth</p>
                                    <p className="font-bold text-slate-800">{formData.airway_teeth}</p>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </section>

                        {/* Investigations Additional */}
                        <section className="col-span-full space-y-5 pt-4">
                           <h4 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-slate-300 rounded-full"></span> Extended Investigations
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {[
                               { label: 'PT/INR', val: formData.pt_inr },
                               { label: 'CT/BT', val: formData.ct_bt },
                               { label: 'HCV', val: formData.viral_hcv },
                               { label: 'USG/USG', val: formData.usg_imaging },
                             ].map(item => (
                               <div key={item.label} className="p-3 bg-white border border-slate-100 rounded-xl">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                 <p className="font-bold text-slate-700">{item.val || "N/A"}</p>
                               </div>
                             ))}
                          </div>
                        </section>

                        {/* Additional Plans */}
                        <section className="col-span-full space-y-5 pt-4">
                           <h4 className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-amber-600 rounded-full"></span> Pre-Op Preparation
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Premedication</p>
                                <p className="font-bold text-slate-700">{formData.premedication || "None prescribed"}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Required</p>
                                <p className="font-bold text-slate-700">{formData.blood_required || "N/A"}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Airway Plan</p>
                                <p className="font-bold text-slate-700">{formData.airway_plan || "Standard"}</p>
                             </div>
                          </div>
                        </section>
                        {/* Plan & Remarks */}
                        <section className="col-span-full space-y-5 pt-4 border-t-2 border-slate-100">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                            <span className="w-1 h-4 bg-slate-900 rounded-full"></span> Anaesthesia Plan & Remarks
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                             <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Anaesthesia Type</p>
                                <p className="font-black text-indigo-700">{formData.anesthesia_type || "No Plan"}</p>
                             </div>
                             <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Post-Op Plan</p>
                                <p className="font-black">{formData.post_op_plan || "Ward"}</p>
                             </div>
                             <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">NBM Hours</p>
                                <p className="font-black text-slate-700">{formData.nbm_hours || "8"} Hours</p>
                             </div>
                          </div>
                          <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Final Remarks & Instructions</p>
                            <p className="text-slate-800 font-medium leading-relaxed italic">"{formData.remarks || "No additional instructions provided."}"</p>
                          </div>
                        </section>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                        <div>PAC ID: {(formData as any).id || 'New'}</div>
                        <div className="flex gap-6">
                           <span className={formData.consent_anesthesia ? 'text-emerald-500' : 'text-slate-300'}>✓ Anaesthesia Consent</span>
                           <span className={formData.consent_high_risk ? 'text-red-500' : 'text-slate-300'}>✓ High Risk Consent</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderStepIndicators()}
                      <form id="pac-form" onSubmit={handleNextOrSave} className="min-h-[400px] print:hidden">
                        {renderFormStep()}
                      </form>
                    </>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              {isReadOnly ? (
                <>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Close Viewer
                  </button>
                  <button 
                    type="button"
                    onClick={handlePrint} 
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                    <Printer className="w-5 h-5" /> Print Patient Record
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={handlePrint} 
                      className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      <Printer className="w-5 h-5" /> Print
                    </button>

                    {currentStep < 6 ? (
                      <button
                        type="submit"
                        form="pac-form"
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        Next <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        form="pac-form"
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-colors shadow-lg shadow-emerald-200 ${isSaving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        <Save className="w-5 h-5" /> {isSaving ? "Saving..." : "Save PAC"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Delete Password Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Confirm Delete</h3>
              <p className="text-slate-500 text-center text-sm mb-6 font-medium">This action is irreversible. Are you sure you want to delete this record?</p>
              
              <div className="space-y-4">
                {deleteError && (
                  <p className="text-xs text-red-500 font-bold text-center">{deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invisible print-only view of all data - Absolute positioning and root placement for reliable printing */}
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[999999] p-0 text-black overflow-visible">
        <div ref={printRef} className="w-[210mm] min-h-[297mm] mx-auto p-12 bg-white print-page">
          <div className="text-center mb-10 border-b-4 border-black pb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight">{translations[language].collegeNameShort}</h1>
            <p className="text-base font-bold mt-1 uppercase">Department of Anaesthesiology</p>
            <div className="mt-6 flex justify-center">
               <h2 className="text-xl font-black px-8 py-3 bg-black text-white uppercase tracking-widest">Pre-Anesthetic Checkup Record</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-5 mb-10 text-sm">
            <div className="flex justify-between border-b border-black pb-1"><strong>Patient Name:</strong> <span className="font-bold">{formData.patient_name}</span></div>
            <div className="flex justify-between border-b border-black pb-1"><strong>UHID:</strong> <span className="font-bold">{formData.uhid}</span></div>
            <div className="flex justify-between border-b border-black pb-1"><strong>Age / Sex:</strong> <span className="font-bold">{formData.age} yrs / {formData.sex}</span></div>
            <div className="flex justify-between border-b border-black pb-1"><strong>Ward & Bed:</strong> <span className="font-bold">{formData.ward_bed}</span></div>
            <div className="flex justify-between border-b border-black pb-1"><strong>Date of Admission:</strong> <span className="font-bold">{formData.date_of_admission}</span></div>
            <div className="flex justify-between border-b border-black pb-1"><strong>Date of Surgery:</strong> <span className="font-bold">{formData.surgery_date}</span></div>
            <div className="flex justify-between border-b border-black pb-1 col-span-2"><strong>Proposed Surgeon:</strong> <span className="font-bold">{formData.surgeon}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="border-2 border-black p-5 space-y-4">
              <h3 className="font-black border-b-2 border-black mb-3 uppercase text-sm bg-gray-100 p-1 px-3 -mx-5 -mt-5">1. Clinical History</h3>
              <p><strong>Diagnosis:</strong> {formData.diagnosis}</p>
              <p><strong>Procedure:</strong> {formData.procedure} ({formData.elective_emergency})</p>
              <p><strong>Comorbidities:</strong> {formData.comorbidities?.join(", ") || "None"}</p>
              <p><strong>Allergies:</strong> <span className="text-red-600 font-bold">{formData.allergy_history || "NKDA"}</span></p>
              <p><strong>Drug History:</strong> {formData.drug_history || "None"}</p>
              <p><strong>Addiction:</strong> {formData.addiction?.join(", ") || "None"}</p>
              <p><strong>Past Surgery:</strong> {formData.past_surgery || "None"}</p>
            </div>
            <div className="border-2 border-black p-5 space-y-4">
              <h3 className="font-black border-b-2 border-black mb-3 uppercase text-sm bg-gray-100 p-1 px-3 -mx-5 -mt-5">2. Physical Examination</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <p><strong>Pulse Rate:</strong> {formData.pulse_rate} /min</p>
                <p><strong>Blood Pressure:</strong> {formData.blood_pressure} mmHg</p>
                <p><strong>SpO2:</strong> {formData.spo2}%</p>
                <p><strong>Resp. Rate:</strong> {formData.respiratory_rate} /min</p>
                <p><strong>Temperature:</strong> {formData.temperature}°F</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs space-y-1">
                <p><strong>Airway:</strong> Mallampati {formData.airway_mallampati}, Opening: {formData.airway_mouth_opening}</p>
                <p><strong>Neck:</strong> {formData.airway_neck_movement}, Teeth: {formData.airway_teeth}</p>
                <p><strong>Systemic:</strong> CVS: {formData.cvs}, RS: {formData.rs}</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-black p-5 mb-10">
            <h3 className="font-black border-b-2 border-black mb-4 uppercase text-sm text-center bg-gray-100 p-1 -mx-5 -mt-5">3. Laboratory Investigations</h3>
            <div className="grid grid-cols-4 gap-x-6 gap-y-3 text-xs">
              <p><strong>Hemoglobin:</strong> {formData.hb} g/dL</p>
              <p><strong>Platelets:</strong> {formData.platelets}</p>
              <p><strong>Blood Group:</strong> {formData.blood_group}</p>
              <p><strong>RBS:</strong> {formData.rbs} mg/dL</p>
              <p><strong>Creatinine:</strong> {formData.creatinine} mg/dL</p>
              <p><strong>Sodium (Na+):</strong> {formData.electrolytes_na}</p>
              <p><strong>Potassium (K+):</strong> {formData.electrolytes_k}</p>
              <p><strong>HV Status:</strong> HIV: {formData.viral_hiv}, HBsAg: {formData.viral_hbsag}</p>
            </div>
            {(formData.ecg || formData.cxr) && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-6 text-xs italic">
                {formData.ecg && <p><strong>ECG:</strong> {formData.ecg}</p>}
                {formData.cxr && <p><strong>CXR:</strong> {formData.cxr}</p>}
              </div>
            )}
          </div>

          <div className="border-2 border-black p-5 mb-12 bg-gray-50/30">
            <h3 className="font-black border-b-2 border-black mb-4 uppercase text-sm bg-gray-200 p-1 px-3 -mx-5 -mt-5">4. Anesthesia Plan & Fitness</h3>
            <div className="grid grid-cols-3 gap-8 text-sm mb-6">
               <p><strong>ASA Grade:</strong> <span className="font-bold text-lg">{formData.asa_grade}</span></p>
               <p><strong>Surgical Risk:</strong> <span className="font-bold">{formData.risk}</span></p>
               <p><strong>Planned Anesthesia:</strong> <span className="font-bold">{formData.anesthesia_type}</span></p>
            </div>
            <div className="bg-white border border-black p-4 inline-block mb-6">
               <p className="text-sm">Final Assessment: <span className="text-2xl font-black uppercase underline ml-2">{formData.fitness}</span></p>
            </div>
            <p className="text-xs leading-relaxed"><strong>Clinical Remarks:</strong> {formData.remarks || "No additional specific instructions."}</p>
          </div>

          <div className="mt-24 flex justify-between px-16">
             <div className="text-center">
                <div className="w-48 border-b-2 border-black mb-2"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Patient / Relative Signature</p>
             </div>
             <div className="text-center">
                <div className="w-48 border-b-2 border-black mb-2"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Anaesthesiologist Signature</p>
             </div>
          </div>

          <div className="text-center mt-20 pt-6 border-t border-black text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            This document is a part of the official medical record. Printed on: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
