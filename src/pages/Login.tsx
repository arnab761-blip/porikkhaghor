import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircle, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError("গুগল লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInAsGuest();
      navigate('/dashboard');
    } catch (err: any) {
      setError("গেস্ট লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark mb-2">স্বাগতম!</h1>
        <p className="text-gray-600 dark:text-gray-400">পরীক্ষা দেওয়ার জন্য লগইন করুন</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-error-light/10 text-error-light dark:text-error-dark rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-light dark:hover:border-primary-dark text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          Google দিয়ে লগইন করুন
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="flex-shrink-0 px-4 text-gray-400 text-sm">অথবা</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        {/* Guest Login Button */}
        <button
          onClick={handleGuestLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-accent-light dark:bg-accent-dark hover:bg-yellow-500 text-white dark:text-gray-900 py-3 px-4 rounded-xl font-medium transition-all shadow-md disabled:opacity-50"
        >
          <UserCircle size={22} />
          অ্যাকাউন্ট ছাড়াই পরীক্ষা দিন (Guest)
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        গেস্ট হিসেবে পরীক্ষা দিলে আপনার রেজাল্ট ব্রাউজারে সেভ থাকবে। পরে গুগল দিয়ে লগইন করলে রেজাল্টগুলো মূল অ্যাকাউন্টে সিঙ্ক হয়ে যাবে।
      </p>
    </motion.div>
  );
}
