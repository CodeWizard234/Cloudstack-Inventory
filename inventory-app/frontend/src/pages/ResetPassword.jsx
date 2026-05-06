import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, ShieldCheck, Boxes } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 5) score += 1;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ['Too weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-[#2f9cff]', 'bg-emerald-400'];
  const strengthTextColors = ['text-slate-400', 'text-red-500', 'text-amber-500', 'text-[#2f9cff]', 'text-emerald-500'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Use the link from your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      setSuccess(response.data?.message || 'Password reset successful. Redirecting to login...');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="auth-stage-orb auth-stage-orb-a" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-b" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-c" aria-hidden="true" />

      <div className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl shadow-[#0e2d49]/30 bg-white/10">
        <section className="auth-panel p-8 md:p-12">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ff7a59] to-[#2f9cff] rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition duration-500"></div>
              <img
                src="/branding/cloudstack-mark.svg"
                alt="Cloudstack logo"
                className="relative w-14 h-14 rounded-2xl border border-slate-200 shadow-xl bg-white transition duration-300 group-hover:scale-105"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand)] font-black">Control Center</p>
              <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-wide">Cloudstack</h2>
            </div>
          </div>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--brand)] font-bold">
            <ShieldCheck size={14} />
            Account Recovery
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-[var(--brand)] drop-shadow-sm pb-1">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-2">Create a new password and secure your account access.</p>

          {error && (
            <p className="mt-6 text-[var(--danger)] text-sm font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-6 text-emerald-700 text-sm font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="reveal-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="field-input !pl-10 !pr-12 bg-white"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 transition"
                  onClick={() => setShowNewPassword((current) => !current)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-full flex-1 rounded-full transition-all duration-500 ${i < strength ? strengthColors[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-[11px] font-bold text-right uppercase tracking-wider ${strength > 0 ? strengthTextColors[strength] : 'text-slate-400'}`}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            <div className="reveal-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="field-input !pl-10 !pr-12 bg-white"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 transition"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-6 reveal-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <button type="submit" disabled={loading} className="action-btn w-full py-3.5 flex items-center justify-center mt-2">
                {loading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shadow-sm" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-bold text-[var(--brand)] hover:text-[var(--brand-strong)]">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
