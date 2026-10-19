import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  BookOpen, 
  Lock, 
  PlayCircle, 
  Trash2, 
  ArrowLeft, 
  Search, 
  X, 
  CheckCircle2, 
  Send, 
  FileText,
  Folder as FolderIcon,
  Layers,
  ChevronRight,
  Award,
  RotateCcw
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

interface Exam {
  id: string;
  title: string;
  category?: string;
  subCategory?: string;
  timeLimit: number;
  totalQuestions: number;
  marksPerQuestion?: number;
  negativeMarking?: number;
  isPaid: boolean;
  createdAt?: any;
}

export default function ExamList() {
  const { userData, role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Navigation & Folder State
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'folder' | 'all'>('folder');

  // Telegram / Community Link
  const [telegramLink, setTelegramLink] = useState('https://t.me/porikkhaghor');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const CACHE_KEY = 'porikkhaghor_cached_exams';
  const CACHE_TIME_KEY = 'porikkhaghor_cached_exams_time';
  const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache to drastically cut down Firestore reads

  const fetchExams = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        // Check cache first
        const cached = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        if (cached && cachedTime && (Date.now() - Number(cachedTime) < CACHE_TTL)) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setExams(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {
            // ignore cache parse error
          }
        }
      }

      const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedExams = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Exam[];
      setExams(fetchedExams);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(fetchedExams));
      sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

      // Fetch Telegram link from settings if exists
      const settingsSnap = await getDoc(doc(db, 'settings', 'adminProfile'));
      if (settingsSnap.exists() && settingsSnap.data().telegramLink) {
        setTelegramLink(settingsSnap.data().telegramLink);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পরীক্ষাটি ডিলিট করতে চান? এই কাজ আর ফেরানো যাবে না।')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'exams', id));
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_TIME_KEY);
      fetchExams(true);
      alert('পরীক্ষা ডিলিট করা হয়েছে!');
    } catch (error) {
      console.error(error);
      alert('পরীক্ষা ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  // Helper to split exam into full path segments
  const getExamPath = (exam: Exam): string[] => {
    if (!exam.category && !exam.subCategory) {
      return ['সাধারণ পরীক্ষা'];
    }

    const segments: string[] = [];
    if (exam.category) {
      if (exam.category.includes('>')) {
        exam.category.split('>').forEach(s => {
          const clean = s.trim();
          if (clean) segments.push(clean);
        });
      } else {
        const clean = exam.category.trim();
        if (clean) segments.push(clean);
      }
    }

    if (exam.subCategory && exam.subCategory.trim()) {
      segments.push(exam.subCategory.trim());
    }

    return segments.length > 0 ? segments : ['সাধারণ পরীক্ষা'];
  };

  // Filter exams by search query if active
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return exams.filter(exam => {
      const titleMatch = exam.title?.toLowerCase().includes(q);
      const catMatch = exam.category?.toLowerCase().includes(q);
      const subCatMatch = exam.subCategory?.toLowerCase().includes(q);
      return titleMatch || catMatch || subCatMatch;
    });
  }, [exams, searchQuery]);

  // Current Level Information
  const { currentFolders, directExams } = useMemo(() => {
    const foldersMap = new Map<string, number>();
    const matchingDirectExams: Exam[] = [];

    exams.forEach(exam => {
      const path = getExamPath(exam);

      // Check if this exam belongs inside currentPath
      let matchesCurrent = true;
      for (let i = 0; i < currentPath.length; i++) {
        if (path[i] !== currentPath[i]) {
          matchesCurrent = false;
          break;
        }
      }

      if (matchesCurrent) {
        if (path.length > currentPath.length) {
          // This exam is inside a subfolder at this level
          const nextSegment = path[currentPath.length];
          foldersMap.set(nextSegment, (foldersMap.get(nextSegment) || 0) + 1);
        } else {
          // This exam is directly at this level
          matchingDirectExams.push(exam);
        }
      }
    });

    const folders = Array.from(foldersMap.entries()).map(([name, count]) => ({
      name,
      count
    }));

    return { currentFolders: folders, directExams: matchingDirectExams };
  }, [exams, currentPath]);

  // Navigate deeper into a folder
  const enterFolder = (folderName: string) => {
    setCurrentPath(prev => [...prev, folderName]);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Go up one level
  const goBack = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  // Jump to specific breadcrumb index
  const jumpToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(prev => prev.slice(0, index + 1));
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-lg font-medium text-gray-500">পরীক্ষাগুলো লোড হচ্ছে...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pb-16 px-4 sm:px-6"
    >
      {/* Community Announcement Banner (Screenshot 1 Style) */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg">কোর্সে যুক্ত হওয়ার জন্য ধন্যবাদ! 🎯</h4>
            <p className="text-white/90 text-xs sm:text-sm">এক্সক্লুসিভ ম্যাটেরিয়ালস ও লেটেস্ট আপডেট পেতে টেলিগ্রাম চ্যানেলে জয়েন করুন।</p>
          </div>
        </div>
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-105"
        >
          <Send size={16} /> Join Telegram
        </a>
      </div>

      {/* Main Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="text-primary-light dark:text-primary-dark" size={28} />
            {currentPath.length === 0 ? 'পরীক্ষা ও ফোল্ডারসমূহ' : currentPath[currentPath.length - 1]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {currentPath.length === 0 
              ? 'বিষয় ও ক্যাটাগরি অনুযায়ী সাজানো ফোল্ডার থেকে আপনার পরীক্ষাটি বেছে নিন'
              : `${currentPath.join(' / ')} ফোল্ডারের অন্তর্ভুক্ত পরীক্ষাসমূহ`}
          </p>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="যেকোনো পরীক্ষা বা বিষয় খুঁজুন..."
              className="w-full pl-10 pr-9 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/40 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => { setViewMode('folder'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'folder' && !searchQuery
                  ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              ফোল্ডার ভিউ
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'all' || searchQuery
                  ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              সকল পরীক্ষা
            </button>
          </div>

          <button
            onClick={() => fetchExams(true)}
            disabled={isRefreshing}
            title="নতুন কোনো পরীক্ষা যোগ হলে রিফ্রেশ করুন"
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 hover:text-primary-light dark:hover:text-primary-dark transition-all hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 flex items-center justify-center disabled:opacity-50"
          >
            <RotateCcw size={16} className={isRefreshing ? 'animate-spin text-primary-light dark:text-primary-dark' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Bar / Breadcrumbs (Screenshot 2, 3, 4 Style) */}
      {!searchQuery && viewMode === 'folder' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 px-5 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            {currentPath.length > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors mr-2"
              >
                <ArrowLeft size={16} /> ফিরে যান
              </button>
            )}

            <button
              onClick={() => jumpToBreadcrumb(-1)}
              className={`hover:text-primary-light dark:hover:text-primary-dark font-medium transition-colors ${
                currentPath.length === 0 ? 'text-primary-light dark:text-primary-dark font-bold' : ''
              }`}
            >
              সকল ফোল্ডার
            </button>

            {currentPath.map((seg, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-gray-400" />
                <button
                  onClick={() => jumpToBreadcrumb(idx)}
                  className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors ${
                    idx === currentPath.length - 1 ? 'text-primary-light dark:text-primary-dark font-bold' : 'font-medium'
                  }`}
                >
                  {seg}
                </button>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400 font-medium">
            {currentPath.length === 0 
              ? `${currentFolders.length}টি ক্যাটাগরি ফোল্ডার` 
              : `${directExams.length}টি পরীক্ষা`}
          </div>
        </div>
      )}

      {/* ================= SEARCH RESULTS VIEW ================= */}
      {searchQuery.trim() !== '' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              অনুসন্ধানের ফলাফল ({searchResults.length}টি পাওয়া গেছে)
            </h3>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-primary-light dark:text-primary-dark hover:underline"
            >
              অনুসন্ধান মুছুন
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 font-medium">"{searchQuery}" এর জন্য কোনো পরীক্ষা পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(exam => renderExamCard(exam))}
            </div>
          )}
        </div>
      ) : viewMode === 'all' ? (
        /* ================= FLAT ALL EXAMS VIEW ================= */
        <div>
          {exams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h2 className="text-xl font-medium text-gray-500">এখনো কোনো পরীক্ষা যোগ করা হয়নি</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => renderExamCard(exam))}
            </div>
          )}
        </div>
      ) : (
        /* ================= HIERARCHICAL FOLDER VIEW (SCREENSHOT 2, 3, 4, 5) ================= */
        <div className="space-y-10">
          {/* 1. Sub-folders at current level */}
          {currentFolders.length > 0 && (
            <div>
              {currentPath.length > 0 && directExams.length > 0 && (
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4">উপ-ফোল্ডারসমূহ:</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentFolders.map(folder => (
                  <motion.div
                    key={folder.name}
                    whileHover={{ y: -5, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => enterFolder(folder.name)}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 text-center cursor-pointer border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group border-b-4 border-b-transparent hover:border-b-amber-400"
                  >
                    {/* Glowing Yellow Folder Icon (Screenshots 2 & 5) */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-amber-200/50 dark:border-amber-700/30">
                      <svg 
                        className="w-10 h-10 sm:w-11 sm:h-11 text-amber-500 fill-amber-400/40" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.75" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                      </svg>
                    </div>

                    {/* Folder Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors line-clamp-1 mb-1">
                      {folder.name}
                    </h3>

                    {/* Folder Exams Count */}
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {folder.count} Exams
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Direct exams in current folder */}
          {directExams.length > 0 && (
            <div>
              {currentFolders.length > 0 && (
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4">পরীক্ষাসমূহ:</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {directExams.map(exam => renderExamCard(exam))}
              </div>
            </div>
          )}

          {/* 3. Empty folder state */}
          {currentFolders.length === 0 && directExams.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <FolderIcon size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">এই ফোল্ডারে এখনো কোনো পরীক্ষা নেই</h3>
              <p className="text-gray-500 text-sm mb-6">টিচার এখনো এই ক্যাটাগরিতে কোনো পরীক্ষা যুক্ত করেননি।</p>
              <button
                onClick={goBack}
                className="px-5 py-2.5 bg-primary-light text-white font-medium rounded-xl text-sm hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} /> পূর্বের পেজে ফিরে যান
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </motion.div>
  );

  // Render individual exam card (matching Screenshot 3 & 4)
  function renderExamCard(exam: Exam) {
    const totalMarks = (exam.totalQuestions || 0) * (exam.marksPerQuestion || 1);
    const isLocked = exam.isPaid && !userData?.hasPaidAccess;

    // Check if exam is in-progress
    const savedProgressStr = localStorage.getItem(`exam_progress_${exam.id}`);
    let isExamInProgress = false;
    if (savedProgressStr) {
      try {
        const parsed = JSON.parse(savedProgressStr);
        if (parsed.endTime && parsed.endTime > Date.now()) {
          isExamInProgress = true;
        } else if (parsed.endTime && parsed.endTime <= Date.now()) {
          localStorage.removeItem(`exam_progress_${exam.id}`);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    return (
      <motion.div
        key={exam.id}
        whileHover={{ y: -4 }}
        className={`bg-white dark:bg-gray-900 rounded-3xl border shadow-sm overflow-hidden flex flex-col p-6 transition-all hover:shadow-xl group relative ${
          isExamInProgress 
            ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/30' 
            : 'border-gray-100 dark:border-gray-800'
        }`}
      >
        {/* Top Badges */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-[11px] font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full line-clamp-1 max-w-[60%]">
            {exam.category || 'সাধারণ'}
          </span>

          {isExamInProgress ? (
            <span className="text-xs font-bold px-3 py-1 bg-amber-500 text-white rounded-full flex items-center gap-1.5 shadow-sm shadow-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              চলমান পরীক্ষা
            </span>
          ) : exam.isPaid ? (
            userData?.hasPaidAccess ? (
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200/60 dark:border-blue-800/40">
                PURCHASED
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                <Lock size={12} /> পেইড
              </span>
            )
          ) : (
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              FREE
            </span>
          )}
        </div>

        {/* Center Document Icon (Screenshots 3 & 4) */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 ${
          isExamInProgress
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
        }`}>
          <FileText size={28} />
        </div>

        {/* Exam Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-3 line-clamp-2">
          {exam.title}
        </h3>

        {/* SubCategory if present */}
        {exam.subCategory && (
          <p className="text-xs text-primary-light dark:text-primary-dark text-center font-semibold mb-3">
            {exam.subCategory}
          </p>
        )}

        {/* Metadata info */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-1 font-medium">
            <Clock size={15} className="text-gray-400" />
            <span>{exam.timeLimit} মি.</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <Award size={15} className="text-gray-400" />
            <span>{totalMarks} নম্বর</span>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              exam.negativeMarking === 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              {exam.negativeMarking === 0 ? 'নেগেটিভ নেই (০)' : `নেগেটিভ -${exam.negativeMarking ?? 0.25}`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          {isLocked ? (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Lock size={18} /> আনলক করুন
            </button>
          ) : (
            <Link
              to={`/take-exam/${exam.id}`}
              className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md ${
                isExamInProgress
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50 shadow-amber-500/20'
                  : 'bg-primary-light hover:bg-primary-dark text-white'
              }`}
            >
              <PlayCircle size={18} /> {isExamInProgress ? 'Continue Exam →' : 'Start Exam →'}
            </Link>
          )}

          {/* Footer Action Links: Leaderboard & Teacher Delete */}
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <Link
              to={`/leaderboard/${exam.id}`}
              className="text-gray-500 hover:text-primary-light dark:hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
            >
              <Award size={13} className="text-amber-500" /> মেধা তালিকা
            </Link>

            {(role === 'owner' || role === 'assistant') && (
              <button
                onClick={(e) => handleDeleteExam(exam.id, e)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:underline transition-colors"
              >
                <Trash2 size={13} /> পরীক্ষা ডিলিট
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}
