import React, { useState, useEffect, useMemo } from "react";
import { FileText, Download, Filter, Search, IndianRupee, Calendar, LayoutDashboard, Package, ArrowRightLeft, PieChart as PieChartIcon, AlertTriangle, Database, Upload } from "lucide-react";
import { Instrument, Transaction } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import DatePickerInput from './ui/DatePickerInput';

type TabType = 'overview' | 'inventory' | 'transactions' | 'financials' | 'database';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function Reports() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isUploading, setIsUploading] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubInst = onSnapshot(collection(db, "instruments"), (snapshot) => {
      const instList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setInstruments(instList);
    });

    const unsubTx = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTransactions(txList);
    });

    return () => {
      unsubInst();
      unsubTx();
    };
  }, []);

  // --- Filtering Logic ---
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Status Filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Date Filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.issue_date);
      
      if (dateRange === 'today') {
        return txDate >= today;
      } else if (dateRange === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return txDate >= lastWeek;
      } else if (dateRange === 'month') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return txDate >= lastMonth;
      } else if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Include the whole end day
        return txDate >= start && txDate <= end;
      }
      return true; // 'all'
    });

    return filtered;
  }, [transactions, dateRange, startDate, endDate, statusFilter]);

  // --- Calculations & Chart Data ---
  const totalStockValue = instruments
    .reduce((acc, curr) => acc + ((curr.current_stock || 0) * (curr.price || 0)), 0);
  
  const issuedValue = filteredTransactions.reduce((acc, tx) => {
    const inst = instruments.find(i => i.id.toString() === tx.instrument_id.toString());
    return acc + (tx.quantity * (inst?.price || 0));
  }, 0);

  // Usage Trends (Transactions per day)
  const usageTrendsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      const date = tx.issue_date;
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 active days
  }, [filteredTransactions]);

  // Top Consumers (Professors)
  const topConsumersData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      if (tx.professor_name) {
        counts[tx.professor_name] = (counts[tx.professor_name] || 0) + tx.quantity;
      }
    });
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name: name.substring(0, 15) + (name.length > 15 ? '...' : ''), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Most Used Instruments
  const mostUsedData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      counts[tx.instrument_name] = (counts[tx.instrument_name] || 0) + tx.quantity;
    });
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name: name.substring(0, 15) + (name.length > 15 ? '...' : ''), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Financial Pie Data
  const financialPieData = [
    { name: t('remainingValue'), value: totalStockValue, color: '#10b981' },
    { name: t('issuedValue'), value: issuedValue, color: '#6366f1' },
  ];

  // --- CSV Export Logic ---
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => {
        const strVal = String(val || '');
        return `"${strVal.replace(/"/g, '""')}"`; // Escape quotes
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportInventory = () => {
    const data = instruments.map(i => ({
      ID: i.id,
      Name: i.name,
      Company: i.company,
      'Unit Price': i.price || 0,
      'Current Stock': i.current_stock || 0,
      'Total Value': (i.price || 0) * (i.current_stock || 0),
      'Invoice No': i.invoice_no || '',
      'Invoice Date': i.invoice_date || '',
      'PO No': i.po_no || '',
      'PO Date': i.po_date || '',
      'Stock Book Page': i.stock_book_page_no || ''
    }));
    downloadCSV(data, `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportTransactions = () => {
    const data = filteredTransactions.map(t => ({
      ID: t.id,
      Date: t.issue_date,
      Instrument: t.instrument_name,
      Quantity: t.quantity,
      'Incharge Sister': `${t.incharge_sister_name || ''} ${t.incharge_sister_designation ? `(${t.incharge_sister_designation})` : ''}`,
      'Professor': t.professor_name,
      Status: t.status,
      'Delivered to OT': t.is_delivered_to_ot ? 'Yes' : 'No',
      'Prof Approved': t.is_approved_by_professor ? 'Yes' : 'No',
      'HOD Remark': t.hod_remark || 'None',
      Remark: t.remark
    }));
    downloadCSV(data, `transactions_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAudit = () => {
    const auditData = transactions.filter(t => t.hod_remark === 'Rejected' || t.hod_remark === 'Needs Clarification');
    const data = auditData.map(t => ({
      ID: t.id,
      Date: t.issue_date,
      Instrument: t.instrument_name,
      Quantity: t.quantity,
      'Professor': t.professor_name,
      'HOD Remark': t.hod_remark,
      Status: t.status
    }));
    downloadCSV(data, `audit_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- Render Helpers ---
  const renderTabs = () => (
    <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
      {[
        { id: 'overview', label: t('overviewTab'), icon: LayoutDashboard },
        { id: 'inventory', label: t('inventoryTab'), icon: Package },
        { id: 'transactions', label: t('transactionsTab'), icon: ArrowRightLeft },
        { id: 'financials', label: t('financialsTab'), icon: PieChartIcon },
        { id: 'database', label: t('databaseTab'), icon: Database },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabType)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 items-start lg:items-end">
      <div className="space-y-1 w-full lg:w-auto">
        <label className="text-xs font-bold text-slate-500 uppercase">{t('dateRange')}</label>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-white font-medium"
        >
          <option value="all">{t('allTime')}</option>
          <option value="today">{t('today')}</option>
          <option value="week">{t('thisWeek')}</option>
          <option value="month">{t('thisMonth')}</option>
          <option value="custom">{t('custom')}</option>
        </select>
      </div>

      {dateRange === 'custom' && (
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{t('startDate')}</label>
            <DatePickerInput 
              value={startDate} 
              onChange={setStartDate}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-left"
            />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{t('endDate')}</label>
            <DatePickerInput 
              value={endDate} 
              onChange={setEndDate}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-left"
            />
          </div>
        </div>
      )}

      <div className="space-y-1 w-full lg:w-auto">
        <label className="text-xs font-bold text-slate-500 uppercase">{t('statusFilter')}</label>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-white font-medium"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="Completed">{t('completed')}</option>
          <option value="Pending">{t('pending')}</option>
        </select>
      </div>
    </div>
  );

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(t('restoreWarning'))) {
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('database', file);

    try {
      const res = await fetch('/api/database/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        showToast(t('restoreSuccess') || "Database restored successfully", 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const err = await res.json();
        showToast(`${t('restoreError') || "Restore error"}: ${err.error}`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast(t('restoreError') || "Restore error", 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50/50">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('reportsTitle')}</h2>
          <p className="text-slate-500 font-medium mt-1">{t('reportsDesc')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportInventory} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4 text-emerald-600" /> {t('exportInventory')}
          </button>
          <button onClick={exportTransactions} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4 text-indigo-600" /> {t('exportTransactions')}
          </button>
          <button onClick={exportAudit} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> {t('exportAudit')}
          </button>
        </div>
      </header>

      {renderTabs()}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {renderFilters()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                    <IndianRupee className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('totalStockValue')}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">₹{totalStockValue.toLocaleString()}</h3>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('totalTransactions')}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{filteredTransactions.length}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">{t('usageTrends')}</h3>
                  <div className="h-72">
                    {usageTrendsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={usageTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 font-medium">{t('noData')}</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">{t('topConsumers')}</h3>
                  <div className="h-72">
                    {topConsumersData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topConsumersData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 font-medium">{t('noData')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-slate-900">{t('inventorySummary')}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('instrument')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('company')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-right">{t('stock')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-right">{t('unitPrice')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-right">{t('totalValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instruments.map(item => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-4 text-sm text-slate-600">{item.company}</td>
                        <td className="py-4 font-bold text-indigo-600 text-right">{item.current_stock}</td>
                        <td className="py-4 text-sm text-slate-600 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="py-4 font-bold text-emerald-600 text-right">₹{(item.price * item.current_stock).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {instruments.length === 0 && (
                  <p className="text-slate-400 text-center py-10 font-medium italic">{t('noInstruments')}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {renderFilters()}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">{t('mostUsedInstruments')}</h3>
                  <div className="h-64">
                    {mostUsedData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mostUsedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="quantity" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 font-medium">{t('noData')}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('date')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('instrument')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('qty')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('professorName')}</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm text-slate-600">{tx.issue_date}</td>
                        <td className="py-4 font-bold text-slate-900">{tx.instrument_name}</td>
                        <td className="py-4 font-bold text-indigo-600">{tx.quantity}</td>
                        <td className="py-4 text-sm text-slate-600">{tx.professor_name || '---'}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tx.status === 'Completed' ? t('completed') : t('pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                  <p className="text-slate-400 text-center py-10 font-medium italic">{t('noData')}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              {renderFilters()}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">{t('financialBreakdown')}</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {financialPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `₹${value.toLocaleString()}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center gap-6">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('remainingValue')}</p>
                    <h3 className="text-4xl font-black text-emerald-700">₹{totalStockValue.toLocaleString()}</h3>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">{t('issuedValue')} (Filtered)</p>
                    <h3 className="text-4xl font-black text-indigo-700">₹{issuedValue.toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                    <Download className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{t('backupDatabase')}</h3>
                  <p className="text-slate-500 font-medium mb-4">{t('backupDesc')}</p>
                  <a 
                    href="/api/database/download" 
                    download="inventory_backup.db"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    {t('backupDatabase')}
                  </a>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{t('restoreDatabase')}</h3>
                  <p className="text-slate-500 font-medium mb-4">{t('restoreDesc')}</p>
                  
                  <label className={`px-8 py-3 ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'} text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-200`}>
                    {isUploading ? t('uploading') : t('restoreDatabase')}
                    <input 
                      type="file" 
                      accept=".db,.sqlite,.sqlite3" 
                      className="hidden" 
                      onChange={handleRestore}
                      disabled={isUploading}
                    />
                  </label>
                  <p className="text-xs text-red-500 font-bold mt-2">{t('restoreWarning')}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
