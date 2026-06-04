import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, X, Languages, Users, LogOut, FileSignature, ShieldAlert, CalendarRange, User, ChevronDown, Syringe, BookOpen } from "lucide-react";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";
import { logout } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: { isOpen: boolean, setIsOpen: (val: boolean) => void, isCollapsed?: boolean, setIsCollapsed?: (val: boolean) => void }) {
  const { t } = useLanguage();
  const { role } = useAuth();
  
  // Track which categories are open by their title. Default is open for all.
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "OVERVIEW": true,
    "CLINICAL": true,
    "FORMS": true,
    "STORE & ASSETS": true,
    "ACADEMICS": true,
    "ADMINISTRATION": true
  });

  const toggleCategory = (title: string) => {
    if (isCollapsed && setIsCollapsed) setIsCollapsed(false);
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const menuCategories = [
    {
      title: "OVERVIEW",
      items: [
        { icon: LayoutDashboard, label: t('dashboard'), path: "/", roles: ['admin', 'doctor', 'nurse', 'clerk', 'pending'] }
      ]
    },
    {
      title: "CLINICAL",
      items: [
        { icon: FileSignature, label: t('pacForm'), path: "/pac", roles: ['admin', 'doctor', 'nurse'] },
        { icon: Users, label: t('doctors'), path: "/doctors", roles: ['admin', 'doctor', 'clerk'] },
      ]
    },
    {
      title: "FORMS",
      items: [
        { icon: FileText, label: "Declaration Form", path: "/declaration", roles: ['admin', 'doctor', 'clerk'] },
        { icon: CalendarRange, label: "Leave Application", path: "/leave", roles: ['admin', 'doctor', 'clerk'] },
        { icon: FileSignature, label: "Official Leave Letter", path: "/official-leave", roles: ['admin', 'doctor', 'clerk'] },
        { icon: FileText, label: "NMC Form B (Anaesthesia)", path: "/nmc-form-b", roles: ['admin', 'doctor', 'clerk'] },
      ]
    },
    {
      title: "STORE & ASSETS",
      items: [
        { icon: Package, label: t('inventory'), path: "/inventory", roles: ['admin', 'nurse', 'clerk'] },
        { icon: ArrowRightLeft, label: t('transactions'), path: "/transactions", roles: ['admin', 'nurse', 'clerk'] },
      ]
    },
    {
      title: "ACADEMICS",
      items: [
        { icon: BookOpen, label: t('library'), path: "/library", roles: ['admin', 'doctor', 'clerk'] },
      ]
    },
    {
      title: "ADMINISTRATION",
      items: [
        { icon: Users, label: 'Attendance System', path: "/attendance", roles: ['admin', 'clerk', 'doctor'] },
        { icon: FileText, label: t('reports'), path: "/reports", roles: ['admin', 'doctor'] },
        { icon: ShieldAlert, label: 'Manage Roles', path: "/users", roles: ['admin'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-64 md:w-20" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className={cn("border-b border-slate-800 flex items-center h-[93px] transition-all", isCollapsed ? "p-6 justify-between md:p-3 md:justify-center" : "p-6 justify-between")}>
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none overflow-hidden whitespace-nowrap" onClick={() => setIsOpen(false)}>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm border-2 border-indigo-500/30">
              <img src="/logo-1.png" alt="GMC Nandurbar Logo" className="w-[120%] h-[120%] object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className={cn("min-w-0 transition-opacity duration-300", isCollapsed && "md:hidden")}>
              <h1 className="text-sm font-bold text-indigo-400 leading-tight truncate">{t('collegeNameShort')}</h1>
              <p className="text-[10px] font-medium text-slate-300 mt-0.5 truncate">{t('deptName')}</p>
            </div>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white shrink-0" onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuCategories.map((category, idx) => {
            const visibleItems = category.items.filter(item => item.roles.includes(role));
            
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={category.title} className={cn("mb-2", idx === 0 ? "mt-2" : "")}>
                <button 
                  onClick={() => toggleCategory(category.title)}
                  className={cn("w-full flex items-center justify-between px-4 py-2 mb-1 group cursor-pointer outline-none", isCollapsed && "md:hidden")}
                >
                  <span className="text-[10px] font-black tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors uppercase">{category.title}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 transition-transform duration-200", !openCategories[category.title] ? "-rotate-90" : "rotate-0")} />
                </button>
                {isCollapsed && (
                  <div className="hidden md:block h-0 border-b border-slate-800 my-4 mx-2"></div>
                )}
                
                <div 
                  className={cn(
                    "space-y-1 overflow-hidden transition-all duration-300 ease-in-out", 
                    !openCategories[category.title] && !isCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-[500px] opacity-100 mb-6"
                  )}
                >
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative group",
                          isActive 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                          isCollapsed ? "justify-center px-0" : ""
                        )
                      }
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className={cn("font-medium text-sm truncate transition-all duration-300", isCollapsed && "md:hidden")}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-medium bg-slate-900">
          <span className={cn(isCollapsed && "md:hidden")}>v1.0.0 © 2026</span>
          <span className={cn("hidden", isCollapsed && "md:inline")}>©'26</span>
        </div>
      </aside>
    </>
  );
}
