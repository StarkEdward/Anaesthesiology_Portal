import React, { useState, useEffect } from "react";
import { UserRole } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, query } from "firebase/firestore";
import { ShieldAlert, Shield, ShieldCheck, User } from "lucide-react";
import { useToast } from "../context/ToastContext";

interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRecord[];
      setUsers(records);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      showToast(`Role updated to ${newRole}`, "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="text-red-500 w-5 h-5" />;
      case 'doctor': return <ShieldCheck className="text-blue-500 w-5 h-5" />;
      case 'nurse': return <Shield className="text-green-500 w-5 h-5" />;
      default: return <User className="text-slate-400 w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage roles and permissions for all users.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-5">User Email</th>
                <th className="p-5">Joined at</th>
                <th className="p-5">Current Role</th>
                <th className="p-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-sm text-slate-800">{u.email}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-medium text-slate-500">
                      {new Date(u.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-5 flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <span className="font-bold text-sm text-slate-700 capitalize">{u.role}</span>
                  </td>
                  <td className="p-5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="clerk">Clerk</option>
                      <option value="pending">Pending</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
