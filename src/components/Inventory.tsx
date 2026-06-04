import React, { useState, useEffect } from "react";
import { Plus, Package, Trash2, Search, AlertCircle, Edit2, Eye, X } from "lucide-react";
import { Instrument, Transaction } from "../types";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, getDocs, where, orderBy } from "firebase/firestore";
import DatePickerInput from './ui/DatePickerInput';

export default function Inventory() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewItem, setViewItem] = useState<Instrument | null>(null);
  const [itemTransactions, setItemTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteItem, setDeleteItem] = useState<Instrument | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    company: "",
    price: "",
    current_stock: "",
    invoice_no: "",
    invoice_date: "",
    po_no: "",
    po_date: "",
    stock_book_page_no: "",
  });

  useEffect(() => {
    const q = query(collection(db, "instruments"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const instList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setInstruments(instList);
    }, (error) => {
      console.error("Firestore error:", error);
      showToast("Failed to fetch instruments", "error");
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setFormData({ id: "", name: "", company: "", price: "", current_stock: "", invoice_no: "", invoice_date: "", po_no: "", po_date: "", stock_book_page_no: "" });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: Instrument) => {
    setIsEditMode(true);
    setFormData({
      id: item.id.toString(),
      name: item.name,
      company: item.company,
      price: item.price.toString(),
      current_stock: item.current_stock.toString(),
      invoice_no: item.invoice_no || "",
      invoice_date: item.invoice_date || "",
      po_no: item.po_no || "",
      po_date: item.po_date || "",
      stock_book_page_no: item.stock_book_page_no || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      company: formData.company,
      price: parseFloat(formData.price) || 0,
      current_stock: parseInt(formData.current_stock) || 0,
      invoice_no: formData.invoice_no,
      invoice_date: formData.invoice_date,
      po_no: formData.po_no,
      po_date: formData.po_date,
      stock_book_page_no: formData.stock_book_page_no,
      total_issued: isEditMode ? (instruments.find(i => i.id.toString() === formData.id)?.total_issued || 0) : 0,
    };

    try {
      if (isEditMode) {
        await updateDoc(doc(db, "instruments", formData.id), data);
        showToast(t('updateSuccess') || "Instrument updated", 'success');
      } else {
        await addDoc(collection(db, "instruments"), { ...data, total_issued: 0 });
        showToast(t('saveSuccess') || "Instrument saved", 'success');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteDoc(doc(db, "instruments", deleteItem.id.toString()));
      setDeleteItem(null);
      showToast(t('deleteSuccess') || "Instrument deleted", 'success');
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast(error.message, 'error');
    }
  };

  const fetchItemTransactions = async (itemId: string) => {
    try {
      const q = query(collection(db, "transactions"), where("instrument_id", "==", itemId), orderBy("issue_date", "desc"));
      const snapshot = await getDocs(q);
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setItemTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const filtered = instruments.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('inventoryTitle')}</h2>
          <p className="text-slate-500 font-medium mt-1">{t('inventoryDesc')}</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          {t('newInstrument')}
        </button>
      </header>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('name')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('company')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('invoicePo')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('total')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('issued')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('remaining')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('unitPrice')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('totalPrice')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900">
                    <button
                      onClick={() => {
                        setViewItem(item);
                        fetchItemTransactions(item.id.toString());
                      }}
                      className="hover:text-indigo-600 hover:underline text-left"
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-slate-500">{item.company}</td>
                  <td className="px-6 py-5">
                    {item.invoice_no && <div className="text-sm text-slate-900 font-medium">Inv: {item.invoice_no} {item.invoice_date && <span className="text-xs text-slate-400 font-normal">({item.invoice_date})</span>}</div>}
                    {item.po_no && <div className="text-sm text-slate-500">PO: {item.po_no} {item.po_date && <span className="text-xs text-slate-400 font-normal">({item.po_date})</span>}</div>}
                    {!item.invoice_no && !item.po_no && <span className="text-slate-300 text-sm">-</span>}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-400">
                    {(item.current_stock || 0) + (item.total_issued || 0)}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-indigo-600">
                    {item.total_issued || 0}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-emerald-600">
                    {item.current_stock || 0}
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-slate-600">₹{(item.price || 0).toLocaleString()}</td>
                  <td className="px-6 py-5 text-right font-black text-indigo-600">
                    ₹{(((item.current_stock || 0) + (item.total_issued || 0)) * (item.price || 0)).toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => {
                        setViewItem(item);
                        fetchItemTransactions(item.id.toString());
                      }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenEditForm(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteItem(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-slate-900">{isEditMode ? t('editInstrument') : t('newInstrumentReg')}</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-5 md:p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500">{t('instrumentName')}</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500">{t('company')}</label>
                    <input
                      required
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('unitPrice')} (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{isEditMode ? t('remaining') : t('total')}</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('invoiceNo')}</label>
                    <input
                      type="text"
                      value={formData.invoice_no}
                      onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('invoiceDate')}</label>
                    <DatePickerInput
                      value={formData.invoice_date}
                      onChange={(date) => setFormData({ ...formData, invoice_date: date })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('poNo')}</label>
                    <input
                      type="text"
                      value={formData.po_no}
                      onChange={(e) => setFormData({ ...formData, po_no: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{t('poDate')}</label>
                    <DatePickerInput
                      value={formData.po_date}
                      onChange={(date) => setFormData({ ...formData, po_date: date })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500">{t('stockBookPage')}</label>
                    <input
                      type="text"
                      value={formData.stock_book_page_no}
                      onChange={(e) => setFormData({ ...formData, stock_book_page_no: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
          >
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-lg md:text-xl font-black text-slate-900">
                {selectedTransaction ? t('transactionHistory') : t('instrumentDetails')}
              </h3>
              <button onClick={() => {
                if (selectedTransaction) {
                  setSelectedTransaction(null);
                } else {
                  setViewItem(null);
                }
              }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 md:p-6 space-y-6 overflow-y-auto">
              {selectedTransaction ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('instrumentName')}</p>
                    <p className="text-xl font-black text-slate-900">{viewItem.name}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('date')}</p>
                      <p className="text-lg font-bold text-slate-700">{selectedTransaction.issue_date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('qty')}</p>
                      <p className="text-lg font-bold text-indigo-600">{selectedTransaction.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('status')}</p>
                      <p className="text-lg font-bold">
                        <span className={`px-3 py-1 rounded-md text-sm ${selectedTransaction.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t(selectedTransaction.status.toLowerCase() as any)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('acceptanceDate')}</p>
                      <p className="text-lg font-bold text-slate-700">{selectedTransaction.acceptance_date || "-"}</p>
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('inchargeSister')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('name')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.incharge_sister_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('designation')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.incharge_sister_designation || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('professorName')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('name')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.professor_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('isApprovedByProf')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.is_approved_by_professor ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">OT Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('isDeliveredToOT')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.is_delivered_to_ot ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('otStockBookNo')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.ot_stock_book_no || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('otStockBookPageNo')}</p>
                          <p className="font-medium text-slate-800">{selectedTransaction.ot_stock_book_page_no || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('remark')}</p>
                      <p className="text-lg font-medium text-slate-700">{selectedTransaction.remark || "-"}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hodRemark')}</p>
                      <p className="text-lg font-medium text-slate-700">{selectedTransaction.hod_remark || "-"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('name')}</p>
                    <p className="text-xl font-black text-slate-900">{viewItem.name}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('company')}</p>
                      <p className="text-lg font-bold text-slate-700">{viewItem.company}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('unitPrice')}</p>
                      <p className="text-lg font-bold text-indigo-600">₹{viewItem.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('total')}</p>
                      <p className="text-lg font-bold text-slate-700">{(viewItem.current_stock || 0) + (viewItem.total_issued || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{t('remaining')}</p>
                      <p className="text-lg font-bold text-emerald-600">{viewItem.current_stock}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('purchaseDetails')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('invoiceNo')}</p>
                          <p className="font-medium text-slate-800">{viewItem.invoice_no || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('invoiceDate')}</p>
                          <p className="font-medium text-slate-800">{viewItem.invoice_date || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('poNo')}</p>
                          <p className="font-medium text-slate-800">{viewItem.po_no || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('poDate')}</p>
                          <p className="font-medium text-slate-800">{viewItem.po_date || "-"}</p>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <p className="text-xs font-bold text-slate-400 mb-1">{t('stockBookPage')}</p>
                          <p className="font-medium text-slate-800">{viewItem.stock_book_page_no || "-"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2 mt-4">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('transactionHistory')}</p>
                      {itemTransactions.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">{t('noTransactions')}</p>
                      ) : (
                        <div className="space-y-3">
                          {itemTransactions.map((tx) => (
                            <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{t('date')}: {tx.issue_date}</p>
                                <p className="text-sm text-slate-600">{t('inchargeSister')}: {tx.incharge_sister_name || "-"}</p>
                                <p className="text-sm text-slate-600">{t('professorName')}: {tx.professor_name || "-"}</p>
                              </div>
                              <div className="text-left sm:text-right flex flex-col justify-between items-start sm:items-end">
                                <div>
                                  <p className="text-sm font-bold text-indigo-600">{t('qty')}: {tx.quantity}</p>
                                  <p className="text-sm font-medium mt-1">
                                    <span className={`px-2 py-1 rounded-md text-xs ${tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {t(tx.status.toLowerCase() as any)}
                                    </span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => setSelectedTransaction(tx)}
                                  className="mt-3 sm:mt-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                                >
                                  {t('viewDetails')}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              {selectedTransaction ? (
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
                >
                  {t('back')}
                </button>
              ) : (
                <button
                  onClick={() => setViewItem(null)}
                  className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
                >
                  {t('close')}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{t('confirm')}</h3>
              <p className="text-slate-500 font-medium">
                {t('deleteConfirmInst')} <b>{deleteItem.name}</b>
              </p>
            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button
                onClick={() => setDeleteItem(null)}
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
    </div>
  );
}
