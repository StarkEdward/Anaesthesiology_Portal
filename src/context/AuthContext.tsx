import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'clerk' | 'pending';

export interface UserData {
  email: string;
  role: UserRole;
  name?: string;
  marathiName?: string;
  designation?: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole;
  userData: UserData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<UserRole>('pending');
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let currentRole: UserRole = 'pending';
          const isSuperAdminFallback = currentUser.email?.toLowerCase() === 'sagarit620@gmail.com';

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            currentRole = data.role as UserRole;
            // Upgrade legacy or if super admin is somehow not admin
            if (isSuperAdminFallback && currentRole !== 'admin') {
              currentRole = 'admin';
              data.role = 'admin';
              setDoc(userDocRef, { role: 'admin' }, { merge: true }).catch(console.error);
            }
            setUserData(data);
          } else {
            currentRole = isSuperAdminFallback ? 'admin' : 'pending';
            const newData: UserData = {
              email: currentUser.email || '',
              role: currentRole,
              created_at: new Date().toISOString()
            };
            setDoc(userDocRef, newData).catch(console.error);
            setUserData(newData);
          }

          setRole(currentRole);
          setIsAdmin(currentRole === 'admin');
        } catch (error) {
          console.error("Error fetching user role", error);
          // Fallback if firestore rules block us somehow (shouldn't happen for self)
          const fallbackAdmin = currentUser.email === 'sagarit620@gmail.com';
          setIsAdmin(fallbackAdmin);
          setRole(fallbackAdmin ? 'admin' : 'pending');
          setUserData(null);
        }
      } else {
        setIsAdmin(false);
        setRole('pending');
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, role, userData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
