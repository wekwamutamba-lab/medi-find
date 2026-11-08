import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authConfigured } from '../api';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [mode, setMode] = React.useState<'production' | 'demo'>('production');
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pharmacyName, setPharmacyName] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      const signedIn = await signUp(email, password, fullName, mode, pharmacyName, licenseNumber);
      if (!signedIn && mode === 'production') {
        setSuccess(true);
        setError('Verify your email, then sign in to finish pharmacy setup.');
        return;
      }
      setSuccess(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Get started with MediFind</h2>
        <p className="mb-5 text-sm text-slate-500">Set up a live pharmacy or explore the sandbox first.</p>
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Registration mode">
          <button type="button" role="tab" aria-selected={mode === 'production'} onClick={() => setMode('production')} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'production' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Register My Pharmacy</button>
          <button type="button" role="tab" aria-selected={mode === 'demo'} onClick={() => setMode('demo')} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Try Demo Pharmacy</button>
        </div>
        <div className={`mb-5 rounded-lg border p-3 text-xs ${mode === 'demo' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {mode === 'demo' ? 'Demo mode — sample data is local to the sandbox.' : authConfigured ? 'Production mode — pharmacy setup uses your live Supabase account.' : 'Production setup is unavailable until Supabase URL and anon key are configured.'}
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm">Account created! Redirecting...</div>}
        {mode === 'demo' ? <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">No credentials needed. Enter a preloaded pharmacy sandbox with sample stock, alerts, and checkout.</p>
          <button type="button" onClick={async () => { setLoading(true); await signUp('', '', 'Demo Pharmacist', 'demo'); navigate('/dashboard'); }} disabled={loading} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">{loading ? 'Opening sandbox…' : 'Enter Demo Pharmacy'}</button>
          <button type="button" onClick={() => navigate('/login')} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Back to Sign In</button>
        </div> : <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Pharmacy Name</label>
            <input type="text" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} required maxLength={200} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">License / Registration ID</label>
            <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !authConfigured}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 sm:col-span-2"
          >
            {loading ? 'Creating pharmacy…' : 'Create Pharmacy & Admin Account'}
          </button>
        </form>}
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-600">Account created! Redirecting to dashboard...</p>}
      </div>
    </div>
  );
}

export default RegisterPage;