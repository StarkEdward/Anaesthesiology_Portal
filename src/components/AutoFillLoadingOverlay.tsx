import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Cpu, Search, Sparkles, CheckCircle2 } from "lucide-react";

export function AutoFillLoadingOverlay() {
  const steps = [
    { icon: FileText, title: "Reading Document", desc: "Extracting structural data from file..." },
    { icon: Search, title: "Analyzing Content", desc: "Using AI to understand context..." },
    { icon: Cpu, title: "Matching Fields", desc: "Aligning found data to form fields..." },
    { icon: Sparkles, title: "Applying Magic", desc: "Populating the form elements..." },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000); // Change step every 4 seconds
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center font-sans"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-[400px] max-w-[90vw] relative overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-100/50 -z-10" />

        {/* Central Icon Animation */}
        <div className="relative mb-10 mt-4 flex items-center justify-center">
           {/* Pulsing ring */}
           <motion.div 
             animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute w-24 h-24 bg-green-200 rounded-full"
           />
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
             className="absolute w-16 h-16 bg-green-300 rounded-full"
           />
           
           <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-green-100 z-10 w-20 h-20 flex items-center justify-center text-green-600">
              <AnimatePresence mode="wait">
                {steps.map((step, index) => 
                  index === currentStep && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute"
                    >
                      <step.icon size={40} strokeWidth={1.5} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Text Details Section */}
        <div className="h-24 flex flex-col items-center justify-center w-full relative">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => 
              index === currentStep && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 flex flex-col items-center text-center justify-center"
                >
                   <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
                   <p className="text-sm text-slate-500 font-medium px-4">{step.desc}</p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-6 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: "5%" }}
                   animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                   transition={{ duration: 0.8, ease: "easeInOut" }}
                   className="h-full bg-green-500"
                />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span className="flex items-center gap-1">
                    <motion.span 
                        animate={{ opacity: [1, 0.4, 1] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        ●
                    </motion.span>
                    {currentStep === steps.length - 1 ? "Finishing" : "Processing"}
                </span>
            </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
