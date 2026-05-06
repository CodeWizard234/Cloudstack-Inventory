import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, Layers, Activity, Boxes } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import TypewriterText from '../components/TypewriterText';

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 5) score += 1;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabels = ['Too weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-[#2f9cff]', 'bg-emerald-400'];
  const strengthTextColors = ['text-slate-400', 'text-red-500', 'text-amber-500', 'text-[#2f9cff]', 'text-emerald-500'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      await login(formData.email, formData.password); 
      navigate('/'); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="auth-stage-orb auth-stage-orb-a" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-b" aria-hidden="true" />
      <div className="auth-stage-orb auth-stage-orb-c" aria-hidden="true" />

      <div className="auth-shell w-full max-w-6xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-[#0d263d]/30 bg-white/10">
        <section className="auth-panel p-8 md:p-12 lg:p-14 reveal-up min-h-[760px]">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--brand)] font-bold">
            <ShieldCheck size={14} />
            Cloudstack Account
          </p>

          <h2 className="text-4xl md:text-5xl font-black mt-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-[var(--brand)] drop-shadow-sm pb-1">Create Your Workspace</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">Set up your account once and start tracking inventory intelligently.</p>

          {error && <p className="mt-6 text-[var(--danger)] text-sm bg-red-50 p-3 rounded-xl border border-red-100 font-semibold">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="reveal-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="field-input !pl-10 bg-white"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="reveal-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="field-input !pl-10 bg-white"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="reveal-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="field-input !pl-10 !pr-12 bg-white"
                  placeholder="Use a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {formData.password && (
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

            <div className="mt-6 reveal-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <button type="submit" disabled={loading} className="action-btn w-full py-3.5 flex items-center justify-center mt-2">
                {loading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shadow-sm" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center reveal-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <p className="text-sm text-slate-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[var(--brand)] hover:text-[var(--brand-strong)]">
              Sign in
            </Link>
          </p>
          </div>
        </section>

        <section className="relative auth-mesh auth-noise p-8 md:p-12 text-white flex flex-col justify-between reveal-up-delay-1 min-h-[760px]">
          <div className="absolute -top-10 right-0 h-56 w-56 bg-[#40b3ff]/25 rounded-full blur-3xl float-slow" />
          <div className="absolute -bottom-12 left-0 h-52 w-52 bg-[#ff7a59]/30 rounded-full blur-3xl float-slow" style={{ animationDelay: '1.1s' }} />

          <div className="relative z-10">
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
              text="Start with clarity. Scale with confidence."
              speed={28}
              className="mt-5 block text-4xl md:text-5xl font-bold leading-[1.06]"
            />
            <TypewriterText
              text="Cloudstack helps you react faster, forecast better, and reduce dead stock through transparent demand signals."
              speed={18}
              startDelay={1100}
              className="mt-4 block text-white/75 max-w-md leading-7"
            />
          </div>

          <div className="relative z-10 mt-8 grid gap-4 max-w-xl">
            <div className="p-4 rounded-2xl bg-white/12 border border-white/20 backdrop-blur-sm float-subtle hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 cursor-default">
              <p className="text-white/75 text-sm flex items-center gap-2"><Layers size={16} className="text-[#ffb199]" /> Guided Setup</p>
              <p className="text-lg font-bold mt-1">Create your workspace and launch in minutes.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/20 backdrop-blur-sm float-subtle-delay hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 cursor-default">
              <p className="text-white/75 text-sm flex items-center gap-2"><Activity size={16} className="text-[#2f9cff]" /> Live Forecasts</p>
              <p className="text-lg font-bold mt-1">Realtime updates across products, sales, and forecasts.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SignUp;