import React, { useState, useEffect } from "react";
import { ArrowUpRight, CheckCircle, Clock, Printer, User, Calendar, Plus, Trash2, AlertCircle, X, Pencil, Search } from "lucide-react";
import { Transaction, Instrument, Doctor } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, orderBy, runTransaction, getDoc } from "firebase/firestore";
import DatePickerInput from './ui/DatePickerInput';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    instrument_id: "",
    quantity: "",
    incharge_sister_name: "",
    incharge_sister_designation: "",
    professor_name: "",
    remark: "",
    issue_date: new Date().toISOString().split('T')[0],
    is_delivered_to_ot: false,
    is_approved_by_professor: false,
    hod_remark: "",
    ot_stock_book_no: "",
    ot_stock_book_page_no: "",
  });
  const [updateData, setUpdateData] = useState({
    professor_name: "",
    acceptance_date: new Date().toISOString().split('T')[0],
    is_delivered_to_ot: false,
    is_approved_by_professor: false,
    hod_remark: "",
  });

  useEffect(() => {
    const qTx = query(collection(db, "transactions"), orderBy("issue_date", "desc"));
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTransactions(txList);
    });

    const qInst = query(collection(db, "instruments"), orderBy("name"));
    const unsubscribeInst = onSnapshot(qInst, (snapshot) => {
      const instList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setInstruments(instList);
    });

    const qDoc = query(collection(db, "doctors"), orderBy("first_name"));
    const unsubscribeDoc = onSnapshot(qDoc, (snapshot) => {
      const docList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setDoctors(docList);
    });

    return () => {
      unsubscribeTx();
      unsubscribeInst();
      unsubscribeDoc();
    };
  }, []);

  const openIssue = () => {
    setEditId(null);
    setFormData({
      instrument_id: "",
      quantity: "",
      incharge_sister_name: "",
      incharge_sister_designation: "",
      professor_name: "",
      remark: "",
      issue_date: new Date().toISOString().split('T')[0],
      is_delivered_to_ot: false,
      is_approved_by_professor: false,
      hod_remark: "",
      ot_stock_book_no: "",
      ot_stock_book_page_no: "",
    });
    setIsIssueOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditId(tx.id.toString());
    setFormData({
      instrument_id: tx.instrument_id.toString(),
      quantity: tx.quantity.toString(),
      incharge_sister_name: tx.incharge_sister_name || "",
      incharge_sister_designation: tx.incharge_sister_designation || "",
      professor_name: tx.professor_name || "",
      remark: tx.remark || "",
      issue_date: tx.issue_date || new Date().toISOString().split('T')[0],
      is_delivered_to_ot: !!tx.is_delivered_to_ot,
      is_approved_by_professor: !!tx.is_approved_by_professor,
      hod_remark: tx.hod_remark || "",
      ot_stock_book_no: tx.ot_stock_book_no || "",
      ot_stock_book_page_no: tx.ot_stock_book_page_no || "",
    });
    setIsIssueOpen(true);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const instId = formData.instrument_id;
      const qty = parseInt(formData.quantity) || 0;
      const instRef = doc(db, "instruments", instId);
      const instSnap = await getDoc(instRef);
      
      if (!instSnap.exists()) throw new Error("Instrument not found");
      const instData = instSnap.data() as Instrument;
      
      const txData = {
        instrument_id: instId,
        instrument_name: instData.name,
        quantity: qty,
        incharge_sister_name: formData.incharge_sister_name,
        incharge_sister_designation: formData.incharge_sister_designation,
        professor_name: formData.professor_name,
        remark: formData.remark,
        issue_date: formData.issue_date,
        is_delivered_to_ot: formData.is_delivered_to_ot,
        is_approved_by_professor: formData.is_approved_by_professor,
        hod_remark: formData.hod_remark,
        ot_stock_book_no: formData.ot_stock_book_no,
        ot_stock_book_page_no: formData.ot_stock_book_page_no,
        status: "Pending",
        stock_book_page_no: instData.stock_book_page_no || "",
      };

      await runTransaction(db, async (transaction) => {
        const freshInstSnap = await transaction.get(instRef);
        const freshInstData = freshInstSnap.data() as Instrument;
        
        if (editId) {
          const oldTxRef = doc(db, "transactions", editId);
          const oldTxSnap = await transaction.get(oldTxRef);
          const oldTxData = oldTxSnap.data() as Transaction;
          
          const diff = qty - oldTxData.quantity;
          if (freshInstData.current_stock < diff) throw new Error("Insufficient stock");
          
          transaction.update(instRef, {
            current_stock: freshInstData.current_stock - diff,
            total_issued: (freshInstData.total_issued || 0) + diff
          });
          transaction.update(oldTxRef, txData);
        } else {
          if (freshInstData.current_stock < qty) throw new Error("Insufficient stock");
          
          transaction.update(instRef, {
            current_stock: freshInstData.current_stock - qty,
            total_issued: (freshInstData.total_issued || 0) + qty
          });
          const newTxRef = doc(collection(db, "transactions"));
          transaction.set(newTxRef, txData);
        }
      });

      setIsIssueOpen(false);
      setEditId(null);
      showToast(editId ? t('updateSuccess') || "Transaction updated" : t('saveSuccess') || "Transaction saved", 'success');
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      const txRef = doc(db, "transactions", selectedTx.id.toString());
      await updateDoc(txRef, {
        professor_name: updateData.professor_name,
        acceptance_date: updateData.acceptance_date,
        is_delivered_to_ot: updateData.is_delivered_to_ot,
        is_approved_by_professor: updateData.is_approved_by_professor,
        hod_remark: updateData.hod_remark,
        status: "Completed"
      });

      setIsUpdateOpen(false);
      setSelectedTx(null);
      showToast(t('updateSuccess') || "Transaction updated", 'success');
    } catch (error: any) {
      console.error("Update error:", error);
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    try {
      const instRef = doc(db, "instruments", deleteTx.instrument_id.toString());
      
      await runTransaction(db, async (transaction) => {
        const instSnap = await transaction.get(instRef);
        if (instSnap.exists()) {
          const instData = instSnap.data() as Instrument;
          transaction.update(instRef, {
            current_stock: instData.current_stock + deleteTx.quantity,
            total_issued: (instData.total_issued || 0) - deleteTx.quantity
          });
        }
        transaction.delete(doc(db, "transactions", deleteTx.id.toString()));
      });

      setDeleteTx(null);
      showToast(t('deleteSuccess') || "Transaction deleted", 'success');
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast(error.message, 'error');
    }
  };

  const printSlip = (tx: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('issueSlip')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .details-table th, .details-table td { border: 1px solid #ccc; padding: 12px; text-align: left; }
            .details-table th { background-color: #f9f9f9; width: 40%; }
            .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
            .sig-box { text-align: center; border-top: 1px solid #000; width: 200px; padding-top: 10px; font-weight: bold; }
            h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
            h2 { margin: 5px 0 0 0; font-size: 18px; color: #555; }
            h3 { margin: 15px 0 0 0; font-size: 20px; text-decoration: underline; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t('collegeName')}</h1>
            <h2>${t('collegeNameMr')}</h2>
            <h2>${t('deptName')}</h2>
            <h3>${t('issueSlip')}</h3>
          </div>
          <div class="meta">
            <div>${t('receiptNo')}: ${tx.id}</div>
            <div>${t('date')}: ${tx.issue_date}</div>
          </div>
          <table class="details-table">
            <tr><th>${t('instrumentName')}</th><td><b>${tx.instrument_name}</b></td></tr>
            <tr><th>${t('qty')}</th><td><b>${tx.quantity}</b></td></tr>
            <tr><th>${t('stockBookPage')}</th><td>${tx.stock_book_page_no || '---'}</td></tr>
            <tr><th>${t('inchargeSister')}</th><td>${tx.incharge_sister_name || '---'}</td></tr>
            <tr><th>${t('designation')}</th><td>${tx.incharge_sister_designation || '---'}</td></tr>
            <tr><th>${t('professorName')}</th><td>${tx.professor_name || '---'}</td></tr>
            <tr><th>${t('isDeliveredToOT')}</th><td>${tx.is_delivered_to_ot ? 'Yes' : 'No'}</td></tr>
            <tr><th>${t('isApprovedByProf')}</th><td>${tx.is_approved_by_professor ? 'Yes' : 'No'}</td></tr>
            <tr><th>${t('hodRemark')}</th><td>${tx.hod_remark || '---'}</td></tr>
            <tr><th>${t('remark')}</th><td>${tx.remark || '---'}</td></tr>
          </table>
          <div class="signatures">
            <div class="sig-box">${t('inchargeSign')}</div>
            <div class="sig-box">${t('profSign')}</div>
            <div class="sig-box">${t('storeKeeperSign')}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const maxAllowedQuantity = (() => {
    if (!formData.instrument_id) return undefined;
    const currentInst = instruments.find(i => i.id.toString() === formData.instrument_id);
    let maxQty = currentInst?.current_stock || 0;
    if (editId) {
      const originalTx = transactions.find(t => t.id === editId);
      if (originalTx && originalTx.instrument_id.toString() === formData.instrument_id) {
        maxQty += originalTx.quantity;
      }
    }
    return maxQty;
  })();

  const filteredTransactions = transactions.filter(tx => 
    tx.instrument_name.toLowerCase().includes(search.toLowerCase()) ||
    (tx.professor_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (tx.incharge_sister_name || "").toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toString().includes(search)
  );

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('transactionsTitle')}</h2>
          <p className="text-slate-500 font-medium mt-1">{t('transactionsDesc')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchTransactions') || "Search transactions..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
            />
          </div>
          <button
            onClick={openIssue}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-5 h-5" />
            {t('issueInstrument')}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('instrument')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('qty')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('inchargeSister')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('designation')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('professorName')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5 text-sm font-medium text-slate-600">{tx.issue_date}</td>
                  <td className="px-6 py-5 font-bold text-slate-900">
                    <button
                      onClick={() => setViewTx(tx)}
                      className="hover:text-indigo-600 hover:underline text-left"
                    >
                      {tx.instrument_name}
                    </button>
                  </td>
                  <td className="px-6 py-5 font-bold text-indigo-600">{tx.quantity}</td>
                  <td className="px-6 py-5 text-slate-600">{tx.incharge_sister_name || "---"}</td>
                  <td className="px-6 py-5 text-slate-600">{tx.incharge_sister_designation || "---"}</td>
                  <td className="px-6 py-5 text-slate-600">{tx.professor_name || "---"}</td>
                  <td className="px-6 py-5 text-center">
                    {tx.status === "Pending" ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full inline-flex items-center gap-1 justify-center">
                        <Clock className="w-3 h-3" /> {t('pending')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full inline-flex items-center gap-1 justify-center">
                        <CheckCircle className="w-3 h-3" /> {t('completed')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {tx.status === "Pending" && (
                        <button
                          onClick={() => { 
                            setSelectedTx(tx); 
                            setUpdateData({
                              professor_name: tx.professor_name || "",
                              acceptance_date: tx.acceptance_date || new Date().toISOString().split('T')[0],
                              is_delivered_to_ot: !!tx.is_delivered_to_ot,
                              is_approved_by_professor: !!tx.is_approved_by_professor,
                              hod_remark: tx.hod_remark || "",
                            });
                            setIsUpdateOpen(true); 
                          }}
                          className="p-2 hover:bg-amber-50 text-amber-600 rounded-xl transition-all"
                          title={t('update')}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(tx)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                        title={t('edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printSlip(tx)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                        title={t('printSlip')}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTx(tx)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      <AnimatePresence>
        {isIssueOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
              <div className="p-5 md:p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg md:text-xl font-black text-slate-900">{editId ? t('editTransaction') : t('newIssue')}</h3>
                <button type="button" onClick={() => setIsIssueOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleIssue} className="flex flex-col overflow-hidden">
                <div className="p-5 md:p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('selectInstrument')}</label>
                    <select
                      required
                      value={formData.instrument_id}
                      onChange={(e) => setFormData({ ...formData, instrument_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t('select')}</option>
                      {instruments.map(i => {
                            const isCurrentEditInstrument = editId && transactions.find(t => t.id.toString() === editId)?.instrument_id === i.id;
                            const availableStock = i.current_stock + (isCurrentEditInstrument ? (transactions.find(t => t.id.toString() === editId)?.quantity || 0) : 0);
                        return (
                          <option key={i.id} value={i.id} disabled={availableStock <= 0}>
                            {i.name} ({t('stock')}: {availableStock})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('date')}</label>
                      <DatePickerInput
                        required={true}
                        value={formData.issue_date}
                        onChange={(date) => setFormData({ ...formData, issue_date: date })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('qty')}</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max={maxAllowedQuantity}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('inchargeSister')}</label>
                      <input
                        required
                        type="text"
                        value={formData.incharge_sister_name}
                        onChange={(e) => setFormData({ ...formData, incharge_sister_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('designation')}</label>
                      <input
                        type="text"
                        value={formData.incharge_sister_designation}
                        onChange={(e) => setFormData({ ...formData, incharge_sister_designation: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500">{t('professorName')}</label>
                      <select
                        value={formData.professor_name}
                        onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
                      >
                        <option value="">{t('select')}</option>
                        {doctors.map(doc => {
                          const fullName = `${doc.title} ${doc.first_name} ${doc.last_name} - ${doc.designation}`;
                          return (
                            <option key={doc.id} value={fullName}>
                              {fullName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500">{t('remark')}</label>
                      <input
                        type="text"
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('otStockBookNo')}</label>
                      <input
                        type="text"
                        value={formData.ot_stock_book_no}
                        onChange={(e) => setFormData({ ...formData, ot_stock_book_no: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">{t('otStockBookPageNo')}</label>
                      <input
                        type="text"
                        value={formData.ot_stock_book_page_no}
                        onChange={(e) => setFormData({ ...formData, ot_stock_book_page_no: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <input
                      type="checkbox"
                      id="issue_is_delivered_to_ot"
                      checked={formData.is_delivered_to_ot}
                      onChange={(e) => setFormData({ ...formData, is_delivered_to_ot: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="issue_is_delivered_to_ot" className="text-sm font-bold text-slate-700 cursor-pointer">
                      {t('isDeliveredToOT')}
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <input
                      type="checkbox"
                      id="issue_is_approved_by_professor"
                      checked={formData.is_approved_by_professor}
                      onChange={(e) => setFormData({ ...formData, is_approved_by_professor: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="issue_is_approved_by_professor" className="text-sm font-bold text-slate-700 cursor-pointer">
                      {t('isApprovedByProf')}
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('hodRemark')}</label>
                    <select
                      value={formData.hod_remark}
                      onChange={(e) => setFormData({ ...formData, hod_remark: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t('hodRemarkSelect')}</option>
                      <option value="Approved">{t('hodApproved')}</option>
                      <option value="Pending Review">{t('hodPending')}</option>
                      <option value="Needs Clarification">{t('hodClarification')}</option>
                      <option value="Rejected">{t('hodRejected')}</option>
                    </select>
                  </div>
                </div>
                <div className="p-5 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-slate-50">
                  <button type="button" onClick={() => setIsIssueOpen(false)} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all">{t('cancel')}</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">{editId ? t('edit') : t('issue')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Modal */}
      <AnimatePresence>
        {isUpdateOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
              <div className="p-5 md:p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg md:text-xl font-black text-slate-900">{t('profAcceptanceUpdate')}</h3>
                <button type="button" onClick={() => setIsUpdateOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="flex flex-col overflow-hidden">
                <div className="p-5 md:p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('professorName')}</label>
                    <select
                      required
                      value={updateData.professor_name}
                      onChange={(e) => setUpdateData({ ...updateData, professor_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t('select')}</option>
                      {doctors.map(doc => {
                        const fullName = `${doc.title} ${doc.first_name} ${doc.last_name} - ${doc.designation}`;
                        return (
                          <option key={doc.id} value={fullName}>
                            {fullName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('acceptanceDate')}</label>
                    <DatePickerInput
                      required={true}
                      value={updateData.acceptance_date}
                      onChange={(date) => setUpdateData({ ...updateData, acceptance_date: date })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <input
                      type="checkbox"
                      id="is_delivered_to_ot"
                      checked={updateData.is_delivered_to_ot}
                      onChange={(e) => setUpdateData({ ...updateData, is_delivered_to_ot: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_delivered_to_ot" className="text-sm font-bold text-slate-700 cursor-pointer">
                      {t('isDeliveredToOT')}
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <input
                      type="checkbox"
                      id="is_approved_by_professor"
                      checked={updateData.is_approved_by_professor}
                      onChange={(e) => setUpdateData({ ...updateData, is_approved_by_professor: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_approved_by_professor" className="text-sm font-bold text-slate-700 cursor-pointer">
                      {t('isApprovedByProf')}
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('hodRemark')}</label>
                    <select
                      value={updateData.hod_remark}
                      onChange={(e) => setUpdateData({ ...updateData, hod_remark: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t('hodRemarkSelect')}</option>
                      <option value="Approved">{t('hodApproved')}</option>
                      <option value="Pending Review">{t('hodPending')}</option>
                      <option value="Needs Clarification">{t('hodClarification')}</option>
                      <option value="Rejected">{t('hodRejected')}</option>
                    </select>
                  </div>
                </div>
                <div className="p-5 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-slate-50">
                  <button type="button" onClick={() => setIsUpdateOpen(false)} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all">{t('cancel')}</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">{t('update')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTx && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{t('confirm')}</h3>
                <p className="text-slate-500 font-medium">
                  {t('deleteConfirmTx')}
                </p>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-100 flex gap-3 bg-slate-50">
                <button
                  onClick={() => setDeleteTx(null)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Transaction Modal */}
      <AnimatePresence>
        {viewTx && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
              <div className="p-5 md:p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg md:text-xl font-black text-slate-900">{t('transactionHistory')}</h3>
                <button type="button" onClick={() => setViewTx(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5 md:p-6 space-y-6 overflow-y-auto">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('instrumentName')}</p>
                  <p className="text-xl font-black text-slate-900">{viewTx.instrument_name}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('date')}</p>
                    <p className="text-lg font-bold text-slate-700">{viewTx.issue_date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('qty')}</p>
                    <p className="text-lg font-bold text-indigo-600">{viewTx.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('status')}</p>
                    <p className="text-lg font-bold">
                      <span className={`px-3 py-1 rounded-md text-sm ${viewTx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t(viewTx.status.toLowerCase() as any)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('acceptanceDate')}</p>
                    <p className="text-lg font-bold text-slate-700">{viewTx.acceptance_date || "-"}</p>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('inchargeSister')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('name')}</p>
                        <p className="font-medium text-slate-800">{viewTx.incharge_sister_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('designation')}</p>
                        <p className="font-medium text-slate-800">{viewTx.incharge_sister_designation || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('professorName')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('name')}</p>
                        <p className="font-medium text-slate-800">{viewTx.professor_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('isApprovedByProf')}</p>
                        <p className="font-medium text-slate-800">{viewTx.is_approved_by_professor ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">OT Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('isDeliveredToOT')}</p>
                        <p className="font-medium text-slate-800">{viewTx.is_delivered_to_ot ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('otStockBookNo')}</p>
                        <p className="font-medium text-slate-800">{viewTx.ot_stock_book_no || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{t('otStockBookPageNo')}</p>
                        <p className="font-medium text-slate-800">{viewTx.ot_stock_book_page_no || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('remark')}</p>
                    <p className="text-lg font-medium text-slate-700">{viewTx.remark || "-"}</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hodRemark')}</p>
                    <p className="text-lg font-medium text-slate-700">{viewTx.hod_remark || "-"}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 md:p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50">
                <button
                  onClick={() => setViewTx(null)}
                  className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
