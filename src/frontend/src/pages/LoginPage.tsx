import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">MP</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 margin-auto">MediFind AI</h2>
          <p className="text-slate-500 margin-auto">Pharmacy Management System</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-sm margin-auto">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={remember}
                onChange={() => setRemember(remember)}
                className="rounded border border-slate-200 w-4 h-4 p-1 cursor-pointer"
              />
              <label className="text-sm text-slate-500" for="remember-me">Remember me</label>
            </div>
            <a href="/register" className="text-sm text-action hover:underline">Create an Account</a>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Sign In to MediFind AI
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-rose-600 margin-center">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;