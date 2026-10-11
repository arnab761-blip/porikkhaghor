import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, User, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Footer from './Footer';

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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
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
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary-light dark:hover:text-primary-dark">
            <Home size={20} />
            <span className="text-xs mt-1">হোম</span>
          </Link>
          <Link to="/exams" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary-light dark:hover:text-primary-dark">
            <BookOpen size={20} />
            <span className="text-xs mt-1">পরীক্ষা</span>
          </Link>
          <Link to={user ? "/dashboard" : "/login"} className="flex flex-col items-center p-2 text-gray-500 hover:text-primary-light dark:hover:text-primary-dark">
            <User size={20} />
            <span className="text-xs mt-1">{user ? "প্রোফাইল" : "লগইন"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
