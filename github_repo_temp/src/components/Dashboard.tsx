import { useEffect, useState } from "react";
import { Package, IndianRupee, ArrowUpRight, AlertTriangle, Clock, Activity, BarChart3, Truck, UserCheck, AlertOctagon, CheckCircle2, XCircle, FileSignature, BookOpen, Stethoscope } from "lucide-react";
import { DashboardStats, Instrument, Transaction, PACRecord, Book } from "../types";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import _ from "lodash";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pacRecords, setPacRecords] = useState<PACRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubInst = onSnapshot(collection(db, "instruments"), (snapshot) => {
      const instList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setInstruments(instList);
    });

    const unsubTx = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTransactions(txList);
    });

    const unsubPac = onSnapshot(collection(db, "pac_records"), (snapshot) => {
      const pacList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setPacRecords(pacList);
    });

    const unsubBooks = onSnapshot(collection(db, "library"), (snapshot) => {
      const bookList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setBooks(bookList);
    });

    return () => {
      unsubInst();
      unsubTx();
      unsubPac();
      unsubBooks();
    };
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalStock = _.sumBy(instruments, i => ((i as any).current_stock || 0) + ((i as any).total_issued || 0));
    const totalIssued = _.sumBy(instruments, i => (i as any).total_issued || 0);
    const remainingStock = _.sumBy(instruments, i => (i as any).current_stock || 0);
    const totalPrice = _.sumBy(instruments, i => (((i as any).current_stock || 0) + ((i as any).total_issued || 0)) * ((i as any).price || 0));
    const lowStock = instruments.filter(i => ((i as any).current_stock || 0) < 5).length;
    
    const issuedToday = _.sumBy(transactions.filter(t => t.issue_date === today), 'quantity');
    const pending = transactions.filter(t => t.status === 'Pending').length;
    const pendingOTDeliveries = transactions.filter(t => !t.is_delivered_to_ot).length;
    const pendingProfApprovals = transactions.filter(t => !t.is_approved_by_professor).length;
    const hodActionRequired = transactions.filter(t => t.hod_remark && t.hod_remark.length > 0).length;
    
    const remarks = _.countBy(transactions.filter(t => t.hod_remark), 'hod_remark');
    const hodRemarksDistribution = Object.entries(remarks).map(([remark, count]) => ({ 
      remark, 
      count: count as number 
    }));

    setStats({
      totalStock,
      totalIssued,
      remainingStock,
      totalPrice,
      issuedToday,
      pending,
      lowStock,
      pendingOTDeliveries,
      pendingProfApprovals,
      hodActionRequired,
      hodRemarksDistribution,
      activeDoctors: 0, 
    });
  }, [instruments, transactions]);

  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = async () => {
    if (!stats) return;
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/ai/quick-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {
          totalStock: stats.totalStock,
          totalIssued: stats.totalIssued,
          issuedToday: stats.issuedToday,
          pendingActions: stats.pending,
          lowStockWarnings: stats.lowStock,
          pendingOTDeliveries: stats.pendingOTDeliveries,
          pendingProfApprovals: stats.pendingProfApprovals,
          hodActionRequired: stats.hodActionRequired
        } }),
      });
      const result = await res.json();
      if (result.insights) {
        setInsights(result.insights);
      } else {
        setInsights("Failed to fetch insights.");
      }
    } catch (error) {
      setInsights("Error connecting to AI service.");
    } finally {
      setLoadingInsights(false);
    }
  };

  if (!stats) return (
    <div className="p-8 flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Determine access based on role
  const normalizedRole = role?.toLowerCase().trim();
  const isStrictDoctor = normalizedRole === 'doctor';
  const isDoctorOrNurse = normalizedRole === 'doctor' || normalizedRole === 'nurse';
  const isClerkOrNurse = normalizedRole === 'clerk' || normalizedRole === 'nurse';
  const isAdminUser = normalizedRole === 'admin';

  // Overlays for specific roles as per request
  const showClinical = isDoctorOrNurse || isAdminUser;
  // Strictly hide inventory for doctors unless they are also admin
  const showInventory = (isClerkOrNurse || isAdminUser) && !isStrictDoctor;

  const clinicalCards = [
    { title: "Total PAC Records", value: pacRecords.length, icon: FileSignature, color: "bg-indigo-600", shadow: "shadow-indigo-500/20", path: "/pac" },
    { title: "Fit for Surgery", value: pacRecords.filter(r => r.fitness === 'Fit').length, icon: CheckCircle2, color: "bg-emerald-500", shadow: "shadow-emerald-500/20", path: "/pac" },
    { title: "Unfit / Conditional", value: pacRecords.filter(r => r.fitness === 'Unfit' || r.fitness === 'Conditional').length, icon: AlertTriangle, color: "bg-amber-500", shadow: "shadow-amber-500/20", path: "/pac" },
    { title: "Library Books", value: books.length, icon: BookOpen, color: "bg-violet-600", shadow: "shadow-violet-500/20", path: "/library" },
    { title: "Doctors Directory", value: "View", icon: Stethoscope, color: "bg-slate-700", shadow: "shadow-slate-700/20", path: "/doctors" },
  ];

  const inventoryCards = [
    { title: t('totalStock'), value: stats.totalStock, icon: Package, color: "bg-blue-500", shadow: "shadow-blue-500/20", path: "/inventory" },
    { title: t('remainingStock'), value: stats.remainingStock, icon: Activity, color: "bg-emerald-500", shadow: "shadow-emerald-500/20", path: "/inventory" },
    { title: t('issuedStock'), value: stats.totalIssued, icon: ArrowUpRight, color: "bg-indigo-500", shadow: "shadow-indigo-500/20", path: "/transactions" },
    { title: t('issuedToday'), value: stats.issuedToday, icon: BarChart3, color: "bg-violet-500", shadow: "shadow-violet-500/20", path: "/transactions" },
    { title: t('totalValue'), value: `₹${stats.totalPrice.toLocaleString()}`, icon: IndianRupee, color: "bg-slate-700", shadow: "shadow-slate-700/20", path: "/reports" },
  ];

  const actionCards = showInventory ? [
    { title: t('pendingSign'), value: stats.pending, icon: Clock, color: "bg-amber-500", shadow: "shadow-amber-500/20", path: "/transactions" },
    { title: t('pendingOT'), value: stats.pendingOTDeliveries, icon: Truck, color: "bg-orange-500", shadow: "shadow-orange-500/20", path: "/transactions" },
    { title: t('pendingProf'), value: stats.pendingProfApprovals, icon: AlertTriangle, color: "bg-pink-500", shadow: "shadow-pink-500/20", path: "/transactions" },
    { title: t('hodActionReq'), value: stats.hodActionRequired, icon: AlertOctagon, color: "bg-red-500", shadow: "shadow-red-500/20", path: "/transactions" },
  ] : [];

  // Data for charts
  const topInstruments = [...instruments]
    .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
    .slice(0, 5)
    .map(i => ({ name: i.name.substring(0, 15) + (i.name.length > 15 ? '...' : ''), stock: i.current_stock || 0 }));

  const pacDistribution = [
    { name: "Fit", value: pacRecords.filter(r => r.fitness === 'Fit').length, color: '#10b981' },
    { name: "Conditional", value: pacRecords.filter(r => r.fitness === 'Conditional').length, color: '#f59e0b' },
    { name: "Unfit", value: pacRecords.filter(r => r.fitness === 'Unfit').length, color: '#ef4444' },
    { name: "Pending", value: pacRecords.filter(r => !r.fitness).length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const hodPieData = stats.hodRemarksDistribution.map((item, index) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
    return {
      name: item.remark,
      value: item.count,
      color: colors[index % colors.length]
    };
  });

  const recentTx = transactions.slice(0, 5);
  const recentPac = pacRecords.slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <header className="bg-slate-900 text-white p-6 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-emerald-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          <h1 className="text-lg md:text-2xl font-bold text-indigo-300 mb-1">
            {t('collegeName')}
          </h1>
          <h2 className="text-base md:text-xl font-medium text-slate-300 mb-6">
            {t('collegeNameMr')}
          </h2>
          
          <div className="w-16 h-1 bg-indigo-500 rounded-full mb-6"></div>
          
          <h3 className="text-2xl md:text-5xl font-black tracking-tight text-white mb-2">
            {t('deptName')}
          </h3>
          <p className="text-lg md:text-2xl font-bold text-indigo-400">
            {isStrictDoctor ? "Medical & Clinical Dashboard" : "Department Management Portal"}
          </p>
        </div>
      </header>

      {normalizedRole === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Account Pending Approval</h3>
          <p className="text-slate-600 max-w-lg mx-auto">
            Your account has been created successfully, but an administrator needs to assign your role before you can access the department's features. Please contact the admin.
          </p>
        </div>
      )}

      {/* OVERVIEW SECTION */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 px-2 flex items-center justify-between">
          <span>{t('overview')}</span>
          {showInventory && (
            <button 
              onClick={fetchInsights} 
              disabled={loadingInsights}
              className="text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              {loadingInsights ? "Loading AI Insights..." : "Generate AI Insights"}
            </button>
          )}
        </h3>
        
        {insights && showInventory && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white mb-6"
          >
            <h4 className="font-black text-lg mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Quick Insights (AI)
            </h4>
            <div className="whitespace-pre-line text-sm text-indigo-50 font-medium leading-relaxed">
              {insights}
            </div>
          </motion.div>
        )}

        {/* Clinical Statistics */}
        {showClinical && (
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
               <FileSignature className="w-3 h-3" /> Clinical Department Stats
             </h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {clinicalCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  onClick={() => card.path && navigate(card.path)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group ${card.path ? 'cursor-pointer' : ''}`}
                >
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
                  <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center shadow-lg ${card.shadow} z-10`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="z-10">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Statistics - HIDDEN for Doctors */}
        {showInventory && (
          <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
               <Package className="w-3 h-3" /> Inventory & Store Stats
             </h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {inventoryCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  onClick={() => card.path && navigate(card.path)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group ${card.path ? 'cursor-pointer' : ''}`}
                >
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
                  <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center shadow-lg ${card.shadow} z-10`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="z-10">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ACTION ITEMS SECTION - HIDDEN for Doctors */}
      {actionCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 px-2">{t('actionItems')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {actionCards.map((card, idx) => (
              <motion.div
                key={card.title}
                onClick={() => card.path && navigate(card.path)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group ${card.path ? 'cursor-pointer' : ''}`}
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
                <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center shadow-lg ${card.shadow} z-10`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <div className="z-10">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* DATA VISUALIZATION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {/* Fitness Chart (Clinical) */}
        {showClinical && (
          <motion.div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Fitness Distribution
            </h3>
            <div className="h-72">
              {pacDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pacDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {pacDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">No PAC distribution data</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Inventory Chart (Store) */}
        {showInventory && (
          <motion.div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Top Instruments Stock
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInstruments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="stock" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* PAC Table (Clinical) */}
        {showClinical && (
          <motion.div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6">{t('recentPACRecords' as any) || "Recent PAC Records"}</h3>
             <div className="space-y-3">
              {recentPac.length > 0 ? recentPac.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{r.patient_name}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">UHID: {r.uhid}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    r.fitness === 'Fit' ? 'bg-emerald-100 text-emerald-700' :
                    r.fitness === 'Unfit' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {r.fitness || "Pending"}
                  </span>
                </div>
              )) : (
                <div className="flex items-center justify-center py-12 text-slate-400 font-medium italic">No recent clinical records</div>
              )}
             </div>
          </motion.div>
        )}

        {/* Transaction Table (Inventory) */}
        {showInventory && recentTx.length > 0 && (
           <motion.div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mb-6">{t('recentTransactions')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('instrument')}</th>
                      <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">OT</th>
                      <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Prof</th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <span className="font-bold text-sm text-slate-900 block">{tx.instrument_name}</span>
                          <span className="text-[10px] text-slate-500">{tx.issue_date} • Qty: {tx.quantity}</span>
                        </td>
                        <td className="py-4 text-center">
                          {tx.is_delivered_to_ot ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                        </td>
                        <td className="py-4 text-center">
                          {tx.is_approved_by_professor ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}
