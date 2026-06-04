import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, X, ShieldAlert, Zap, FileSearch, CheckCircle2 } from "lucide-react";

export function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button to manually open guide */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center print:hidden group"
        aria-label="Help Guide"
      >
        <Info size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out">
          Form Guide
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-900 p-6 flex justify-between items-start text-white">
                <div>
                  <h2 className="text-xl font-bold font-serif mb-1 leading-tight">
                    Jannayak Birsa Munda Government Medical College, Nandurbar
                  </h2>
                  <h3 className="text-indigo-200 text-sm font-medium mb-2">Department of Anaesthesia</h3>
                  <div className="inline-block mt-2 px-3 py-1 bg-white/10 rounded border border-white/20 text-sm text-white">
                    NMC Declaration Form Assistant
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 font-sans">
                
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">AI-Powered Auto-Fill from Previous Form</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      Upload a <strong>previously completed document</strong> (PDF or DOCX), and our AI will attempt to extract your answers and map them directly into this new blank form. It saves you time by avoiding manual data entry.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">Verify Before You Print</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      <strong>AI can make mistakes.</strong> It might misinterpret complex layouts, unreadable fonts, or ambiguous selections (like multiple checked boxes). Always double-check every field before you finalize the document.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">Manual Corrections</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      The form remains fully interactive after auto-filling. You can type, click, and edit any field. Ensure dates are formatted correctly and radio buttons are appropriately selected.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                    <FileSearch size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">Exporting your Data</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      When you're completely satisfied, use the <span className="font-semibold">Print</span> or <span className="font-semibold">Download PDF</span> buttons at the bottom. Floating controls and this guide will automatically hide and won't appear on the printed document.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-indigo-600 font-medium text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
                >
                  I Understand, Let's Start
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
