import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Layout Components
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

// View Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PAC from './components/PAC';
import Doctors from './components/Doctors';
import NMCDeclarationForm from './components/NMCDeclarationForm';
import NMCDeclarationHub from './components/NMCDeclarationHub';

import NMCFormA from './components/NMCFormA';
import NMCFormAHub from './components/NMCFormAHub';

import NMCFormB from './components/NMCFormB';
import NMCFormBHub from './components/NMCFormBHub';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import Library from './components/Library';
import LeaveApplication from './components/LeaveApplication';
import OfficialLeaveLetter from './components/OfficialLeaveLetter';
import AttendanceSystem from './components/AttendanceSystem';
import Reports from './components/Reports';
import Users from './components/Users';
import Profile from './components/Profile';


function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:block print:h-auto print:bg-white print:overflow-visible">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} print:block print:overflow-visible print:pl-0`}>
        <div className="print:hidden">
          <TopHeader 
            onMenuClick={() => { setSidebarOpen(true); setSidebarCollapsed(false); }} 
            toggleDesktopSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            isSidebarCollapsed={sidebarCollapsed}
          />
        </div>
        <main className="flex-1 overflow-auto overflow-x-hidden relative print:block print:overflow-visible">
          <div className="absolute inset-0 print:relative print:inset-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/pac" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}><MainLayout><PAC /></MainLayout></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><Doctors /></MainLayout></ProtectedRoute>} />
              
              <Route path="/declaration" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCDeclarationHub /></MainLayout></ProtectedRoute>} />
              <Route path="/declaration/new" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCDeclarationForm /></MainLayout></ProtectedRoute>} />
              <Route path="/declaration/:id" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCDeclarationForm /></MainLayout></ProtectedRoute>} />
              
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'nurse', 'clerk']}><MainLayout><Inventory /></MainLayout></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute allowedRoles={['admin', 'nurse', 'clerk']}><MainLayout><Transactions /></MainLayout></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><Library /></MainLayout></ProtectedRoute>} />
              <Route path="/leave" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><LeaveApplication /></MainLayout></ProtectedRoute>} />
              <Route path="/official-leave" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><OfficialLeaveLetter /></MainLayout></ProtectedRoute>} />
              
              <Route path="/nmc-form-a" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormAHub /></MainLayout></ProtectedRoute>} />
              <Route path="/nmc-form-a/new" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormA /></MainLayout></ProtectedRoute>} />
              <Route path="/nmc-form-a/:id" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormA /></MainLayout></ProtectedRoute>} />

              <Route path="/nmc-form-b" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormBHub /></MainLayout></ProtectedRoute>} />
              <Route path="/nmc-form-b/new" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormB /></MainLayout></ProtectedRoute>} />
              <Route path="/nmc-form-b/:id" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'clerk']}><MainLayout><NMCFormB /></MainLayout></ProtectedRoute>} />
              
              <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'clerk', 'doctor']}><MainLayout><AttendanceSystem /></MainLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'doctor']}><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout><Users /></MainLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}


