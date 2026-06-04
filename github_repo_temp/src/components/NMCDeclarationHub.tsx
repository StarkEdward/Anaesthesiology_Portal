import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';

interface DeclarationRecord {
  id: string;
  facultyNameFirst: string;
  facultyNameMiddle: string;
  facultyNameLast: string;
  designation: string;
  department: string;
  createdAt: any;
  updatedAt: any;
}

export default function NMCDeclarationHub() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [records, setRecords] = useState<DeclarationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'nmc_declarations'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData: DeclarationRecord[] = [];
      snapshot.forEach((doc) => {
        recordsData.push({ id: doc.id, ...doc.data() } as DeclarationRecord);
      });
      setRecords(recordsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching declarations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'nmc_declarations', id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("Failed to delete record.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = records.filter(r => 
    `${r.facultyNameFirst} ${r.facultyNameLast}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NMC Declaration Forms</h1>
          <p className="text-gray-500 mt-1">Manage and fill out NMC Declaration Forms</p>
        </div>
        <button
          onClick={() => navigate('/declaration/new')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Fill New Form</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, designation, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredRecords.length} record(s) found
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              {searchTerm ? "No records match your search criteria." : "You haven't filled out any NMC Declaration forms yet."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/declaration/new')}
                className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>Create your first form</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600 font-medium">
                  <th className="py-4 px-6">Faculty Name</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/declaration/${record.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {record.facultyNameFirst?.[0] || 'D'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Dr. {record.facultyNameFirst} {record.facultyNameLast}
                          </div>
                          <div className="text-xs text-gray-500">ID: {record.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {record.designation || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {record.department || 'Anaesthesiology'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
                      {record.updatedAt ? format(record.updatedAt.toDate(), 'MMM d, yyyy h:mm a') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Open Form &rarr;
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(record.id); }}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Record</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Are you sure you want to delete this NMC Declaration Form? This action cannot be undone and the data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
