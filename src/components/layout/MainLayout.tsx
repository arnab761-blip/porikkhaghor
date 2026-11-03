import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, User, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Footer from './Footer';

import NotificationBell from './NotificationBell';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, role, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

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
            {t('brandName')}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/exams" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">{t('exams')}</Link>
            <Link to="/courses" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">{t('packages')}</Link>
            <Link to="/resources" className="hover:text-accent-light dark:hover:text-accent-dark transition-colors">{t('resources')}</Link>
            
            <Link 
              to="/user-guide" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark hover:bg-primary-light hover:text-white dark:hover:bg-primary-dark dark:hover:text-white transition-all text-xs font-bold shadow-2xs"
              title={language === 'bn' ? "ওয়েবসাইট ব্যবহারের সম্পূর্ণ ইউজার গাইড" : "Complete Platform User Guide"}
            >
              <BookOpen size={15} /> {t('userGuide')}
            </Link>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={language === 'bn' ? "Switch to English" : "বাংলা ভাষায় পরিবর্তন করুন"}
            >
              <span className={language === 'bn' ? 'text-primary-light dark:text-primary-dark font-extrabold' : 'text-gray-400 font-normal'}>
                বাং
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className={language === 'en' ? 'text-primary-light dark:text-primary-dark font-extrabold' : 'text-gray-400 font-normal'}>
                EN
              </span>
            </button>
            
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-primary-light dark:text-primary-dark font-medium hover:underline">
                  {t('dashboard')}
                </Link>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-error-light transition-colors" title={t('logout')}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-accent-light dark:bg-accent-dark text-white dark:text-gray-900 rounded-md font-medium hover:opacity-90 transition-opacity">
                {t('login')}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button & Notification */}
          <div className="flex md:hidden items-center gap-2 sm:gap-3">
            {/* Mobile Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold transition-all"
            >
              <span className={language === 'bn' ? 'text-primary-light dark:text-primary-dark font-extrabold' : 'text-gray-400'}>
                বাং
              </span>
              <span className="text-gray-300">|</span>
              <span className={language === 'en' ? 'text-primary-light dark:text-primary-dark font-extrabold' : 'text-gray-400'}>
                EN
              </span>
            </button>

            <Link to="/user-guide" className="p-1.5 text-primary-light dark:text-primary-dark" title={t('userGuide')}>
              <BookOpen size={19} />
            </Link>
            <button onClick={toggleDarkMode} className="p-1.5">
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {user && <NotificationBell />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1.5">
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
            <nav className="flex flex-col p-4 gap-3">
              <Link to="/user-guide" onClick={() => setIsMobileMenuOpen(false)} className="text-base p-2.5 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark font-bold rounded-xl flex items-center gap-2">
                <BookOpen size={18} /> {t('userGuideTitle')}
              </Link>
              <Link to="/exams" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">{t('exams')}</Link>
              <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">{t('packages')}</Link>
              <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">{t('resources')}</Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('dashboard')}</Link>
                  {role === 'owner' || role === 'assistant' ? (
                    <>
                      <Link to="/create-exam" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('createExam')}</Link>
                      <Link to="/teacher-doubts" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('teacherDoubts')}</Link>
                      <Link to="/manage-packages" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('managePackages')}</Link>
                      <Link to="/manage-students" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('manageStudents')}</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/my-exams" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('myExams')}</Link>
                      <Link to="/mistakes" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('mistakeBank')}</Link>
                      <Link to="/my-doubts" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('myDoubts')}</Link>
                      <Link to="/performance" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-primary-light dark:text-primary-dark font-medium">{t('performance')}</Link>
                    </>
                  )}
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-lg p-2 text-left text-error-light hover:bg-gray-50 dark:hover:bg-gray-800 rounded mt-2">{t('logout')}</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg p-2 bg-accent-light dark:bg-accent-dark text-white dark:text-gray-900 rounded text-center mt-2">{t('login')}</Link>
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
