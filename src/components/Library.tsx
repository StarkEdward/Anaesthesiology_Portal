import React, { useState, useEffect, useRef } from "react";
import { Book as BookIcon, Search, Plus, Trash2, Edit2, X, Download, Loader2 } from "lucide-react";
import { Book } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, orderBy, writeBatch } from "firebase/firestore";
import Papa from "papaparse";

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Omit<Book, 'id'>>({
    title: "",
    author: "",
    publisher: "",
    subject: "",
    acc_no: "",
    edition: "",
    total_quantity: 1,
    available_quantity: 1,
    added_date: new Date().toISOString().split('T')[0],
    location: "",
    description: "",
  });

  useEffect(() => {
    const q = query(collection(db, "library"), orderBy("added_date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setBooks(data);
    }, (error) => {
      console.error("Error fetching books:", error);
      showToast("Error loading library data", "error");
    });
    return () => unsubscribe();
  }, [showToast]);

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.acc_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openNew = () => {
    setEditId(null);
    setFormData({
      title: "",
      author: "",
      publisher: "",
      subject: "",
      acc_no: "",
      edition: "",
      total_quantity: 1,
      available_quantity: 1,
      added_date: new Date().toISOString().split('T')[0],
      location: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditId(book.id);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      publisher: book.publisher || "",
      subject: book.subject || "",
      acc_no: book.acc_no || "",
      edition: book.edition || "",
      total_quantity: book.total_quantity || 1,
      available_quantity: book.available_quantity !== undefined ? book.available_quantity : (book.total_quantity || 1),
      added_date: book.added_date || new Date().toISOString().split('T')[0],
      location: book.location || "",
      description: book.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDoc(doc(db, "library", editId), {
          ...formData,
          total_quantity: Number(formData.total_quantity),
          available_quantity: Number(formData.available_quantity),
        });
        showToast("Book updated successfully", "success");
      } else {
        await addDoc(collection(db, "library"), {
          ...formData,
          total_quantity: Number(formData.total_quantity),
          available_quantity: Number(formData.available_quantity),
        });
        showToast("Book added successfully", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving book:", error);
      showToast("Error saving book", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await deleteDoc(doc(db, "library", id));
        showToast("Book deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting book:", error);
        showToast("Error deleting book", "error");
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let count = 0;
          let currentBatch = writeBatch(db);
          let batchCount = 0;

          for (const row of results.data as any[]) {
            const title = row['TITLE']?.trim() || row['Title']?.trim() || row['title']?.trim();
            if (!title) continue;
            
            const totalQtyRaw = row['TOTAL QTY'] || row['Total Qty'] || row['Quantity'] || "1";
            const totalQty = parseInt(totalQtyRaw) || 1;

            const newDocRef = doc(collection(db, "library"));
            currentBatch.set(newDocRef, {
              title: title,
              author: row['AUTHOR']?.trim() || row['Author']?.trim() || '',
              acc_no: row['ACC. No.']?.trim() || row['Acc No']?.trim() || row['ACC NO']?.trim() || '',
              subject: row['SUBJECT']?.trim() || row['Subject']?.trim() || '',
              edition: row['EDITION']?.trim() || row['Edition']?.trim() || '',
              publisher: row['PUB']?.trim() || row['Publisher']?.trim() || '',
              total_quantity: totalQty,
              available_quantity: totalQty,
              added_date: new Date().toISOString().split('T')[0],
              location: "",
              description: "",
            });
            
            count++;
            batchCount++;
            
            if (batchCount === 490) { 
               await currentBatch.commit();
               currentBatch = writeBatch(db);
               batchCount = 0;
            }
          }
          
          if (batchCount > 0) {
             await currentBatch.commit();
          }
          
          showToast(`Successfully imported ${count} books!`, "success");
        } catch (err) {
          console.error("Import error:", err);
          showToast("Failed to import some records", "error");
        } finally {
           setIsImporting(false);
           if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        showToast("Failed to parse CSV file", "error");
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <BookIcon className="w-5 h-5" />
            </div>
            {t('library')}
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage departmental books and resources.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button 
            onClick={openNew}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Book
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search books by title, author, subject or acc no..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border text-left border-slate-200 rounded-3xl p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <BookIcon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => openEdit(book)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(book.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-2">
                       {book.subject || 'Uncategorized'}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-3">{book.author || 'Unknown Author'}</p>
                    
                    <div className="space-y-2 mt-4 text-xs font-medium text-slate-600">
                      <div className="flex justify-between pb-2 border-b border-slate-50">
                        <span className="text-slate-400">Acc No:</span>
                        <span className="font-bold">{book.acc_no || '-'}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-50">
                        <span className="text-slate-400">Available:</span>
                        <span className={`font-bold ${book.available_quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {book.available_quantity} / {book.total_quantity}
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-50">
                        <span className="text-slate-400">Edition / Pub:</span>
                        <span>{book.edition || '-'} / {book.publisher || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span>{book.location || '-'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredBooks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex justify-center items-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium text-lg">No books found</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 md:p-6 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                  <BookIcon className="w-5 h-5 text-indigo-600" />
                  {editId ? 'Edit Book' : 'Add New Book'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Book Title*</label>
                      <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Author</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                        placeholder="e.g. Anatomy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Acc No.</label>
                      <input
                        type="text"
                        value={formData.acc_no}
                        onChange={(e) => setFormData({ ...formData, acc_no: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Edition</label>
                      <input
                        type="text"
                        value={formData.edition}
                        onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Publisher</label>
                      <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Location / Shelf</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Total Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formData.total_quantity}
                        onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Available Quantity</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max={formData.total_quantity}
                        value={formData.available_quantity}
                        onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3 rounded-b-3xl">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                  >
                    {editId ? 'Save Changes' : 'Add Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
