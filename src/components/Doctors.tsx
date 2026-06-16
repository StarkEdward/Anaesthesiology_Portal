import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, User, Phone, Mail, Calendar, Info } from "lucide-react";
import { Doctor } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import DatePickerInput from './ui/DatePickerInput';
import { designationHierarchy, sortDoctors } from '../lib/doctorConstants';

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: "Dr.",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    designation: "Assistant Professor",
    joining_date: new Date().toISOString().split('T')[0],
    college_appointment_date: new Date().toISOString().split('T')[0],
    till_date: "",
    ug_qualification: "",
    ug_passing_year: "",
    pg_qualification: "",
    pg_passing_year: "",
    teaching_exp_years: "",
    teaching_exp_months: "",
    teaching_exp_days: "",
    muhs_approval: "No",
    muhs_approval_details: "",
    aadhar_number: "",
    pan_number: "",
    debarred: "No",
    mobile_number: "",
    email: "",
    additional_info: "",
    name_mr: "",
    designation_mr: "",
  });

  useEffect(() => {
    const q = query(collection(db, "doctors"), orderBy("first_name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setDoctors(docs);
    }, (error) => {
      console.error("Firestore error:", error);
      showToast("Failed to fetch doctors", "error");
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side Validation
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    if (!nameRegex.test(formData.first_name)) {
      showToast("First name must contain only letters", "error");
      return;
    }
    if (formData.middle_name && !nameRegex.test(formData.middle_name)) {
      showToast("Middle name must contain only letters", "error");
      return;
    }
    if (!nameRegex.test(formData.last_name)) {
      showToast("Last name must contain only letters", "error");
      return;
    }
    
    if (formData.mobile_number && !/^\d{10}$/.test(formData.mobile_number)) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "doctors", editId), formData);
        showToast(t('updateSuccess') || "Doctor updated", 'success');
      } else {
        await addDoc(collection(db, "doctors"), formData);
        showToast(t('saveSuccess') || "Doctor saved", 'success');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(error.message, 'error');
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeletePassword("");
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletePassword !== "StarkEdward") {
      setDeleteError("Invalid Master Password");
      return;
    }
    
    if (deleteId) {
      try {
        await deleteDoc(doc(db, "doctors", deleteId));
        showToast(t('deleteSuccess') || "Doctor deleted", 'success');
        setDeleteModalOpen(false);
        setDeleteId(null);
      } catch (error: any) {
        console.error("Delete error:", error);
        setDeleteError(error.message);
      }
    }
  };

  const openNew = () => {
    setEditId(null);
    setFormData({
      title: "Dr.",
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "Male",
      dob: "",
      designation: "Assistant Professor",
      joining_date: new Date().toISOString().split('T')[0],
      college_appointment_date: new Date().toISOString().split('T')[0],
      till_date: "",
      ug_qualification: "",
      ug_passing_year: "",
      pg_qualification: "",
      pg_passing_year: "",
      teaching_exp_years: "",
      teaching_exp_months: "",
      teaching_exp_days: "",
      muhs_approval: "No",
      muhs_approval_details: "",
      aadhar_number: "",
      pan_number: "",
      debarred: "No",
      mobile_number: "",
      email: "",
      additional_info: "",
      name_mr: "",
      designation_mr: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditId(doc.id.toString());
    setFormData({
      title: doc.title,
      first_name: doc.first_name,
      middle_name: doc.middle_name || "",
      last_name: doc.last_name,
      gender: doc.gender || "Male",
      dob: doc.dob || "",
      designation: doc.designation,
      joining_date: doc.joining_date,
      college_appointment_date: doc.college_appointment_date || doc.joining_date || new Date().toISOString().split('T')[0],
      till_date: doc.till_date || "",
      ug_qualification: doc.ug_qualification || "",
      ug_passing_year: doc.ug_passing_year || "",
      pg_qualification: doc.pg_qualification || "",
      pg_passing_year: doc.pg_passing_year || "",
      teaching_exp_years: doc.teaching_exp_years || "",
      teaching_exp_months: doc.teaching_exp_months || "",
      teaching_exp_days: doc.teaching_exp_days || "",
      muhs_approval: doc.muhs_approval || "No",
      muhs_approval_details: doc.muhs_approval_details || "",
      aadhar_number: doc.aadhar_number || "",
      pan_number: doc.pan_number || "",
      debarred: doc.debarred || "No",
      mobile_number: doc.mobile_number || "",
      email: doc.email || "",
      additional_info: doc.additional_info || "",
      name_mr: doc.name_mr || "",
      designation_mr: doc.designation_mr || "",
    });
    setIsModalOpen(true);
  };



  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-indigo-600 to-purple-600";
      case 2: return "from-blue-500 to-indigo-600";
      case 3: return "from-emerald-500 to-teal-600";
      case 4: return "from-amber-400 to-orange-500";
      case 5: return "from-slate-400 to-slate-600";
      default: return "from-slate-300 to-slate-400";
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    if (!searchQuery) return true;
    
    // Combine all searchable fields into a single massive string
    const searchString = `
      ${doc.title || ''} 
      ${doc.first_name || ''} 
      ${doc.middle_name || ''} 
      ${doc.last_name || ''} 
      ${doc.name_mr || ''} 
      ${doc.designation || ''} 
      ${doc.designation_mr || ''}
      ${doc.gender || ''}
      ${doc.mobile_number || ''}
      ${doc.email || ''}
      ${doc.ug_qualification || ''}
      ${doc.pg_qualification || ''}
      ${doc.aadhar_number || ''}
      ${doc.pan_number || ''}
      ${doc.id || ''}
      ${doc.teaching_exp_years || ''}
    `.toLowerCase();

    // Support out-of-order multi-word searching (e.g. "rajesh mbbs" or "mbbs rajesh")
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    return searchTerms.every(term => searchString.includes(term));
  }).sort(sortDoctors);

  const handleExportCSV = () => {
    import('papaparse').then((Papa) => {
      const csv = Papa.default.unparse(filteredDoctors.map(doc => ({
        "Title": doc.title,
        "First Name": doc.first_name,
        "Middle Name": doc.middle_name || "",
        "Last Name": doc.last_name,
        "Gender": doc.gender || "",
        "Date of Birth": doc.dob || "",
        "Designation": doc.designation,
        "College Appointment Date": doc.college_appointment_date || doc.joining_date || "",
        "Joining Date (Present)": doc.joining_date || "",
        "Till Date": doc.till_date || "",
        "UG Qualification": doc.ug_qualification || "",
        "UG Passing Year": doc.ug_passing_year || "",
        "PG Qualification": doc.pg_qualification || "",
        "PG Passing Year": doc.pg_passing_year || "",
        "Teaching Exp (Y)": doc.teaching_exp_years || "0",
        "Teaching Exp (M)": doc.teaching_exp_months || "0",
        "Teaching Exp (D)": doc.teaching_exp_days || "0",
        "MUHS Approval": doc.muhs_approval || "",
        "MUHS Details": doc.muhs_approval_details || "",
        "Aadhar": doc.aadhar_number || "",
        "PAN": doc.pan_number || "",
        "Debarred": doc.debarred || "",
        "Mobile": doc.mobile_number || "",
        "Email": doc.email || ""
      })));
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Doctors_Directory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const autoTranslateDoctors = async () => {
    const marathiFirstNames: Record<string, string> = {
      "rajesh": "राजेश",
      "yogesh": "योगेश",
      "prasad": "प्रसाद",
      "sneha": "स्नेहा",
      "gulabsing": "गुलाबसिंग",
      "minakshi": "मिनाक्षी",
      "manoj": "मनोज"
    };

    const marathiLastNames: Record<string, string> = {
      "subhedar": "सुभेदार",
      "borse": "बोरसे",
      "sule": "सुळे",
      "badame": "बदामे",
      "pawara": "पावरा",
      "kalam": "कळाम",
      "pawar": "पवार",
      "patil": "पाटील",
      "kadam": "कदम",
      "shinde": "शिंदे",
      "jadhav": "जाधव",
      "deshmukh": "देशमुख",
      "joshi": "जोशी",
      "wagh": "वाघ",
      "bhoi": "भोई",
      "chaudhari": "चौधरी",
      "mahajan": "महाजन",
      "bhalerao": "भालेराव",
      "kulkarni": "कुलकर्णी",
      "kale": "काळे",
      "more": "मोरे"
    };

    const marathiDesignations: Record<string, string> = {
      "Professor and Head": "प्राध्यापक व विभाग प्रमुख",
      "Associate Professor": "सहयोगी प्राध्यापक",
      "Assistant Professor": "सहाय्यक प्राध्यापक",
      "Senior Resident": "वरिष्ठ निवासी",
      "Junior Resident - 3": "कनिष्ठ निवासी - ३",
      "Junior Resident - 2": "कनिष्ठ निवासी - २",
      "Junior Resident - 1": "कनिष्ठ निवासी - १",
      "Junior Resident": "कनिष्ठ निवासी",
    };

    let count = 0;
    for (const docInfo of doctors) {
      let updateData: any = {};
      const fName = docInfo.first_name?.toLowerCase().trim() || "";
      const lName = docInfo.last_name?.toLowerCase().trim() || "";
      
      if (marathiFirstNames[fName]) {
        let fullName = `डॉ. ${marathiFirstNames[fName]}`;
        if (marathiLastNames[lName]) {
          fullName += ` ${marathiLastNames[lName]}`;
        } else if (docInfo.last_name) {
          fullName += ` ${docInfo.last_name}`; // Fallback to English if translation missing
        }
        updateData.name_mr = fullName;
      }
      
      if (marathiDesignations[docInfo.designation]) {
        updateData.designation_mr = marathiDesignations[docInfo.designation];
      }
      
      if (Object.keys(updateData).length > 0) {
        try {
          await updateDoc(doc(db, "doctors", docInfo.id), updateData);
          count++;
        } catch (error) {
          console.error("Error updating doc:", error);
        }
      }
    }
    showToast(`Successfully updated ${count} doctors with Marathi details!`, 'success');
  };

  const handlePrint = () => {
    // We will append a class to body to handle print media display
    // For proper viewing, we will use a dedicated print window approach since window.print()
    // inside the app framework iframe might be restricted
    const printContent = `
      <html>
        <head>
          <title>Doctors Directory Print</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; color: #333; }
            h1 { text-align: center; color: #111; margin-bottom: 20px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; font-size: 11px; }
            tr:nth-child(even) { background-color: #fafafa; }
          </style>
        </head>
        <body>
          <h1>Doctors Directory</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Gender</th>
                <th>Appt Date</th>
                <th>UG Qual</th>
                <th>PG Qual</th>
                <th>Experience</th>
                <th>MUHS Approv</th>
                <th>Mobile</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDoctors.map(doc => `
                <tr>
                  <td>${doc.title} ${doc.first_name} ${doc.middle_name || ''} ${doc.last_name}</td>
                  <td>${doc.designation}</td>
                  <td>${doc.gender || '-'}</td>
                  <td>${doc.college_appointment_date || doc.joining_date || '-'}</td>
                  <td>${doc.ug_qualification || '-'} (${doc.ug_passing_year || '-'})</td>
                  <td>${doc.pg_qualification || '-'} (${doc.pg_passing_year || '-'})</td>
                  <td>${doc.teaching_exp_years ? `${doc.teaching_exp_years}Y ` : ''}${doc.teaching_exp_months ? `${doc.teaching_exp_months}M` : ''}</td>
                  <td>${doc.muhs_approval || '-'}</td>
                  <td>${doc.mobile_number || '-'}</td>
                  <td>${doc.email || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // We try to open a window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      showToast("Please allow popups to print", "error");
    }
  };

  return (
    <div className="p-4 md:p-12 space-y-12 bg-[#F8F9FB] min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Header Section: Modern & Minimal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/60 font-mono">{t('facultyDirectory' as any) || "Faculty Directory"}</span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            {t('doctorsTitle')}
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-xl">
            {t('doctorsDesc')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:min-w-[300px]">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="p-4 bg-white text-slate-700 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold shadow-sm"
              title="Export XL"
            >
              XL
            </button>
            <button
              onClick={handlePrint}
              className="p-4 bg-white text-slate-700 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold shadow-sm"
              title="Print"
            >
              PR
            </button>
            <button
              onClick={autoTranslateDoctors}
              className="p-4 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200 hover:bg-amber-200 transition-all font-bold shadow-sm"
              title="Auto Translate"
            >
              Auto Translate
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 font-black text-sm uppercase tracking-widest min-w-max"
            >
              <Plus className="w-5 h-5" />
              {t('newDoctor')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px]">Doctor</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Designation</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualification</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Exp.</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(
                filteredDoctors.reduce((acc, doc) => {
                  const role = doc.designation || 'Other';
                  if (!acc[role]) acc[role] = [];
                  acc[role].push(doc);
                  return acc;
                }, {} as Record<string, typeof doctors>)
              ) as [string, typeof doctors][])
                .sort(([roleA], [roleB]) => {
                  const rankA = designationHierarchy[roleA] || 99;
                  const rankB = designationHierarchy[roleB] || 99;
                  return rankA - rankB;
                })
                .map(([role, roleDoctors]) => (
                  <React.Fragment key={role}>
                    {/* Role Header */}
                    <tr className="bg-slate-100/50">
                      <td colSpan={6} className="py-3 px-4 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">{role}</span>
                          <div className="flex-1 h-[1px] bg-slate-200" />
                          <span className="text-[9px] font-mono font-bold text-slate-400">{roleDoctors.length} MEMBERS</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Doctors for this role */}
                    {roleDoctors.map((doc, idx) => {
                      const docRank = designationHierarchy[doc.designation] || 99;
                      const gradient = getRankColor(docRank);
                      const expYears = parseInt(doc.teaching_exp_years || "0");
                      const isNew = doc.joining_date && (new Date().getTime() - new Date(doc.joining_date).getTime() < 30 * 24 * 60 * 60 * 1000);

                      return (
                        <tr 
                          key={doc.id} 
                          onClick={() => setViewDoctor(doc)}
                          className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          {/* Doctor Info */}
                          <td className="py-2.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${gradient} p-[1px]`}>
                                <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                                  <span className={`text-xs font-black bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>
                                    {doc.first_name.charAt(0)}{doc.last_name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900 truncate">
                                    {doc.title} {doc.first_name} {doc.last_name}
                                  </span>
                                  {isNew && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full leading-none">NEW</span>}
                                </div>
                                {doc.name_mr && <span className="text-[11px] font-bold text-slate-500 block truncate">{doc.name_mr}</span>}
                              </div>
                            </div>
                          </td>
                          
                          {/* Designation */}
                          <td className="py-2.5 px-4 align-middle">
                            <span className="text-[11px] font-bold text-slate-700 block">{doc.designation}</span>
                            {doc.designation_mr && <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{doc.designation_mr}</span>}
                          </td>
                          
                          {/* Qualification */}
                          <td className="py-2.5 px-4 align-middle">
                            <span className="text-[11px] font-bold text-slate-700 block truncate max-w-[150px]">
                              {doc.pg_qualification || doc.ug_qualification || '-'}
                            </span>
                          </td>
                          
                          {/* Experience */}
                          <td className="py-2.5 px-4 align-middle text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {expYears}
                            </span>
                          </td>
                          
                          {/* Contact */}
                          <td className="py-2.5 px-4 align-middle">
                            <div className="flex flex-col gap-1">
                              {doc.mobile_number && (
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-600">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {doc.mobile_number}
                                </div>
                              )}
                              {doc.email && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 truncate max-w-[150px]">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{doc.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="py-2.5 px-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEdit(doc); }}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm border border-transparent hover:border-slate-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc.id.toString()); }}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-colors shadow-sm border border-transparent hover:border-slate-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card List View (Always Visible Actions & Full Names) */}
      <div className="lg:hidden space-y-6">
        {(Object.entries(
          filteredDoctors.reduce((acc, doc) => {
            const role = doc.designation || 'Other';
            if (!acc[role]) acc[role] = [];
            acc[role].push(doc);
            return acc;
          }, {} as Record<string, typeof doctors>)
        ) as [string, typeof doctors][])
          .sort(([roleA], [roleB]) => {
            const rankA = designationHierarchy[roleA] || 99;
            const rankB = designationHierarchy[roleB] || 99;
            return rankA - rankB;
          })
          .map(([role, roleDoctors]) => (
            <div key={role} className="space-y-3">
              {/* Role Header */}
              <div className="flex items-center gap-4 py-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">{role}</span>
                <div className="flex-1 h-[1px] bg-slate-200" />
                <span className="text-[10px] font-mono font-bold text-slate-400">{roleDoctors.length} MEMBERS</span>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleDoctors.map((doc) => {
                  const docRank = designationHierarchy[doc.designation] || 99;
                  const gradient = getRankColor(docRank);
                  const expYears = parseInt(doc.teaching_exp_years || "0");
                  const isNew = doc.joining_date && (new Date().getTime() - new Date(doc.joining_date).getTime() < 30 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setViewDoctor(doc)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between gap-4"
                    >
                      {/* Top Row with Avatar, Name Info & Actions */}
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${gradient} p-[1px]`}>
                          <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                            <span className={`text-sm font-black bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>
                              {doc.first_name.charAt(0)}{doc.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-base font-black text-slate-900 leading-snug break-words">
                              {doc.title} {doc.first_name} {doc.middle_name ? doc.middle_name + ' ' : ''}{doc.last_name}
                            </span>
                            {isNew && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full leading-none">NEW</span>}
                          </div>
                          {doc.name_mr && <span className="text-xs font-bold text-slate-500 block mt-0.5">{doc.name_mr}</span>}
                          <span className="text-[11px] font-bold text-indigo-600/90 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1.5">{doc.designation}</span>
                        </div>

                        {/* Always-Visible Actions for touch devices */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEdit(doc)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors border border-slate-200/60 shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(doc.id.toString())}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-xl transition-colors border border-slate-200/60 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Grid with Details */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Qualification</span>
                          <span className="font-bold text-slate-700 block truncate">{doc.pg_qualification || doc.ug_qualification || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Teaching Exp.</span>
                          <span className="font-bold text-slate-700 block">{expYears} Years</span>
                        </div>
                      </div>

                      {/* Contact Details Footer */}
                      {(doc.mobile_number || doc.email) && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100/80">
                          {doc.mobile_number && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono">{doc.mobile_number}</span>
                            </div>
                          )}
                          {doc.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium min-w-0">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate block">{doc.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-sm flex justify-center items-center mb-6">
            <Search className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">{t('noDoctors')}</h3>
          <p className="text-slate-500 font-medium mt-2">Adjust your search or register new staff.</p>
        </div>
      )}

      <AnimatePresence>
        {viewDoctor && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setViewDoctor(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
            >
              {/* Dossier Header */}
              <div className="relative bg-slate-900 p-6 overflow-hidden shrink-0">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20 -mr-24 -mt-24" />
                
                <div className="relative z-10 flex flex-row items-start gap-5">
                  <div className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${getRankColor(designationHierarchy[viewDoctor.designation] || 99)} p-0.5 flex items-center justify-center shadow-lg mt-1`}>
                    <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                      <span className={`text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br ${getRankColor(designationHierarchy[viewDoctor.designation] || 99)}`}>
                        {viewDoctor.first_name.charAt(0)}{viewDoctor.last_name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1 mb-1">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-tight break-words">
                          {viewDoctor.title} {viewDoctor.first_name} {viewDoctor.middle_name} {viewDoctor.last_name}
                        </h3>
                        <span className="self-start sm:self-auto shrink-0 px-2 py-0.5 bg-white/10 text-white/80 text-[9px] font-mono font-bold rounded-md border border-white/10 uppercase tracking-widest">
                          {viewDoctor.designation}
                        </span>
                      </div>
                      {(viewDoctor.name_mr || viewDoctor.designation_mr) && (
                        <p className="text-xs text-indigo-200 font-bold break-words">
                          {viewDoctor.name_mr} {viewDoctor.name_mr && viewDoctor.designation_mr ? '•' : ''} {viewDoctor.designation_mr}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[9px] tracking-widest font-bold">
                      <span className="flex items-center gap-1"><Info className="w-3 h-3" /> UID: {viewDoctor.id.slice(-6).toUpperCase()}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> JOINED: {new Date(viewDoctor.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto bg-[#FDFDFD]">
                {/* Visual Identity Section */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Gender</span>
                    <p className="text-sm font-black text-slate-800">{viewDoctor.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Date of Birth</span>
                    <p className="text-sm font-black text-slate-800">{viewDoctor.dob || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Age</span>
                    <p className="text-sm font-black text-indigo-600">
                      {viewDoctor.dob ? `${Math.floor((new Date().getTime() - new Date(viewDoctor.dob).getTime()) / 31557600000)} Yrs` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Professional Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Professional Timeline</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">College Appt</span>
                      <p className="text-sm font-black text-slate-800">{viewDoctor.college_appointment_date || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Till Date</span>
                      <p className="text-sm font-black text-slate-800">{viewDoctor.till_date || 'Present'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Teaching Exp</span>
                      <p className="text-sm font-black text-indigo-600">
                        {viewDoctor.teaching_exp_years ? `${viewDoctor.teaching_exp_years}Y ` : ''}
                        {viewDoctor.teaching_exp_months ? `${viewDoctor.teaching_exp_months}M ` : ''}
                        {viewDoctor.teaching_exp_days ? `${viewDoctor.teaching_exp_days}D` : ''}
                        {!viewDoctor.teaching_exp_years && !viewDoctor.teaching_exp_months && !viewDoctor.teaching_exp_days && 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Qualifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono">Academic Credentials</span>
                    <div className="flex-1 h-px bg-indigo-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 block">Undergraduate</span>
                      <p className="text-sm font-black text-indigo-900 truncate">
                        {viewDoctor.ug_qualification || 'N/A'}
                        {viewDoctor.ug_passing_year && <span className="text-indigo-400 font-mono text-xs ml-1.5">'{viewDoctor.ug_passing_year.slice(-2)}</span>}
                      </p>
                    </div>
                     <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5 block">Postgraduate</span>
                      <p className="text-sm font-black text-purple-900 truncate">
                        {viewDoctor.pg_qualification || 'N/A'}
                        {viewDoctor.pg_passing_year && <span className="text-purple-400 font-mono text-xs ml-1.5">'{viewDoctor.pg_passing_year.slice(-2)}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secure Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Secure Verification</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">MUHS APPRV</span>
                      <p className={`text-[10px] font-black truncate ${viewDoctor.muhs_approval === 'Yes' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {viewDoctor.muhs_approval === 'Yes' ? 'VERIFIED' : 'PENDING'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">DEBARRED</span>
                      <p className={`text-[10px] font-black truncate ${viewDoctor.debarred === 'Yes' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {viewDoctor.debarred === 'Yes' ? 'RESTRICTED' : 'CLEAR'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">AADHAR</span>
                      <p className="text-[10px] font-mono font-black text-slate-800">{viewDoctor.aadhar_number ? `*${viewDoctor.aadhar_number.slice(-4)}` : 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">PAN</span>
                      <p className="text-[10px] font-mono font-black text-slate-800 uppercase">{viewDoctor.pan_number ? `*${viewDoctor.pan_number.slice(-4)}` : 'N/A'}</p>
                    </div>
                  </div>
                  {/* Additional details row */}
                  {(viewDoctor.muhs_approval_details || viewDoctor.additional_info) && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {viewDoctor.muhs_approval_details && (
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 col-span-2 sm:col-span-1">
                          <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">MUHS Approval Details</span>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{viewDoctor.muhs_approval_details}</p>
                        </div>
                      )}
                      {viewDoctor.additional_info && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Additional Information</span>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{viewDoctor.additional_info}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact Rail */}
                <div className="flex flex-row gap-3 pt-2 border-t border-slate-100 mt-2">
                  <a href={`tel:${viewDoctor.mobile_number}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold font-mono tracking-widest">{viewDoctor.mobile_number || "NO PHONE"}</span>
                  </a>
                  <a href={`mailto:${viewDoctor.email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl hover:border-indigo-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[11px] font-bold font-mono truncate px-2">{viewDoctor.email || "NO EMAIL"}</span>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                 <button 
                  onClick={() => setViewDoctor(null)}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 md:p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  {editId ? t('editDoctor') : t('newDoctor')}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto bg-white">
                  
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-500">{t('title')}</label>
                        <select
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        >
                          <option value="Dr.">Dr.</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mrs.">Mrs.</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-xs font-bold text-slate-500">{t('firstName')}</label>
                        <input
                          required
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('middleName')}</label>
                        <input
                          type="text"
                          value={formData.middle_name}
                          onChange={(e) => setFormData({ ...formData, middle_name: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('lastName')}</label>
                        <input
                          required
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">MARATHI NAME (Full Name)</label>
                      <input
                        type="text"
                        placeholder="उदा. डॉ. राजेश कदम"
                        value={formData.name_mr}
                        onChange={(e) => setFormData({ ...formData, name_mr: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">GENDER</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">DATE OF BIRTH</label>
                        <DatePickerInput
                          value={formData.dob}
                          onChange={(date) => setFormData({ ...formData, dob: date })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Professional Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('doctorDesignation')}</label>
                        <select
                          required
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        >
                          <option value="Professor and Head">Professor and Head</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Senior Resident">Senior Resident</option>
                          <option value="Junior Resident - 3">Junior Resident - 3</option>
                          <option value="Junior Resident - 2">Junior Resident - 2</option>
                          <option value="Junior Resident - 1">Junior Resident - 1</option>
                          <option value="Junior Resident">Junior Resident</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">MARATHI DESIGNATION</label>
                        <input
                          type="text"
                          placeholder="उदा. प्राध्यापक"
                          value={formData.designation_mr}
                          onChange={(e) => setFormData({ ...formData, designation_mr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">COLLEGE APPOINTMENT DATE</label>
                        <DatePickerInput
                          value={formData.college_appointment_date}
                          onChange={(date) => setFormData({ ...formData, college_appointment_date: date })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('joiningDate')} (Current Post)</label>
                        <DatePickerInput
                          required={true}
                          value={formData.joining_date}
                          onChange={(date) => setFormData({ ...formData, joining_date: date })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('tillDate')}</label>
                        <DatePickerInput
                          minDate={formData.joining_date}
                          value={formData.till_date}
                          onChange={(date) => setFormData({ ...formData, till_date: date })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Qualifications & Experience</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-bold text-slate-500">UG QUALIFICATION</label>
                        <input
                          type="text"
                          placeholder="e.g. MBBS"
                          value={formData.ug_qualification}
                          onChange={(e) => setFormData({ ...formData, ug_qualification: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">PASSING YEAR</label>
                        <input
                          type="text"
                          placeholder="YYYY"
                          maxLength={4}
                          value={formData.ug_passing_year}
                          onChange={(e) => setFormData({ ...formData, ug_passing_year: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-bold text-slate-500">PG QUALIFICATION</label>
                        <input
                          type="text"
                          placeholder="e.g. MD Anaesthesia"
                          value={formData.pg_qualification}
                          onChange={(e) => setFormData({ ...formData, pg_qualification: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">PASSING YEAR</label>
                        <input
                          type="text"
                          placeholder="YYYY"
                          maxLength={4}
                          value={formData.pg_passing_year}
                          onChange={(e) => setFormData({ ...formData, pg_passing_year: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">TOTAL TEACHING EXPERIENCE</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="Years"
                            value={formData.teaching_exp_years}
                            onChange={(e) => setFormData({ ...formData, teaching_exp_years: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white pr-12"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">YRS</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="11"
                            placeholder="Months"
                            value={formData.teaching_exp_months}
                            onChange={(e) => setFormData({ ...formData, teaching_exp_months: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white pr-12"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">MOS</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="31"
                            placeholder="Days"
                            value={formData.teaching_exp_days}
                            onChange={(e) => setFormData({ ...formData, teaching_exp_days: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white pr-12"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DAYS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certification Options */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Certifications & Approvals</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">MUHS APPROVAL</label>
                        <select
                          value={formData.muhs_approval}
                          onChange={(e) => setFormData({ ...formData, muhs_approval: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">DEBARRED</label>
                        <select
                          value={formData.debarred}
                          onChange={(e) => setFormData({ ...formData, debarred: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                    {formData.muhs_approval === "Yes" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">MUHS APPROVAL LETTER & DATE</label>
                        <input
                          type="text"
                          placeholder="e.g. MUHS/E-1/UG&PG/1303/5361/2007"
                          value={formData.muhs_approval_details}
                          onChange={(e) => setFormData({ ...formData, muhs_approval_details: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Identification & Contact */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2">Identification & Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">AADHAR NUMBER</label>
                        <input
                          type="text"
                          placeholder="12-digit Aadhar"
                          maxLength={12}
                          value={formData.aadhar_number}
                          onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">PAN NUMBER</label>
                        <input
                          type="text"
                          placeholder="10-character PAN"
                          maxLength={10}
                          value={formData.pan_number?.toUpperCase()}
                          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('mobileNumber')}</label>
                        <input
                          type="tel"
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">{t('email')}</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('additionalInfo')}</label>
                      <textarea
                        rows={3}
                        value={formData.additional_info}
                        onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-50 focus:bg-white"
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-slate-50 rounded-b-3xl">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all">
                    {t('cancel')}
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center border-b border-slate-100 bg-red-50/50">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Delete Doctor</h3>
                <p className="text-sm text-slate-500 mt-2">Enter master password to confirm deletion.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Master Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmDelete();
                    }}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium text-center"
                  />
                  {deleteError && (
                    <p className="text-red-500 text-sm font-bold text-center mt-2">{deleteError}</p>
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    {t('cancel')}
                  </button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Adding Doctors */}
      <button
        onClick={openNew}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-40 bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(79,70,229,0.4)] active:scale-95 transition-all duration-300 group"
        title={t('newDoctor') || "Add New Doctor"}
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
