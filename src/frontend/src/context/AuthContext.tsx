import { createContext, useContext, useState, type ReactNode } from 'react';

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
  const [user, setUser] = useState<AuthContextType['user']>({ id: 'demo-user', email: 'demo@pharmacy.local' });
  const [profile, setProfile] = useState<UserProfile | null>({
    id: 'demo-user',
    full_name: 'Demo Pharmacist',
    role: 'admin',
    email: 'demo@pharmacy.local',
    pharmacy_name: 'Demo Pharmacy',
  });
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => { /* demo mode: no-op */ };

  const signIn = async () => { /* demo mode: no-op */ };
  const startDemo = async () => { /* demo mode: no-op */ };
  const signUp = async () => { return true; };
  const signOut = async () => { /* demo mode: no-op */ };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, startDemo, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};