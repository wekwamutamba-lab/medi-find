import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authConfigured } from '../api';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, startDemo } = useAuth();
  const [mode, setMode] = React.useState<'demo' | 'production'>('demo');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">MP</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 margin-auto">MediFind AI</h2>
          <p className="text-slate-500 margin-auto">Pharmacy Management System</p>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Sign-in mode">
          <button type="button" role="tab" aria-selected={mode === 'demo'} onClick={() => { setMode('demo'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Explore Demo Sandbox</button>
          <button type="button" role="tab" aria-selected={mode === 'production'} onClick={() => { setMode('production'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'production' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Sign In to My Pharmacy</button>
        </div>
        <div className={`mb-5 rounded-lg border p-3 text-xs ${mode === 'demo' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role="status">
          {mode === 'demo' ? 'Running in Demo Mode — Changes remain local to the demo pharmacy.' : authConfigured ? 'Production — Live Supabase Connection.' : 'Production mode requires Supabase URL and anon key configuration.'}
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-sm margin-auto">{error}</div>}
        {mode === 'production' && <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Work Email</label>
            <input
              type="email"
              placeholder="your.name@pharmacy.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="rounded border border-slate-200 w-4 h-4 p-1 cursor-pointer"
              />
              <label className="text-sm text-slate-500" htmlFor="remember-me">Remember me</label>
            </div>
            <a href="/register" className="text-sm text-action hover:underline">Create an Account</a>
          </div>
          <button
            type="submit"
            disabled={!authConfigured}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Sign In to My Pharmacy
          </button>
        </form>}
        {mode === 'demo' && <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Explore sample medicines, batches, alerts, and checkout in a safe sandbox. No production data is changed.</p>
          <button type="button" onClick={async () => { await startDemo(); navigate('/dashboard'); }} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">Enter Demo Pharmacy</button>
          <button type="button" onClick={() => navigate('/register')} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">Register My Pharmacy</button>
        </div>}
        {error && <p className="mt-3 text-sm text-rose-600 margin-center">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;