import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Search, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  BookOpen, 
  Trophy,
  ExternalLink
} from 'lucide-react';

interface StudentResult {
  id: string;
  examId: string;
  examTitle: string;
  submittedAt: any;
  stats: {
    totalScore: number;
    outOf: number;
    correct: number;
    wrong: number;
    skipped: number;
  };
}

interface ExamOption {
  id: string;
  title: string;
  category?: string;
}

export default function ManageStudents() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'exam'>('student');

  // Student Search Tab State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [userResults, setUserResults] = useState<StudentResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Exam Submissions Tab State
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');

  // Fetch all exams for dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list: ExamOption[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, title: d.data().title, category: d.data().category });
        });
        setExams(list);
        if (list.length > 0) {
          setSelectedExamId(list[0].id);
        }
      } catch (e) {
        console.error("Error fetching exams list:", e);
      }
    };

    fetchExams();
  }, []);

  // Fetch submissions when an exam is selected in Tab 2
  useEffect(() => {
    if (!selectedExamId || activeTab !== 'exam') return;

    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        const q = query(collection(db, 'results'), where('examId', '==', selectedExamId));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });

        // Sort by totalScore desc, then correct desc, then time asc
        list.sort((a, b) => {
          const scoreA = Number(a.stats?.totalScore) || 0;
          const scoreB = Number(b.stats?.totalScore) || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;

          const corA = Number(a.stats?.correct) || 0;
          const corB = Number(b.stats?.correct) || 0;
          if (corB !== corA) return corB - corA;

          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeA - timeB;
        });

        setExamSubmissions(list);
      } catch (e) {
        console.error("Error fetching exam submissions:", e);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [selectedExamId, activeTab]);

  const searchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFoundUser(null);
    setUserResults([]);

    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('এই ইমেইল দিয়ে কোনো স্টুডেন্ট অ্যাকাউন্ট পাওয়া যায়নি।');
      } else {
        const userDoc = snap.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as any;
        setFoundUser(userData);

        // Fetch this student's exam results
        fetchStudentResults(userData.id);
      }
    } catch (err) {
      console.error(err);
      setError('স্টুডেন্ট খোঁজার সময় একটি সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async (userId: string) => {
    try {
      setLoadingResults(true);
      // Query results by userId
      const q = query(collection(db, 'results'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const resultsList: StudentResult[] = [];
      snap.forEach(d => {
        resultsList.push({ id: d.id, ...d.data() } as StudentResult);
      });

      // Sort newest first
      resultsList.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
        return timeB - timeA;
      });

      setUserResults(resultsList);
    } catch (e) {
      console.error("Error fetching user results:", e);
    } finally {
      setLoadingResults(false);
    }
  };

  const togglePremiumAccess = async () => {
    if (!foundUser) return;
    setLoading(true);
    
    try {
      const newStatus = !foundUser.hasPaidAccess;
      const userRef = doc(db, 'users', foundUser.id);
      await updateDoc(userRef, { hasPaidAccess: newStatus });
      
      setFoundUser({ ...foundUser, hasPaidAccess: newStatus });
      setSuccess(`সফলভাবে ${newStatus ? 'পেইড অ্যাক্সেস দেওয়া হয়েছে' : 'পেইড অ্যাক্সেস বাতিল করা হয়েছে'}!`);
    } catch (err) {
      console.error(err);
      setError('অ্যাক্সেস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '০';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'অজানা সময়';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (role !== 'owner' && role !== 'assistant') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">অ্যাক্সেস নেই</h2>
        <p className="text-gray-600">এই পেজটি শুধুমাত্র শিক্ষকদের জন্য।</p>
      </div>
    );
  }

  // Filtered submissions in Tab 2
  const filteredSubmissions = examSubmissions.filter(sub => {
    if (!submissionSearch.trim()) return true;
    const q = submissionSearch.toLowerCase();
    return (sub.userName && sub.userName.toLowerCase().includes(q)) ||
           (sub.userEmail && sub.userEmail.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold flex items-center gap-3 text-gray-900 dark:text-white">
            <ShieldCheck className="text-primary-light" size={32} /> শিক্ষার্থী ও পরীক্ষার ফলাফল ম্যানেজমেন্ট
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            শিক্ষার্থীদের ব্যক্তিগত প্রোফাইল, দেওয়া পরীক্ষার উত্তরপত্র এবং সামগ্রিক ফলাফল পরীক্ষা করুন।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-white dark:bg-gray-900 text-primary-light shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            শিক্ষার্থী অনুসন্ধান ও খাতা
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-gray-900 text-primary-light shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            পরীক্ষাভিত্তিক মেধা তালিকা
          </button>
        </div>
      </div>

      {/* ================= TAB 1: INDIVIDUAL STUDENT INSPECTION ================= */}
      {activeTab === 'student' && (
        <div className="space-y-8">
          {/* Search Box */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
              <Search className="text-primary-light" size={20} /> শিক্ষার্থী খুঁজুন
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              যেকোনো শিক্ষার্থীর ইমেইল লিখে খুঁজুন। আপনি তার পেইড এক্সেস স্ট্যাটাস দেখতে পারবেন এবং সে কোন কোন পরীক্ষা দিয়েছে ও কত নম্বর পেয়েছে তা দেখতে পারবেন।
            </p>

            <form onSubmit={searchStudent} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="স্টুডেন্টের ইমেইল লিখুন (যেমন: student@gmail.com)..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light text-sm dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-primary-light hover:bg-primary-dark text-white rounded-2xl font-bold transition-colors disabled:opacity-70 whitespace-nowrap text-sm shadow-sm"
              >
                {loading ? 'অনুসন্ধান চলছে...' : 'খুঁজুন'}
              </button>
            </form>

            {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
            {success && <p className="text-green-500 mt-4 text-sm font-medium">{success}</p>}
          </div>

          {/* Student Profile Card */}
          {foundUser && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-light/10 text-primary-light rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0">
                      {foundUser.name ? foundUser.name.charAt(0).toUpperCase() : foundUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{foundUser.name || 'শিক্ষার্থী'}</h3>
                      <p className="text-gray-500 text-sm">{foundUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800">
                        স্ট্যাটাস: 
                        <span className={foundUser.hasPaidAccess ? "text-green-600 font-bold" : "text-gray-500"}>
                          {foundUser.hasPaidAccess ? 'পেইড শিক্ষার্থী (Premium Access)' : 'ফ্রি শিক্ষার্থী (Free Plan)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={togglePremiumAccess}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm transition-colors disabled:opacity-70 shadow-sm ${
                      foundUser.hasPaidAccess 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {foundUser.hasPaidAccess ? (
                      <><UserX size={18} /> এক্সেস বাতিল করুন</>
                    ) : (
                      <><UserCheck size={18} /> পেইড এক্সেস দিন</>
                    )}
                  </button>
                </div>
              </div>

              {/* Student Exam History & Answers */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={20} className="text-primary-light" /> এই শিক্ষার্থীর দেওয়া পরীক্ষাসমূহ ({userResults.length}টি)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">শিক্ষার্থীর কোনো উত্তরপত্রে ভুল হলে বা ব্যাখ্যা দেখতে "খাতা দেখুন" লিংকে চাপ দিন।</p>
                  </div>
                </div>

                {loadingResults ? (
                  <div className="py-12 text-center text-gray-500">পরীক্ষার হিস্ট্রি লোড হচ্ছে...</div>
                ) : userResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 font-medium bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    এই শিক্ষার্থী এখনো কোনো পরীক্ষা সম্পন্ন করেনি।
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {userResults.map((res) => {
                      const score = Number(res.stats?.totalScore) || 0;
                      const outOf = Number(res.stats?.outOf) || 100;
                      return (
                        <div key={res.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 px-3 rounded-xl transition-colors">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-base">
                              {res.examTitle}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={13} /> {formatDate(res.submittedAt)}
                              </span>
                              <span>•</span>
                              <span className="text-green-600 font-medium">{toBengaliNumber(res.stats?.correct)}টি সঠিক</span>
                              <span>•</span>
                              <span className="text-red-500 font-medium">{toBengaliNumber(res.stats?.wrong)}টি ভুল</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary-light dark:text-primary-dark">
                                {toBengaliNumber(score)} <span className="text-xs font-normal text-gray-400">/ {toBengaliNumber(outOf)}</span>
                              </div>
                            </div>
                            <Link
                              to={`/result/${res.id}`}
                              target="_blank"
                              className="px-4 py-2 bg-gray-100 hover:bg-primary-light hover:text-white dark:bg-gray-800 dark:hover:bg-primary-dark text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                            >
                              <FileText size={14} /> খাতা দেখুন <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: EXAM-WISE SUBMISSIONS & MERIT LIST ================= */}
      {activeTab === 'exam' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="text-amber-500" size={22} /> পরীক্ষা নির্বাচন করুন
                </h3>
                <p className="text-xs text-gray-500 mt-1">যেকোনো পরীক্ষা বেছে নিয়ে তার সকল পরীক্ষার্থীর তালিকা ও মেধা অবস্থান দেখুন।</p>
              </div>

              {/* Select Exam Dropdown */}
              <div className="w-full sm:w-72">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                >
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} {ex.category ? `(${ex.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                মোট অংশগ্রহণকারী: {toBengaliNumber(filteredSubmissions.length)} জন
              </span>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                />
              </div>
            </div>

            {/* Submissions Table */}
            {loadingSubmissions ? (
              <div className="py-16 text-center text-gray-500">মেধা তালিকা লোড হচ্ছে...</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-medium">
                এই পরীক্ষায় এখনো কোনো শিক্ষার্থী অংশগ্রহণ করেনি।
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-medium text-xs">
                      <th className="pb-3 text-center w-14">র‌্যাঙ্ক</th>
                      <th className="pb-3">শিক্ষার্থীর নাম ও ইমেইল</th>
                      <th className="pb-3 text-center">প্রাপ্ত নম্বর</th>
                      <th className="pb-3 text-center hidden md:table-cell">সঠিক / ভুল</th>
                      <th className="pb-3 text-right hidden sm:table-cell">জমার সময়</th>
                      <th className="pb-3 text-right">খাতা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredSubmissions.map((sub, index) => {
                      const rank = index + 1;
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3.5 text-center">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-400 text-amber-950 rounded-full font-bold text-xs shadow-sm">
                                ১
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-300 text-slate-800 rounded-full font-bold text-xs shadow-sm">
                                ২
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-700/60 text-white rounded-full font-bold text-xs shadow-sm">
                                ৩
                              </span>
                            ) : (
                              <span className="text-gray-500 font-medium text-xs">
                                {toBengaliNumber(rank)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {sub.userName}
                            </span>
                            <span className="text-xs text-gray-400">{sub.userEmail || 'ইমেইল নেই'}</span>
                          </td>
                          <td className="py-3.5 text-center font-bold text-primary-light dark:text-primary-dark">
                            {toBengaliNumber(sub.stats?.totalScore)}
                            <span className="text-xs text-gray-400 font-normal"> / {toBengaliNumber(sub.stats?.outOf)}</span>
                          </td>
                          <td className="py-3.5 text-center hidden md:table-cell text-xs">
                            <span className="text-green-600 font-medium">{toBengaliNumber(sub.stats?.correct)} সঠিক</span>
                            <span className="text-gray-300 dark:text-gray-700 mx-1">|</span>
                            <span className="text-red-500 font-medium">{toBengaliNumber(sub.stats?.wrong)} ভুল</span>
                          </td>
                          <td className="py-3.5 text-right hidden sm:table-cell text-xs text-gray-400">
                            {formatDate(sub.submittedAt)}
                          </td>
                          <td className="py-3.5 text-right">
                            <Link
                              to={`/result/${sub.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary-light hover:text-white dark:bg-gray-800 rounded-xl font-bold transition-all text-gray-700 dark:text-gray-300"
                            >
                              <FileText size={13} /> উত্তরপত্র
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
