import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, Layers, Activity, Boxes } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import TypewriterText from '../components/TypewriterText';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [showForgotSection, setShowForgotSection] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMessage(response.data?.message || 'If an account exists for this email, a reset link has been sent.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-stage min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="auth-stage-orb auth-stage-orb-a" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-b" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-c" aria-hidden="true" />

      <div className="auth-shell w-full max-w-6xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-[#0e2d49]/30 bg-white/10">
        <section className="relative auth-mesh auth-noise p-8 md:p-12 lg:p-14 text-white overflow-hidden min-h-[680px] flex flex-col justify-between">
          <div className="absolute -top-24 -right-10 h-64 w-64 rounded-full bg-[#ff8f5f]/25 blur-3xl auth-floating" />
          <div className="absolute -bottom-24 -left-14 h-72 w-72 rounded-full bg-[#2f9cff]/30 blur-3xl auth-floating-delay" />

          <div className="relative z-10 reveal-up">
            <div className="flex items-center gap-4 mb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff7a59] to-[#2f9cff] rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                <img
                  src="/branding/cloudstack-mark.svg"
                  alt="Cloudstack logo"
                  className="relative w-14 h-14 rounded-2xl border border-white/20 shadow-2xl bg-[#0e2236]/60 backdrop-blur-xl transition duration-300 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#ffb199] font-black drop-shadow-md">Control Center</p>
                <h2 className="text-3xl font-black text-white leading-tight tracking-wide drop-shadow-lg">Cloudstack</h2>
                <h2 className="text-lg font-medium text-white/80 leading-none tracking-[0.2em]">INVENTORY</h2>
              </div>
            </div>
            <TypewriterText
              text="Own the stock story before the shortage happens."
              speed={24}
              className="mt-6 block text-4xl md:text-5xl lg:text-[3.45rem] leading-[1.03] font-bold max-w-xl"
            />
            <TypewriterText
              text="Live sales signals, urgency surfacing, and operational clarity built into one control room."
              speed={16}
              startDelay={1000}
              className="mt-5 block text-white/80 text-base max-w-xl leading-7"
            />
          </div>

          <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-up-delay-1 max-w-2xl">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm float-subtle hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 cursor-default">
              <div className="flex items-center gap-2 text-white/85 text-sm">
                <Layers size={16} className="text-[#ffb199]" />
                Live Signals
              </div>
              <p className="mt-1 text-lg font-semibold">One view for inventory pressure.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm float-subtle-delay hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 cursor-default">
              <div className="flex items-center gap-2 text-white/85 text-sm">
                <Activity size={16} className="text-[#2f9cff]" />
                Smart Priorities
              </div>
              <p className="mt-1 text-lg font-semibold">Focus on stock that actually matters.</p>
            </div>
          </div>
        </section>

        <section className="auth-panel p-8 md:p-12 lg:p-14 flex flex-col justify-center reveal-up-delay-2 min-h-[680px]">
          <div className="max-w-md mx-auto w-full">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--brand)] font-bold">
              <ShieldCheck size={14} />
              Secure Login
            </p>
            <h2 className="text-4xl md:text-5xl font-black mt-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-[var(--brand)] drop-shadow-sm pb-1">Sign In</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Access your warehouse command dashboard in seconds.</p>

            {error && (
              <p className="mt-6 text-[var(--danger)] text-sm font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="reveal-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="field-input !pl-10 bg-white"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="reveal-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="field-input !pl-10 !pr-12 bg-white"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mt-2 reveal-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] border-[1.5px] border-slate-300 bg-white group-hover:border-[var(--brand)] transition-colors">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="absolute inset-0 bg-[var(--brand)] rounded-[4.5px] scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center shadow-sm">
                      <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotSection((current) => !current);
                    setForgotError('');
                    setForgotMessage('');
                  }}
                  className="font-semibold text-[var(--brand)] hover:text-[#1a78c7] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="mt-6 reveal-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <button type="submit" disabled={loading} className="action-btn w-full py-3.5 flex items-center justify-center gap-2 mt-2">
                  {loading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shadow-sm" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} className="drop-shadow-sm" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {showForgotSection && (
              <form onSubmit={handleForgotPassword} className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reset Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="field-input bg-white"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="mt-3 w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {forgotLoading ? 'Sending link...' : 'Send Reset Link'}
                </button>
                {forgotError && <p className="mt-2 text-sm text-red-600">{forgotError}</p>}
                {forgotMessage && <p className="mt-2 text-sm text-emerald-700">{forgotMessage}</p>}
              </form>
            )}

            <p className="mt-7 text-center text-sm text-slate-600">
              New here?{' '}
              <Link to="/signup" className="font-bold text-[var(--brand)] hover:text-[var(--brand-strong)]">
                Create an account
              </Link>
            </p>

          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;