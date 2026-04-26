import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, GraduationCap, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

type Step = 'role' | 'details';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
    />
  );
}

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', college: '', orgName: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.orgName.trim()) e.orgName = role === 'admin' ? 'Organization name is required' : 'Organization name is required to join';
    if (role === 'ambassador' && !form.college.trim()) e.college = 'College name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate() || !role) return;
    setLoading(true);
    setApiError('');
    const { error } = await signUp(form.email.trim(), form.password, form.fullName.trim(), form.college.trim(), role, form.orgName.trim());
    setLoading(false);
    if (error) { setApiError(error); return; }
    navigate(role === 'admin' ? '/admin/dashboard' : '/ambassador/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">CampusConnect</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['role', 'details'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s || (step === 'details' && i === 0) ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {i + 1}
                </div>
                {i < 1 && <div className={`h-0.5 w-8 rounded ${step === 'details' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-gray-500">{step === 'role' ? 'Choose role' : 'Your details'}</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 'role' ? (
              <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Who are you joining as?</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { value: 'admin', icon: Building2, title: "I'm an Admin", desc: 'Manage your ambassador program' },
                    { value: 'ambassador', icon: GraduationCap, title: "I'm an Ambassador", desc: 'Complete tasks & earn rewards' },
                  ] as const).map(({ value, icon: Icon, title, desc }) => (
                    <button
                      key={value}
                      onClick={() => setRole(value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${role === value ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${role === value ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-semibold ${role === value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                <button
                  disabled={!role}
                  onClick={() => setStep('details')}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{role === 'admin' ? 'Set up your organisation' : 'Join an organisation'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Fill in your details below</p>

                {apiError && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Full Name" error={errors.fullName}>
                    <Input value={form.fullName} onChange={set('fullName')} placeholder="Priya Sharma" />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  </Field>
                  <Field label="Password" error={errors.password}>
                    <Input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
                  </Field>
                  {role === 'ambassador' && (
                    <Field label="College" error={errors.college}>
                      <Input value={form.college} onChange={set('college')} placeholder="IIT Madras" />
                    </Field>
                  )}
                  <Field label={role === 'admin' ? 'Organisation Name' : 'Organisation to Join'} error={errors.orgName}>
                    <Input value={form.orgName} onChange={set('orgName')} placeholder={role === 'admin' ? 'My Startup' : 'Exact org name'} />
                  </Field>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep('role')} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Account'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
