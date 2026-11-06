import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState('pharmacist');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await signUp(email, password, fullName, role);
      setSuccess(true);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Account</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm">Account created! Redirecting...</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 margin-bottom-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
              <option value="pharmacist">Pharmacist Admin</option>
              <option value="staff">Staff Dispenser</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Register Account
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-600">Account created! Redirecting to dashboard...</p>}
      </div>
    </div>
  );
}

export default RegisterPage;