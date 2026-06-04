import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { logout } from "../firebase";
import { User, LogOut, Languages, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopHeader({ onMenuClick, toggleDesktopSidebar, isSidebarCollapsed }: { onMenuClick?: () => void, toggleDesktopSidebar?: () => void, isSidebarCollapsed?: boolean }) {
  const { userData, user, role } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const displayName = userData?.name || user?.email?.split('@')[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 shadow-sm h-[65px]">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          onClick={toggleDesktopSidebar}
          className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isSidebarCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h8m-8 6h16"} />
          </svg>
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-bold text-slate-700 leading-tight">{displayName}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2">
             <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
             </div>
             
             <button 
               onClick={() => handleNavigate("/profile")}
               className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
             >
               <User className="w-4 h-4" /> My Profile
             </button>

             <button 
               onClick={() => { toggleLanguage(); setIsDropdownOpen(false); }}
               className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
             >
               <Languages className="w-4 h-4" /> {language === 'en' ? 'Switch to मराठी' : 'Switch to English'}
             </button>

             <div className="border-t border-slate-50 my-1"></div>

             <button 
               onClick={logout}
               className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
             >
               <LogOut className="w-4 h-4" /> {t('logout')}
             </button>
          </div>
        )}
      </div>
    </header>
  );
}
