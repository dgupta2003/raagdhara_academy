'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { User as FirestoreUser, Student, Guardian, UserRole } from '@/lib/firebase/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userRole: UserRole | null;
  studentProfile: Student | null;
  guardianProfile: Guardian | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserRole>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

async function fetchUserData(uid: string): Promise<{ role: UserRole | null; studentId?: string; guardianId?: string }> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return { role: null };
  const data = userDoc.data() as FirestoreUser;
  return { role: data.role, studentId: data.studentId, guardianId: data.guardianId };
}

async function fetchStudentProfile(studentId: string): Promise<Student | null> {
  const studentDoc = await getDoc(doc(db, 'students', studentId));
  if (!studentDoc.exists()) return null;
  return studentDoc.data() as Student;
}

async function fetchGuardianProfile(guardianId: string): Promise<Guardian | null> {
  const guardianDoc = await getDoc(doc(db, 'guardians', guardianId));
  if (!guardianDoc.exists()) return null;
  return guardianDoc.data() as Guardian;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [guardianProfile, setGuardianProfile] = useState<Guardian | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const { role, studentId, guardianId } = await fetchUserData(firebaseUser.uid);
          setUserRole(role);

          if (role === 'student') {
            // studentId may differ from auth UID for admin-invited students
            const resolvedId = studentId ?? firebaseUser.uid;
            const profile = await fetchStudentProfile(resolvedId);
            setStudentProfile(profile);
            setGuardianProfile(null);
          } else if (role === 'parent' && guardianId) {
            const profile = await fetchGuardianProfile(guardianId);
            setGuardianProfile(profile);
            setStudentProfile(null);
          } else {
            setStudentProfile(null);
            setGuardianProfile(null);
          }
        } else {
          setUser(null);
          setUserRole(null);
          setStudentProfile(null);
          setGuardianProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserRole> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    const sessionRes = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    });
    if (!sessionRes.ok) {
      throw new Error('Failed to create session. Please try again.');
    }

    // Fetch role directly so LoginForm can redirect immediately,
    // without waiting for onAuthStateChanged to propagate.
    const { role } = await fetchUserData(credential.user.uid);
    if (!role) throw new Error('User account not configured. Please contact support.');
    return role;
  };

  const signOut = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, studentProfile, guardianProfile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
