import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, User, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Footer from './Footer';

import NotificationBell from './NotificationBell';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const location = useLocation();

  const isHomeActive = location.pathname === '/';
  const isExamsActive = location.pathname.startsWith('/exam') || 
                        location.pathname.startsWith('/take-exam') || 
                        location.pathname.startsWith('/result') || 
                        location.pathname.startsWith('/leaderboard');
  const isProfileActive = ['/dashboard', '/login', '/my-exams', '/my-doubts', '/teacher-doubts', '/performance', '/mistakes', '/manage-students', '/manage-packages', '/manage-resources', '/admin-settings', '/create-exam'].some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-heading font-bold text-primary-light dark:text-primary-dark">
            পরীক্ষাঘর
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/exams" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">পরীক্ষা সমূহ</Link>
            <Link to="/courses" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">প্যাকেজ</Link>
            <Link to="/resources" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">রিসোর্স</Link>
            
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-primary-light dark:text-primary-dark font-medium hover:underline">
                  ড্যাশবোর্ড
                </Link>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-error-light transition-colors" title="লগআউট">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white dark:text-gray-900 rounded-md font-medium hover:opacity-90 transition-opacity">
                লগইন
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button & Notification */}
          <div className="flex md:hidden items-center gap-2 sm:gap-4">
            <button onClick={toggleDarkMode} className="p-2">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user && <NotificationBell />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 bg-background border-b border-gray-200 dark:border-gray-800 z-40 md:hidden shadow-lg"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link to="/exams" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">পরীক্ষা সমূহ</Link>
              <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">প্যাকেজ</Link>
              <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">রিসোর্স</Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">ড্যাশবোর্ড</Link>
                  <Link to="/my-doubts" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">আমার ডাউটসমূহ</Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-lg p-2 text-left text-error-light hover:bg-gray-50 dark:hover:bg-gray-800 rounded mt-2">লগআউট</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 bg-accent-light dark:bg-accent-dark text-white dark:text-gray-900 rounded text-center mt-2">লগইন</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" 
             style={{ backgroundImage: 'linear-gradient(transparent 95%, #13294B 5%)', backgroundSize: '100% 2rem' }} />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16 relative">
          {/* Home Tab */}
          <Link 
            to="/" 
            className={`relative flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-200 ${
              isHomeActive 
                ? 'text-primary-light dark:text-primary-dark font-bold' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {isHomeActive && (
              <span className="absolute top-0 w-10 h-1 bg-primary-light dark:bg-primary-dark rounded-full shadow-sm" />
            )}
            <div className={`p-1 rounded-xl transition-all ${isHomeActive ? 'bg-primary-light/10 dark:bg-primary-dark/20 scale-110' : ''}`}>
              <Home size={20} />
            </div>
            <span className={`text-[11px] mt-0.5 ${isHomeActive ? 'font-bold' : 'font-normal'}`}>হোম</span>
          </Link>

          {/* Exams Tab */}
          <Link 
            to="/exams" 
            className={`relative flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-200 ${
              isExamsActive 
                ? 'text-primary-light dark:text-primary-dark font-bold' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {isExamsActive && (
              <span className="absolute top-0 w-10 h-1 bg-primary-light dark:bg-primary-dark rounded-full shadow-sm" />
            )}
            <div className={`p-1 rounded-xl transition-all ${isExamsActive ? 'bg-primary-light/10 dark:bg-primary-dark/20 scale-110' : ''}`}>
              <BookOpen size={20} />
            </div>
            <span className={`text-[11px] mt-0.5 ${isExamsActive ? 'font-bold' : 'font-normal'}`}>পরীক্ষা</span>
          </Link>

          {/* Profile / Dashboard Tab */}
          <Link 
            to={user ? "/dashboard" : "/login"} 
            className={`relative flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-200 ${
              isProfileActive 
                ? 'text-primary-light dark:text-primary-dark font-bold' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {isProfileActive && (
              <span className="absolute top-0 w-10 h-1 bg-primary-light dark:bg-primary-dark rounded-full shadow-sm" />
            )}
            <div className={`p-1 rounded-xl transition-all ${isProfileActive ? 'bg-primary-light/10 dark:bg-primary-dark/20 scale-110' : ''}`}>
              <User size={20} />
            </div>
            <span className={`text-[11px] mt-0.5 ${isProfileActive ? 'font-bold' : 'font-normal'}`}>
              {user ? "প্রোফাইল" : "লগইন"}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
