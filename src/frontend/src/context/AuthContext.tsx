import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authConfigured, getProfile, onboardPharmacy, readSession, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp, startDemoSession, type Profile } from '../api';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const session = readSession();
    if (!session) {
      setUser(null);
      setProfile(null);
      return;
    }

    if (session.access_token === 'demo-token') {
      setUser({ id: 'demo-user', email: 'demo@pharmacy.local' });
      setProfile({ id: 'demo-user', full_name: 'Demo Pharmacist', role: 'admin', email: 'demo@pharmacy.local', pharmacy_name: 'Demo Pharmacy' });
      return;
    }

    try {
      const data: Profile | null = await getProfile();
      if (!data) {
        apiSignOut();
        setUser(null);
        setProfile(null);
        return;
      }
      const nextProfile = {
        id: data.id,
        full_name: data.full_name,
        role: data.role as UserRole,
        email: '',
        pharmacy_id: data.pharmacy_id,
        pharmacy_name: data.pharmacy_name,
      };
      setProfile(nextProfile);
      setUser({ id: data.id, email: '' });
    } catch {
      apiSignOut();
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    void loadProfile().finally(() => {
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!authConfigured) throw new Error('Production sign-in requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Choose the demo sandbox instead.');
    await apiSignIn(email, password);
    const pending = localStorage.getItem('medifind.pending-pharmacy');
    if (pending) {
      await onboardPharmacy(JSON.parse(pending));
      localStorage.removeItem('medifind.pending-pharmacy');
    }
    await loadProfile();
  };

  const startDemo = async () => {
    startDemoSession();
    await loadProfile();
  };

  const signUp = async (email: string, password: string, fullName: string, mode: 'demo' | 'production', pharmacyName = '', licenseNumber = '') => {
    if (mode === 'demo') {
      startDemoSession();
      await loadProfile();
      return true;
    }
    if (!authConfigured) throw new Error('Production setup requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    const pending = { full_name: fullName, pharmacy_name: pharmacyName, license_number: licenseNumber };
    const hasSession = await apiSignUp(fullName, email, password);
    if (!hasSession) {
      localStorage.setItem('medifind.pending-pharmacy', JSON.stringify(pending));
      return false;
    }
    await onboardPharmacy(pending);
    await loadProfile();
    return true;
  };

  const signOut = async () => {
    apiSignOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, startDemo, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};