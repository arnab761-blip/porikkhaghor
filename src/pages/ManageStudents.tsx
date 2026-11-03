import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Search, 
  UserX, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  BookOpen, 
  Trophy,
  ExternalLink,
  Package,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles
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
  isPaid?: boolean;
}

interface PackageOption {
  id: string;
  title: string;
  price: number;
  includedExams?: string[];
  includedResources?: string[];
}

interface ResourceOption {
  id: string;
  title: string;
  type?: string;
  category?: string;
  isPaid?: boolean;
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

  // Granular Access Control State
  const [allPackages, setAllPackages] = useState<PackageOption[]>([]);
  const [allResources, setAllResources] = useState<ResourceOption[]>([]);
  const [selectedExamToUnlock, setSelectedExamToUnlock] = useState<string>('');
  const [selectedResourceToUnlock, setSelectedResourceToUnlock] = useState<string>('');
  const [updatingAccess, setUpdatingAccess] = useState(false);

  // Exam Submissions Tab State
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [filterFirstAttemptOnly, setFilterFirstAttemptOnly] = useState(true);

  // Fetch all exams, packages, and resources for access control & dropdown
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        // Fetch exams
        const qExams = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const snapExams = await getDocs(qExams);
        const list: ExamOption[] = [];
        snapExams.forEach(d => {
          list.push({ 
            id: d.id, 
            title: d.data().title, 
            category: d.data().category,
            isPaid: d.data().isPaid 
          });
        });
        setExams(list);
        if (list.length > 0) {
          setSelectedExamId(list[0].id);
          setSelectedExamToUnlock(list[0].id);
        }

        // Fetch packages
        const qPkgs = query(collection(db, 'packages'), orderBy('createdAt', 'desc'));
        const snapPkgs = await getDocs(qPkgs);
        const pkgs: PackageOption[] = [];
        snapPkgs.forEach(d => {
          pkgs.push({
            id: d.id,
            title: d.data().title,
            price: Number(d.data().price) || 0,
            includedExams: d.data().includedExams || [],
            includedResources: d.data().includedResources || []
          });
        });
        setAllPackages(pkgs);

        // Fetch resources
        const qRes = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const snapRes = await getDocs(qRes);
        const resList: ResourceOption[] = [];
        snapRes.forEach(d => {
          resList.push({
            id: d.id,
            title: d.data().title,
            type: d.data().type,
            category: d.data().category,
            isPaid: d.data().isPaid
          });
        });
        setAllResources(resList);
        if (resList.length > 0) {
          setSelectedResourceToUnlock(resList[0].id);
        }
      } catch (e) {
        console.error("Error fetching catalog in ManageStudents:", e);
      }
    };

    fetchCatalog();
  }, []);

  // Fetch submissions when an exam is selected in Tab 2
  useEffect(() => {
    if (!selectedExamId || activeTab !== 'exam') return;

    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        const q = query(collection(db, 'results'), where('examId', '==', selectedExamId));
        const snap = await getDocs(q);
        const rawList: any[] = [];
        snap.forEach(d => {
          rawList.push({ id: d.id, ...d.data() });
        });

        // 1. Sort chronologically (oldest first) to accurately identify 1st attempt
        rawList.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeA - timeB;
        });

        // 2. Identify 1st attempt vs retakes
        const seenStudents = new Set<string>();
        const taggedList = rawList.map(item => {
          const key = (item.userId && item.userId !== 'guest')
            ? item.userId
            : (item.userEmail ? item.userEmail.trim().toLowerCase() : item.userName?.trim().toLowerCase());
          const isFirst = !seenStudents.has(key);
          seenStudents.add(key);
          return { ...item, isFirstAttempt: isFirst };
        });

        // 3. Sort by merit (score desc, correct desc, time asc)
        taggedList.sort((a, b) => {
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

        setExamSubmissions(taggedList);
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

  const togglePackageAccess = async (pkgId: string) => {
    if (!foundUser) return;
    setUpdatingAccess(true);
    setError('');
    setSuccess('');
    try {
      const current = Array.isArray(foundUser.unlockedPackages) ? [...foundUser.unlockedPackages] : [];
      let updated: string[];
      let isAdded = false;
      if (current.includes(pkgId)) {
        updated = current.filter((id: string) => id !== pkgId);
      } else {
        updated = [...current, pkgId];
        isAdded = true;
      }
      await updateDoc(doc(db, 'users', foundUser.id), { unlockedPackages: updated });
      setFoundUser({ ...foundUser, unlockedPackages: updated });
      setSuccess(isAdded ? 'প্যাকেজটি সফলভাবে আনলক করা হয়েছে!' : 'প্যাকেজের অ্যাক্সেস বন্ধ করা হয়েছে!');
    } catch (err) {
      console.error(err);
      setError('প্যাকেজ অ্যাক্সেস পরিবর্তন করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingAccess(false);
    }
  };

  const handleAddExamAccess = async () => {
    if (!foundUser || !selectedExamToUnlock) return;
    setUpdatingAccess(true);
    setError('');
    setSuccess('');
    try {
      const current = Array.isArray(foundUser.unlockedExams) ? [...foundUser.unlockedExams] : [];
      if (current.includes(selectedExamToUnlock)) {
        setError('এই পরীক্ষাটি ইতোমধ্যে এই শিক্ষার্থীর জন্য আনলক করা আছে।');
        setUpdatingAccess(false);
        return;
      }
      const updated = [...current, selectedExamToUnlock];
      await updateDoc(doc(db, 'users', foundUser.id), { unlockedExams: updated });
      setFoundUser({ ...foundUser, unlockedExams: updated });
      setSuccess('নির্দিষ্ট পরীক্ষাটি সফলভাবে আনলক করা হয়েছে!');
    } catch (err) {
      console.error(err);
      setError('পরীক্ষা আনলক করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingAccess(false);
    }
  };

  const handleRemoveExamAccess = async (examId: string) => {
    if (!foundUser) return;
    setUpdatingAccess(true);
    setError('');
    setSuccess('');
    try {
      const current = Array.isArray(foundUser.unlockedExams) ? [...foundUser.unlockedExams] : [];
      const updated = current.filter((id: string) => id !== examId);
      await updateDoc(doc(db, 'users', foundUser.id), { unlockedExams: updated });
      setFoundUser({ ...foundUser, unlockedExams: updated });
      setSuccess('পরীক্ষার আনলক অ্যাক্সেস সরানো হয়েছে!');
    } catch (err) {
      console.error(err);
      setError('অ্যাক্সেস সরাতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingAccess(false);
    }
  };

  const handleAddResourceAccess = async () => {
    if (!foundUser || !selectedResourceToUnlock) return;
    setUpdatingAccess(true);
    setError('');
    setSuccess('');
    try {
      const current = Array.isArray(foundUser.unlockedResources) ? [...foundUser.unlockedResources] : [];
      if (current.includes(selectedResourceToUnlock)) {
        setError('এই রিসোর্সটি ইতোমধ্যে এই শিক্ষার্থীর জন্য আনলক করা আছে।');
        setUpdatingAccess(false);
        return;
      }
      const updated = [...current, selectedResourceToUnlock];
      await updateDoc(doc(db, 'users', foundUser.id), { unlockedResources: updated });
      setFoundUser({ ...foundUser, unlockedResources: updated });
      setSuccess('নির্দিষ্ট রিসোর্সটি সফলভাবে আনলক করা হয়েছে!');
    } catch (err) {
      console.error(err);
      setError('রিসোর্স আনলক করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingAccess(false);
    }
  };

  const handleRemoveResourceAccess = async (resourceId: string) => {
    if (!foundUser) return;
    setUpdatingAccess(true);
    setError('');
    setSuccess('');
    try {
      const current = Array.isArray(foundUser.unlockedResources) ? [...foundUser.unlockedResources] : [];
      const updated = current.filter((id: string) => id !== resourceId);
      await updateDoc(doc(db, 'users', foundUser.id), { unlockedResources: updated });
      setFoundUser({ ...foundUser, unlockedResources: updated });
      setSuccess('রিসোর্সের আনলক অ্যাক্সেস সরানো হয়েছে!');
    } catch (err) {
      console.error(err);
      setError('অ্যাক্সেস সরাতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingAccess(false);
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
        <p className="text-gray-600 dark:text-gray-400">এই পেজটি শুধুমাত্র শিক্ষকদের জন্য।</p>
      </div>
    );
  }

  // Filtered submissions in Tab 2
  const filteredSubmissions = examSubmissions.filter(sub => {
    if (filterFirstAttemptOnly && !sub.isFirstAttempt) return false;
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
            <ShieldCheck className="text-primary-light dark:text-primary-dark" size={32} /> শিক্ষার্থী ও পরীক্ষার ফলাফল ম্যানেজমেন্ট
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            শিক্ষার্থীদের ব্যক্তিগত প্রোফাইল, দেওয়া পরীক্ষার উত্তরপত্র এবং সামগ্রিক ফলাফল পরীক্ষা করুন।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            শিক্ষার্থী অনুসন্ধান ও খাতা
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
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
              <Search className="text-primary-light dark:text-primary-dark" size={20} /> শিক্ষার্থী খুঁজুন
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
                    <div className="w-16 h-16 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0">
                      {foundUser.name ? foundUser.name.charAt(0).toUpperCase() : foundUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{foundUser.name || 'শিক্ষার্থী'}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{foundUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800">
                        স্ট্যাটাস: 
                        <span className={foundUser.hasPaidAccess ? "text-green-600 font-bold" : "text-gray-500 dark:text-gray-400"}>
                          {foundUser.hasPaidAccess ? 'পেইড শিক্ষার্থী (Premium Access)' : 'ফ্রি শিক্ষার্থী (Free Plan)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={togglePremiumAccess}
                      disabled={loading}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm transition-colors disabled:opacity-70 shadow-sm ${
                        foundUser.hasPaidAccess 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {foundUser.hasPaidAccess ? (
                        <><UserX size={18} /> ভিআইপি এক্সেস বাতিল করুন</>
                      ) : (
                        <><Sparkles size={18} /> অল-ইন-ওয়ান ভিআইপি এক্সেস দিন</>
                      )}
                    </button>
                    <span className="text-[11px] text-gray-400">
                      (এটি দিলে ওয়েবসাইটের সব প্যাকেজ ও পরীক্ষা আনলক হবে)
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= Granular Access Control Section ================= */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-8">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-primary-light dark:text-primary-dark" size={22} />
                    নির্দিষ্ট প্যাকেজ ও কনটেন্ট আনলক ম্যানেজমেন্ট
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    শিক্ষার্থী যে প্যাকেজ, একক পরীক্ষা বা নির্দিষ্ট রিসোর্স কিনেছে, শুধুমাত্র সেই কনটেন্টটি এখান থেকে আনলক করে দিন। বাকি অন্য সব কিছু তার জন্য লক থাকবে।
                  </p>
                </div>

                {/* Global VIP warning if active */}
                {foundUser.hasPaidAccess && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                    <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={18} />
                    <div>
                      <p className="font-bold">মাস্টার ভিআইপি অ্যাক্সেস সক্রিয় রয়েছে!</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                        এই শিক্ষার্থীর অ্যাকাউন্টে "অল-ইন-ওয়ান ভিআইপি এক্সেস" চালু থাকায় সে ওয়েবসাইটের সব প্যাকেজ ও পরীক্ষা আনলক দেখতে পাচ্ছে। আপনি যদি তাকে শুধু নির্দিষ্ট প্যাকেজ দিতে চান, তবে উপরের "ভিআইপি এক্সেস বাতিল করুন" বাটনে চাপ দিন এবং নিচে তার নির্দিষ্ট প্যাকেজটি চালু রাখুন।
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Package-Level Unlocks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Package size={17} className="text-primary-light dark:text-primary-dark" />
                      ১. প্যাকেজভিত্তিক অ্যাক্সেস ({allPackages.length}টি প্যাকেজ তৈরি আছে)
                    </h4>
                    <span className="text-xs text-gray-500">
                      আনলক করা আছে: <strong className="text-primary-light dark:text-primary-dark">{toBengaliNumber((foundUser.unlockedPackages || []).length)}</strong>টি
                    </span>
                  </div>

                  {allPackages.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">
                      এখনও কোনো প্যাকেজ তৈরি করা হয়নি। "প্যাকেজ ও ছবি পরিচালনা" মেনু থেকে নতুন প্যাকেজ তৈরি করুন।
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allPackages.map(pkg => {
                        const isUnlocked = Array.isArray(foundUser.unlockedPackages) && foundUser.unlockedPackages.includes(pkg.id);
                        return (
                          <div 
                            key={pkg.id} 
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                              isUnlocked 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' 
                                : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800'
                            }`}
                          >
                            <div className="mb-3">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                                  {pkg.title}
                                </h5>
                                {isUnlocked ? (
                                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md shrink-0 flex items-center gap-1">
                                    <CheckCircle2 size={11} /> কেনা আছে (Active)
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md shrink-0 flex items-center gap-1">
                                    <Lock size={11} /> লকড
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-primary-light dark:text-primary-dark font-semibold">
                                ৳ {toBengaliNumber(pkg.price)}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                অন্তর্ভুক্ত: {toBengaliNumber(pkg.includedExams?.length || 0)}টি পরীক্ষা ও {toBengaliNumber(pkg.includedResources?.length || 0)}টি রিসোর্স
                              </p>
                            </div>

                            <button
                              onClick={() => togglePackageAccess(pkg.id)}
                              disabled={updatingAccess}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 ${
                                isUnlocked
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isUnlocked ? (
                                <><Unlock size={14} /> প্যাকেজ অ্যাক্সেস বন্ধ করুন</>
                              ) : (
                                <><Lock size={14} /> এই প্যাকেজটি আনলক করুন</>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* 2. Specific Individual Exam Access */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <BookOpen size={17} className="text-primary-light dark:text-primary-dark" />
                      ২. একক পরীক্ষা আনলক (Individual Exam Access)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      শিক্ষার্থী কোনো পুরো প্যাকেজ ছাড়া শুধুমাত্র একটি নির্দিষ্ট পরীক্ষা দিতে চাইলে এখান থেকে আনলক করুন।
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedExamToUnlock}
                      onChange={(e) => setSelectedExamToUnlock(e.target.value)}
                      className="flex-grow p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                    >
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title} {ex.category ? `(${ex.category})` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAddExamAccess}
                      disabled={updatingAccess || !selectedExamToUnlock}
                      className="px-5 py-2.5 bg-primary-light hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-60"
                    >
                      <Plus size={15} /> পরীক্ষা আনলক করুন
                    </button>
                  </div>

                  {/* Unlocked Exams List */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                      সরাসরি আনলক করা একক পরীক্ষাসমূহ ({toBengaliNumber((foundUser.unlockedExams || []).length)}টি):
                    </span>
                    {(foundUser.unlockedExams || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800/30 p-2.5 rounded-lg">
                        সরাসরি কোনো একক পরীক্ষা আনলক করা নেই।
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(foundUser.unlockedExams || []).map((examId: string) => {
                          const examObj = exams.find(e => e.id === examId);
                          return (
                            <span 
                              key={examId}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-medium"
                            >
                              <BookOpen size={13} />
                              <span className="line-clamp-1 max-w-[200px]">{examObj?.title || examId}</span>
                              <button
                                onClick={() => handleRemoveExamAccess(examId)}
                                disabled={updatingAccess}
                                title="লক করুন"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 p-0.5 rounded-md transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* 3. Specific Individual Resource Access */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <FileText size={17} className="text-primary-light dark:text-primary-dark" />
                      ৩. একক পিডিএফ / রিসোর্স আনলক (Individual Resource Access)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      শিক্ষার্থী কোনো নির্দিষ্ট লেকচার শিট বা পিডিএফ দেখতে চাইলে এখান থেকে আনলক করুন।
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedResourceToUnlock}
                      onChange={(e) => setSelectedResourceToUnlock(e.target.value)}
                      className="flex-grow p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                    >
                      {allResources.map(res => (
                        <option key={res.id} value={res.id}>
                          {res.title} {res.category ? `(${res.category})` : ''} - {res.type || 'পিডিএফ'}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAddResourceAccess}
                      disabled={updatingAccess || !selectedResourceToUnlock}
                      className="px-5 py-2.5 bg-primary-light hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-60"
                    >
                      <Plus size={15} /> রিসোর্স আনলক করুন
                    </button>
                  </div>

                  {/* Unlocked Resources List */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                      সরাসরি আনলক করা একক রিসোর্সসমূহ ({toBengaliNumber((foundUser.unlockedResources || []).length)}টি):
                    </span>
                    {(foundUser.unlockedResources || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800/30 p-2.5 rounded-lg">
                        সরাসরি কোনো একক রিসোর্স আনলক করা নেই।
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(foundUser.unlockedResources || []).map((resId: string) => {
                          const resObj = allResources.find(r => r.id === resId);
                          return (
                            <span 
                              key={resId}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-medium"
                            >
                              <FileText size={13} />
                              <span className="line-clamp-1 max-w-[200px]">{resObj?.title || resId}</span>
                              <button
                                onClick={() => handleRemoveResourceAccess(resId)}
                                disabled={updatingAccess}
                                title="লক করুন"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 p-0.5 rounded-md transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Exam History & Answers */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={20} className="text-primary-light dark:text-primary-dark" /> এই শিক্ষার্থীর দেওয়া পরীক্ষাসমূহ ({userResults.length}টি)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">শিক্ষার্থীর কোনো উত্তরপত্রে ভুল হলে বা ব্যাখ্যা দেখতে "খাতা দেখুন" লিংকে চাপ দিন।</p>
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

            {/* Filter Search & Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  মোট পরীক্ষার্থী: {toBengaliNumber(filteredSubmissions.length)} জন
                </span>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={filterFirstAttemptOnly}
                    onChange={(e) => setFilterFirstAttemptOnly(e.target.checked)}
                    className="rounded text-primary-light focus:ring-primary-light"
                  />
                  <span>শুধুমাত্র ১ম প্রচেষ্টা (অফিসিয়াল মেধা তালিকা)</span>
                </label>
              </div>

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
