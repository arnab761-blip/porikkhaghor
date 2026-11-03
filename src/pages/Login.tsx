import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Format Firebase Error to Bangla
  const formatAuthError = (err: any) => {
    const code = err?.code || '';
    if (code.includes('user-not-found')) {
      return 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। আগে রেজিস্ট্রেশন করুন।';
    } else if (code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'ভুল পাসওয়ার্ড অথবা ইমেইল! অনুগ্রহ করে সঠিক তথ্য দিয়ে চেষ্টা করুন।';
    } else if (code.includes('email-already-in-use')) {
      return 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। সরাসরি লগইন করুন।';
    } else if (code.includes('weak-password')) {
      return 'পাসওয়ার্ডটি খুবই দুর্বল। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।';
    } else if (code.includes('invalid-email')) {
      return 'একটি সঠিক ইমেইল অ্যাড্রেস লিখুন।';
    } else if (code.includes('popup-closed-by-user')) {
      return 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। আবার চেষ্টা করুন।';
    }
    return err?.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await signInAsGuest();
      navigate('/dashboard');
    } catch (err: any) {
      setError("গেস্ট লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('ইমেইল ও পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await signInWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('আপনার পুরো নাম লিখুন।');
      return;
    }
    if (!email.trim()) {
      setError('আপনার ইমেইল অ্যাড্রেস লিখুন।');
      return;
    }
    if (!phone.trim()) {
      setError('আপনার সচল মোবাইল নম্বর লিখুন।');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await signUpWithEmail(email, password, name, phone);
      navigate('/dashboard');
    } catch (err: any) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('পাসওয়ার্ড রিকভারির জন্য আপনার নিবন্ধিত ইমেইলটি লিখুন।');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await resetPassword(email);
      setSuccess('পাসওয়ার্ড রিসেটের লিংক আপনার ইমেইলে পাঠানো হয়েছে! ইনবক্স অথবা স্প্যাম (Spam) ফোল্ডার চেক করুন।');
      setIsLoading(false);
    } catch (err: any) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-md mx-auto my-8 sm:my-12 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">
          {authMode === 'login' ? 'অ্যাকাউন্টে লগইন' : authMode === 'register' ? 'নতুন শিক্ষার্থী রেজিস্ট্রেশন' : 'পাসওয়ার্ড পুনরুদ্ধার'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          {authMode === 'login' 
            ? 'পরীক্ষা দিতে ও প্রস্তুতি নিতে আপনার অ্যাকাউন্টে প্রবেশ করুন' 
            : authMode === 'register' 
            ? 'সহজেই অ্যাকাউন্ট খুলে নিজের প্রস্তুতি শুরু করুন' 
            : 'নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠিয়ে দেওয়া হবে'}
        </p>
      </div>

      {/* Tabs for Login vs Register */}
      {authMode !== 'forgot' && (
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMode === 'login'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            লগইন করুন
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMode === 'register'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            নতুন অ্যাকাউন্ট
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Forms Area */}
      <AnimatePresence mode="wait">
        {/* ================= 1. LOGIN FORM ================= */}
        {authMode === 'login' && (
          <motion.form 
            key="login" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleEmailLogin}
            className="space-y-4"
          >
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                ইমেইল অ্যাড্রেস
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পাসওয়ার্ড
                </label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setError(null); setSuccess(null); }}
                  className="text-xs text-primary-light dark:text-primary-dark font-medium hover:underline"
                >
                  পাসওয়ার্ড মনে নেই?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary-light hover:bg-primary-dark text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'} <ArrowRight size={16} />
            </button>
          </motion.form>
        )}

        {/* ================= 2. REGISTER FORM ================= */}
        {authMode === 'register' && (
          <motion.form 
            key="register" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleEmailRegister}
            className="space-y-3.5"
          >
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                আপনার পুরো নাম
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ রাফি"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ইমেইল অ্যাড্রেস
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Mobile Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="০১৭xxxxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="একটি শক্তিশালী পাসওয়ার্ড দিন"
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ডটি পুনরায় লিখুন"
                  className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-primary-light hover:bg-primary-dark text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'} <ArrowRight size={16} />
            </button>
          </motion.form>
        )}

        {/* ================= 3. FORGOT PASSWORD ================= */}
        {authMode === 'forgot' && (
          <motion.form 
            key="forgot" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleForgotPassword}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                আপনার নিবন্ধিত ইমেইল
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                এই ইমেইলে একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হবে। সেই লিংকে চাপ দিয়ে আপনি নতুন পাসওয়ার্ড সেট করে নিতে পারবেন।
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary-light hover:bg-primary-dark text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? 'লিংক পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'} <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }}
              className="w-full py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-light font-semibold transition-colors"
            >
              ← লগইন পেজে ফিরে যান
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="relative flex items-center py-5">
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        <span className="flex-shrink-0 px-3 text-gray-400 text-xs">অথবা অন্যান্য মাধ্যমে লগইন</span>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      {/* Google and Guest Login Actions */}
      <div className="flex flex-col gap-3">
        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-light dark:hover:border-primary-dark text-gray-800 dark:text-gray-200 py-3 px-4 rounded-2xl font-medium transition-all shadow-sm hover:shadow text-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google দিয়ে এক-ক্লিকে লগইন
        </button>

        {/* Guest Login Button */}
        <button
          onClick={handleGuestLogin}
          disabled={isLoading}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-2xl font-medium transition-all text-xs sm:text-sm disabled:opacity-50"
        >
          <UserCircle size={18} />
          গেস্ট হিসেবে পরীক্ষা দিন (Guest)
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        গেস্ট অ্যাকাউন্টের রেজাল্ট পরবর্তীতে ইমেইল বা গুগল দিয়ে যুক্ত হলে একাউন্টে সংরক্ষিত হবে।
      </p>
    </motion.div>
  );
}
