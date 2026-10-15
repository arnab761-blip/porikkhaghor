import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, CheckCircle2, HelpCircle, Search, User } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { MathText } from '../components/MathText';
import QuestionDiscussion from '../components/forum/QuestionDiscussion';

interface DoubtGroup {
  key: string; // `${examId}_${questionIndex}`
  examId: string;
  examTitle: string;
  questionIndex: number;
  questionText: string;
  totalComments: number;
  hasTeacherReply: boolean;
  latestTeacherReply?: string;
  firstStudentName: string;
  firstStudentDoubt: string;
  lastActivityAt: any;
  studentCommentsCount: number;
}

export default function TeacherDoubts() {
  const { user, role, loading: authLoading } = useAuth();
  const [doubtGroups, setDoubtGroups] = useState<DoubtGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'replied' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const isTeacher = role === 'owner' || role === 'assistant';

  useEffect(() => {
    if (!user || !isTeacher) return;

    // Listen to all doubts in the system
    const q = query(collection(db, 'doubts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grouped: Record<string, {
        comments: any[];
        examId: string;
        examTitle: string;
        questionIndex: number;
        questionText: string;
      }> = {};

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const key = `${data.examId}_${data.questionIndex}`;

        if (!grouped[key]) {
          grouped[key] = {
            comments: [],
            examId: data.examId,
            examTitle: data.examTitle || 'পরীক্ষা',
            questionIndex: data.questionIndex,
            questionText: data.questionText || '',
          };
        }

        grouped[key].comments.push({
          id: docSnap.id,
          ...data
        });
      });

      const list: DoubtGroup[] = Object.keys(grouped).map(key => {
        const group = grouped[key];
        
        // Sort comments chronologically
        group.comments.sort((a, b) => {
          const tA = a.createdAt?.toMillis() || 0;
          const tB = b.createdAt?.toMillis() || 0;
          return tA - tB;
        });

        const studentComments = group.comments.filter(
          c => c.userRole !== 'owner' && c.userRole !== 'assistant'
        );
        const teacherComments = group.comments.filter(
          c => c.userRole === 'owner' || c.userRole === 'assistant'
        );

        const firstStudent = studentComments[0] || group.comments[0];
        const lastTeacher = teacherComments[teacherComments.length - 1];
        const lastComment = group.comments[group.comments.length - 1];

        return {
          key,
          examId: group.examId,
          examTitle: group.examTitle,
          questionIndex: group.questionIndex,
          questionText: group.questionText,
          totalComments: group.comments.length,
          hasTeacherReply: teacherComments.length > 0,
          latestTeacherReply: lastTeacher?.text,
          firstStudentName: firstStudent?.userName || 'শিক্ষার্থী',
          firstStudentDoubt: firstStudent?.text || '',
          lastActivityAt: lastComment?.createdAt,
          studentCommentsCount: studentComments.length
        };
      });

      // Sort: pending first, then by latest activity date descending
      list.sort((a, b) => {
        if (a.hasTeacherReply !== b.hasTeacherReply) {
          return a.hasTeacherReply ? 1 : -1; // Unanswered first
        }
        const timeA = a.lastActivityAt?.toMillis() || 0;
        const timeB = b.lastActivityAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setDoubtGroups(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isTeacher]);

  if (authLoading || loading) {
    return <div className="p-8 text-center text-lg">শিক্ষার্থীদের ডাউটসমূহ লোড হচ্ছে...</div>;
  }

  if (!user || !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined) return '০';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const pendingCount = doubtGroups.filter(d => !d.hasTeacherReply).length;
  const repliedCount = doubtGroups.filter(d => d.hasTeacherReply).length;

  const filteredList = doubtGroups.filter(d => {
    if (filter === 'pending' && d.hasTeacherReply) return false;
    if (filter === 'replied' && !d.hasTeacherReply) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.examTitle.toLowerCase().includes(q);
      const matchText = d.questionText.toLowerCase().includes(q);
      const matchStudent = d.firstStudentName.toLowerCase().includes(q);
      const matchDoubt = d.firstStudentDoubt.toLowerCase().includes(q);
      if (!matchTitle && !matchText && !matchStudent && !matchDoubt) return false;
    }

    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <MessageSquare size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark">
                শিক্ষার্থীদের ডাউট ও প্রশ্নোত্তর
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                শিক্ষার্থীরা যেসব প্রশ্নে ডাউট জিজ্ঞেস করেছে, সেগুলোতে সরাসরি উত্তর দিয়ে সমাধান করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-center">
            <span className="text-xs text-amber-700 dark:text-amber-400 block font-medium">উত্তরের অপেক্ষায়</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {toBengaliNumber(pendingCount)} টি
            </span>
          </div>
          <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/60 rounded-xl text-center">
            <span className="text-xs text-green-700 dark:text-green-400 block font-medium">উত্তর সম্পন্ন</span>
            <span className="text-xl font-black text-green-600 dark:text-green-400">
              {toBengaliNumber(repliedCount)} টি
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পরীক্ষার নাম, শিক্ষার্থী বা প্রশ্ন খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-sm font-medium w-full sm:w-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              filter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            অপেক্ষমাণ ({toBengaliNumber(pendingCount)})
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              filter === 'replied'
                ? 'bg-green-600 text-white shadow-xs font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            উত্তর দেওয়া হয়েছে ({toBengaliNumber(repliedCount)})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-xs font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            সকল ({toBengaliNumber(doubtGroups.length)})
          </button>
        </div>
      </div>

      {/* Doubts List */}
      {filteredList.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <HelpCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400">
            {filter === 'pending' 
              ? 'দারুণ! কোনো ডাউট অপেক্ষমাণ নেই, সবগুলোতে উত্তর দেওয়া হয়েছে।'
              : 'কোনো ডাউট বা প্রশ্ন পাওয়া যায়নি।'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            শিক্ষার্থীরা পরীক্ষা দেওয়ার পর কোনো প্রশ্নে ডাউট আলোচনা করলে তা স্বয়ংক্রিয়ভাবে এখানে চলে আসবে।
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredList.map((group) => {
            const dateStr = group.lastActivityAt?.toDate
              ? group.lastActivityAt.toDate().toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'সম্প্রতি';

            return (
              <div
                key={group.key}
                className={`bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border transition-all ${
                  !group.hasTeacherReply
                    ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200 dark:ring-amber-900/30'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark rounded-full">
                      {group.examTitle}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                      প্রশ্ন নং: {toBengaliNumber(group.questionIndex + 1)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1">
                      <User size={12} /> {group.firstStudentName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {group.hasTeacherReply ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                        <CheckCircle2 size={14} /> উত্তর দেওয়া হয়েছে
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                        <Clock size={14} /> আপনার উত্তরের অপেক্ষায়
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{dateStr}</span>
                  </div>
                </div>

                {/* Main Question Text if available */}
                {group.questionText && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-400 block mb-1">মূল প্রশ্ন:</span>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      <MathText text={group.questionText} />
                    </p>
                  </div>
                )}

                {/* Student's initial Doubt */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    শিক্ষার্থীর ডাউট / জিজ্ঞাসা:
                  </div>
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-sm text-gray-800 dark:text-gray-200">
                    <MathText text={group.firstStudentDoubt} />
                  </div>
                </div>

                {/* Teacher's latest reply if already replied */}
                {group.latestTeacherReply && (
                  <div className="mb-4 p-3.5 bg-green-50/70 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                        আপনার উত্তর 🎓
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <MathText text={group.latestTeacherReply} />
                    </p>
                  </div>
                )}

                {/* Discussion Thread and Reply Input */}
                <QuestionDiscussion
                  examId={group.examId}
                  questionIndex={group.questionIndex}
                  examTitle={group.examTitle}
                  questionText={group.questionText}
                />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
