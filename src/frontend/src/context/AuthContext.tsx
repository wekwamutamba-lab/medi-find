import { createContext, useContext, useState, type ReactNode } from 'react';
import { getProfile, readSession, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp, startDemoSession, writeSession, type Profile as ApiProfile } from '../api';

export type UserRole = 'pharmacist' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
}

export interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  startDemo: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, mode: 'demo' | 'production', pharmacyName?: string, licenseNumber?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

function toProfile(p: ApiProfile | null, email: string): UserProfile | null {
  if (!p) return null;
  return {
    id: p.id,
    full_name: p.full_name,
    role: (p.role as UserRole) || 'pharmacist',
    email,
    pharmacy_id: p.pharmacy_id ?? undefined,
    pharmacy_name: p.pharmacy_name ?? undefined,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSession = readSession();
  const [user, setUser] = useState<AuthContextType['user']>(initialSession ? { id: 'session', email: '' } : null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async (email: string) => {
    const p = await getProfile();
    setProfile(toProfile(p, email));
    if (p) setUser({ id: p.id, email });
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await apiSignIn(email, password);
      await loadProfile(email);
    } finally {
      setLoading(false);
    }
  };

  const startDemo = async () => {
    startDemoSession();
    setUser({ id: 'demo-user', email: 'demo@pharmacy.local' });
    setProfile({
      id: 'demo-user',
      full_name: 'Demo Pharmacist',
      role: 'admin',
      email: 'demo@pharmacy.local',
      pharmacy_name: 'Demo Pharmacy',
    });
  };

  const signUp = async (email: string, password: string, fullName: string, mode: 'demo' | 'production', pharmacyName?: string, licenseNumber?: string) => {
    if (mode === 'demo') {
      await startDemo();
      return true;
    }
    setLoading(true);
    try {
      const ok = await apiSignUp(fullName, email, password);
      if (ok) {
        try { await loadProfile(email); } catch { /* verify email flow */ }
      }
      return ok;
    } finally {
      setLoading(false);
    }
  };

  const signOutFn = async () => {
    apiSignOut();
    writeSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, startDemo, signUp, signOut: signOutFn }}>
      {children}
    </AuthContext.Provider>
  );
};

