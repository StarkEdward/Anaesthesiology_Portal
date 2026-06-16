import React, { useState, useEffect, useRef } from "react";
import { Printer, Download, Upload, FileText, Loader2, Save, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import * as mammoth from "mammoth";
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import Page1 from "./Page1";
import Page2 from "./Page2";
import Page3 from "./Page3";
import Page4 from "./Page4";
import Page5 from "./Page5";
import Page6 from "./Page6";
import Page7 from "./Page7";
import Page8 from "./Page8";
import Page9 from "./Page9";
import { WelcomeGuide } from "./WelcomeGuide";
import { AutoFillLoadingOverlay } from "./AutoFillLoadingOverlay";

import { FormProvider, useFormContext } from "../context/FormContext";

function NMCDeclarationFormInner() {
  const { formData, setFormData } = useFormContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"print" | "pdf" | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [selectedTitle, setSelectedTitle] = useState(
    "Faculty/ SR/ Tutor/ JR/ Demonstrator",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleInput = (e: Event) => {

      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName === "INPUT") {
        const input = target as HTMLInputElement;
        if (input.type === "radio" || input.type === "checkbox") {
          if (input.type === "radio") {
            const form = input.closest("form");
            const radios = form
              ? form.querySelectorAll(`input[name="${input.name}"]`)
              : document.querySelectorAll(`input[name="${input.name}"]`);
            radios.forEach((r) => {
              r.removeAttribute("checked");
            });
          }
          if (input.checked) {
            input.setAttribute("checked", "checked");
          } else {
            input.removeAttribute("checked");
          }
        } else if (input.type !== "file") {
          input.setAttribute("value", input.value);
        }
      } else if (target.tagName === "TEXTAREA") {
        const ta = target as HTMLTextAreaElement;
        ta.innerHTML = ta.value;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
      }
    };

    document.addEventListener("change", handleInput);
    document.addEventListener("input", handleInput);

    return () => {
      document.removeEventListener("change", handleInput);
      document.removeEventListener("input", handleInput);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const loadRecord = async () => {
      try {
        const docRef = doc(db, 'nmc_declarations', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.formData) {
             setFormData(data.formData);
          }
          if (data.uncontrolledFields) {
             setTimeout(() => {
               const formElements = Array.from(
                 document.querySelectorAll(
                   'input:not([type="hidden"]):not([type="file"]), textarea, select',
                 ),
               ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];

               formElements.forEach((el, i) => {
                 const key = i.toString();
                 if (key in data.uncontrolledFields) {
                   const savedValue = data.uncontrolledFields[key];
                   if (el.type === "checkbox" || el.type === "radio") {
                     (el as HTMLInputElement).checked = savedValue as boolean;
                   } else {
                     el.value = savedValue as string;
                   }
                   el.dispatchEvent(new Event("change", { bubbles: true }));
                   el.dispatchEvent(new Event("input", { bubbles: true }));
                 }
               });
             }, 500);
          }
        }
      } catch (err) {
        console.error("Error loading record:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecord();
  }, [id, setFormData]);

  const validateForm = () => {
    const required = [
      { key: "facultyNameFirst", label: "First Name" },
      { key: "facultyNameLast", label: "Last Name" },
      { key: "collegeName", label: "College Name" },
      { key: "designation", label: "Designation" },
      { key: "department", label: "Department" }
    ];
    const missing = required.filter(f => !formData[f.key as keyof typeof formData]);
    if (missing.length > 0) {
      setToastMessage({
        type: "error",
        text: `Please fill required fields: ${missing.map(m => m.label).join(", ")}`,
      });
      setTimeout(() => setToastMessage(null), 5000);
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (validateForm()) {
      setPendingAction("print");
      setShowConfirmModal(true);
    }
  };

  const handleDownloadPdf = () => {
    if (validateForm()) {
      setPendingAction("pdf");
      setShowConfirmModal(true);
    }
  };

  const executeAction = async () => {
    setShowConfirmModal(false);
    if (pendingAction === "print") {
      executePrint();
    } else if (pendingAction === "pdf") {
      await executeDownloadPdf();
    }
    setPendingAction(null);
  };

  const executePrint = () => {
    try {
      if (window.self !== window.top) {
        setToastMessage({
          type: "info",
          text: "Printing is typically blocked inside this preview window. Please use 'Download PDF' instead, or open this app in a new tab.",
        });
        setTimeout(() => setToastMessage(null), 8000);
      }
      window.print();
    } catch (e) {
      console.error(e);
      setToastMessage({
        type: "error",
        text: "Printing was blocked by the browser. Please use 'Download PDF' instead.",
      });
      setTimeout(() => setToastMessage(null), 8000);
    }
  };

  const executeDownloadPdf = async () => {
    setToastMessage({
      type: "info",
      text: "To save as a selectable PDF, please use the Print dialog and choose 'Save as PDF'.",
    });
    setTimeout(() => {
      setToastMessage(null);
      executePrint();
    }, 1500);
  };

  const handleSaveRecord = async () => {
    setIsSaving(true);
    try {
      const formElements = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="file"]), textarea, select',
        ),
      ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
      
      const uncontrolledFields: Record<string, string | boolean> = {};
      formElements.forEach((el, i) => {
        if (el.type === "checkbox" || el.type === "radio") {
          uncontrolledFields[i.toString()] = (el as HTMLInputElement).checked;
        } else {
          uncontrolledFields[i.toString()] = el.value;
        }
      });

      const recordId = id || Math.random().toString(36).substring(2, 10);
      const docRef = doc(db, 'nmc_declarations', recordId);
      
      await setDoc(docRef, {
        id: recordId,
        facultyNameFirst: formData.facultyNameFirst,
        facultyNameMiddle: formData.facultyNameMiddle,
        facultyNameLast: formData.facultyNameLast,
        designation: formData.designation,
        department: formData.department,
        formData,
        uncontrolledFields,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });

      setToastMessage({ type: "success", text: "Record saved successfully!" });
      setTimeout(() => setToastMessage(null), 3000);
      
      if (!id) {
        navigate(`/declaration/${recordId}`, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({ type: "error", text: "Failed to save record" });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formElements = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="file"]), textarea, select',
        ),
      ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
      const formSchema = formElements.map((el, i) => {
        el.setAttribute("data-af-id", i.toString());
        let labelText = "";
        const id = el.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) labelText = label.textContent || "";
        }
        if (!labelText && el.parentElement) {
          labelText = el.parentElement.innerText?.replace(/\s+/g, " ").substring(0, 100);
          if (el.parentElement.parentElement && labelText.length < 30) {
            labelText = el.parentElement.parentElement.innerText?.replace(/\s+/g, " ").substring(0, 150) + " " + labelText;
          }
        }
        return {
          id: i.toString(),
          type: el.type || el.tagName.toLowerCase(),
          name: el.name || undefined,
          context: labelText.trim(),
          value: el.value,
          placeholder: el.getAttribute("placeholder") || undefined,
          options: el.tagName === "SELECT" ? Array.from((el as HTMLSelectElement).options).map(o => o.value) : undefined
        };
      });
      const payload = new FormData();
      payload.append("formSchema", JSON.stringify(formSchema));
      const tableElements = Array.from(document.querySelectorAll('[data-af-table]'));
      const tableSchemas = tableElements.map(el => {
          const tableName = el.getAttribute('data-af-table');
          const cols = Array.from(el.querySelectorAll('[data-af-col]')).map(c => c.getAttribute('data-af-col'));
          const uniqueCols = Array.from(new Set(cols)).filter(Boolean);
          return { tableName, columns: uniqueCols };
      });
      if (tableSchemas.length > 0) {
          payload.append("tableSchemas", JSON.stringify(tableSchemas));
      }
      if (file.name.toLowerCase().endsWith(".doc")) {
        setToastMessage({ text: "Old .doc format is not supported. Please save your file as .docx or .pdf and try again.", type: "error" });
        setTimeout(() => setToastMessage(null), 6000);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.name.toLowerCase().endsWith(".pdf")) {
        payload.append("file", file, file.name);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        payload.append("documentHtml", result.value);
      }
      const response = await fetch("/api/autofill", { method: "POST", body: payload });
      let data;
      try {
        const text = await response.text();
        try { data = JSON.parse(text); } catch (e) { if (!response.ok) throw new Error(text.substring(0, 100)); throw new Error("Failed to parse server response as JSON"); }
      } catch (err: any) { throw new Error(err.message || "Failed to process server response"); }
      if (!response.ok) throw new Error(data?.error || `Status ${response.status}`);
      if (data.data && Array.isArray(data.data.fields)) {
        data.data.fields.forEach((field: any) => {
          const el = document.querySelector(`[data-af-id="${field.id}"]`) as any;
          if (el) {
            if (el.type === "checkbox" || el.type === "radio") {
              if (field.value === "true" || field.value === true) {
                el.checked = true;
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
            } else {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
              const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
              const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
              let setter = nativeInputValueSetter;
              if (el.tagName === "TEXTAREA") setter = nativeTextAreaValueSetter;
              if (el.tagName === "SELECT") setter = nativeSelectValueSetter;
              if (setter) {
                setter.call(el, field.value);
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              } else { el.value = field.value; }
            }
          }
        });
      }
      const fillEvent = new CustomEvent("autofill", { detail: data.data });
      document.dispatchEvent(fillEvent);
      setTimeout(() => {
        setToastMessage({ text: "Application form filled successfully.", type: "success" });
        setTimeout(() => setToastMessage(null), 4000);
      }, 300);
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMsg = "Failed to extract data. Please try again.";
      if (error && error.message) {
        if (error.message.includes("GEMINI")) errorMsg = "AI Autofill requires a GEMINI_API_KEY in your .env file to work.";
        else errorMsg = `Error: ${error.message}`;
      }
      setToastMessage({ text: errorMsg, type: "error" });
      setTimeout(() => setToastMessage(null), 8000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading form data...</p>
      </div>
    );
  }

  return (
    <>
      <WelcomeGuide />
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-lg border flex items-center gap-3 font-sans w-max max-w-[90vw] text-sm font-medium ${
              toastMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toastMessage.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toastMessage.type === "success" ? (
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : toastMessage.type === "error" ? (
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            )}
            <span className="truncate">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isUploading && <AutoFillLoadingOverlay />}
      </AnimatePresence>

      <div className="sticky top-0 z-40 bg-gray-100 border-b border-gray-300 px-8 py-4 mb-6 shadow-sm">
        <div className="max-w-[794px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/declaration')}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Hub</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
              {id ? 'Edit Declaration Form' : 'New Declaration Form'}
            </h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleSaveRecord}
              disabled={isSaving || isGenerating}
              className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded font-bold text-sm shadow hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? "Saving..." : "Save Record"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="nmc-form min-h-screen bg-gray-100 py-8 pb-28 print:py-0 print:bg-white font-serif text-black overflow-x-auto">
        <div className="text-center mb-8 print:hidden">
          <h2 className="text-2xl font-bold font-serif text-gray-800">
            Jannayak Birsa Munda Government Medical College Nandurbar
          </h2>
          <h3 className="text-xl font-semibold font-serif text-gray-700 mt-2">
            Department of anaesthesia
          </h3>
        </div>

        <form id="pdf-content" onSubmit={(e) => e.preventDefault()}>
          <div className="a4-page bg-white">
            <div className="text-center pb-10 pt-4 flex flex-col items-center">
              <select
                className="print-hidden mb-2 p-1 border border-gray-300 rounded text-sm font-sans bg-transparent cursor-pointer"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
              >
                <option value="Faculty/ SR/ Tutor/ JR/ Demonstrator">Show All (Faculty/ SR/ Tutor/ JR/ Demonstrator)</option>
                <option value="Faculty">Faculty</option>
                <option value="SR">SR</option>
                <option value="Tutor">Tutor</option>
                <option value="JR">JR</option>
                <option value="Demonstrator">Demonstrator</option>
              </select>
              <h1 className="text-[26px] font-bold font-serif tracking-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                {selectedTitle} Declaration Form
              </h1>
            </div>
            <Page1 />
          </div>

          <div className="a4-page bg-white relative">
            <Page2 />
            <div className="absolute bottom-6 right-8 text-sm font-serif">2</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page3 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">3</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page4 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">4</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page5 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">5</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page6 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">6</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page7 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">7</div>
          </div>

          <div className="a4-page bg-white relative">
            <Page8 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">
              8
            </div>
          </div>

          <div className="a4-page bg-white relative">
            <Page9 />
            <div className="absolute bottom-6 right-8 text-sm font-bold font-serif">
              9
            </div>
          </div>
        </form>

        {/* Floating actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col items-center gap-2 print:hidden z-50">
          <div className="flex justify-center flex-wrap gap-4">
            <input
              type="file"
              accept=".docx,.pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded font-bold text-sm shadow hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{isUploading ? "Auto-filling..." : "Auto-fill (PDF / DOCX)"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gray-600 text-white rounded font-bold text-sm shadow hover:bg-gray-700 transition"
            >
              <Printer size={18} />
              <span>Print Document</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded font-bold text-sm shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span>{isGenerating ? "Generating..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-6 font-sans">
                <div className="w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded-full mb-4 mx-auto">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                   </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Form Validated</h3>
                <p className="text-gray-500 text-center text-sm">
                   All required fields have been filled. Are you sure you want to proceed with {pendingAction === "print" ? "printing the form" : "downloading the PDF"}?
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAction}
                  className="px-6 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                >
                  Confirm & Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function NMCDeclarationForm() {
  return (
    <FormProvider>
      <NMCDeclarationFormInner />
    </FormProvider>
  );
}
