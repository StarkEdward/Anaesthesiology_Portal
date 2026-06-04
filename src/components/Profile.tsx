import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Briefcase, Building, Hash, Save, Languages } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

export default function Profile() {
  const { user, userData, role } = useAuth();
  const { showToast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    marathiName: "",
    designation: "",
    department: "",
    phone: "",
    employeeId: ""
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        marathiName: userData.marathiName || "",
        designation: userData.designation || "",
        department: userData.department || "",
        phone: userData.phone || "",
        employeeId: userData.employeeId || ""
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        ...formData
      }, { merge: true });
      showToast("Profile updated successfully!", "success");
      // Note: In a real app we might update the AuthContext directly here 
      // to avoid waiting for a refresh, but the realtime snapshot listener or hard refresh would pick it up too.
      // For immediate effect:
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[calc(100vh-4rem)]">
      
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-black">
            {formData.name ? formData.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {formData.name || "Setup Your Profile"}
            </h1>
            <p className="text-slate-500 font-medium">
              {user?.email}
            </p>
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {role} Role
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1 */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <User className="w-3 h-3"/> Full Name (English)
              </label>
              <input 
                type="text" 
                placeholder="e.g. Sagar Kamble"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Languages className="w-3 h-3 text-indigo-500"/> Full Name (Marathi)
              </label>
               {/* @ts-ignore */}
               <ReactTransliterate
                value={formData.marathiName}
                onChangeText={(text) => setFormData({...formData, marathiName: text})}
                lang="mr"
                placeholder="Type in English & hit Space (e.g. Sagar -> सागर)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
                containerClassName="w-full"
                activeItemStyles={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Phone className="w-3 h-3"/> Phone Number
              </label>
              <input 
                type="text" 
                placeholder="+91..."
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Briefcase className="w-3 h-3"/> Designation (e.g. कनिष्ठ लिपिक)
              </label>
               {/* @ts-ignore */}
               <ReactTransliterate
                value={formData.designation}
                onChangeText={(text) => setFormData({...formData, designation: text})}
                lang="mr"
                placeholder="Type in English & hit Space"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
                containerClassName="w-full"
                activeItemStyles={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Building className="w-3 h-3"/> Department
              </label>
               {/* @ts-ignore */}
               <ReactTransliterate
                value={formData.department}
                onChangeText={(text) => setFormData({...formData, department: text})}
                lang="mr"
                placeholder="e.g. बधिरीकरणशास्त्र विभाग"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
                containerClassName="w-full"
                activeItemStyles={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Hash className="w-3 h-3"/> Employee / Registration ID
              </label>
              <input 
                type="text" 
                placeholder="EMP-1234"
                value={formData.employeeId} 
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm text-slate-800"
              />
            </div>
          </div>

        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            {isSaving ? "Saving Data..." : <><Save className="w-4 h-4"/> Save Profile</>}
          </button>
        </div>

      </div>
    </div>
  );
}
