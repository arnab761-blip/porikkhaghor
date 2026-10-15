import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MathText } from '../components/MathText';
import QuestionDiscussion from '../components/forum/QuestionDiscussion';

interface DoubtItem {
  id: string;
  examId: string;
  examTitle: string;
  questionIndex: number;
  questionText: string;
  userId: string;
  userName: string;
  userRole?: string;
  text: string;
  createdAt: any;
  hasTeacherReply?: boolean;
  latestTeacherReply?: string;
  allCommentsCount?: number;
}

export default function MyDoubts() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'replied' | 'pending'>('all');

  useEffect(() => {
    if (!user) return;

    // Fetch user's own doubts
    const q = query(
      collection(db, 'doubts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userQuestions: Record<string, DoubtItem> = {};

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const key = `${data.examId}_${data.questionIndex}`;
        
        // Group by exam and questionIndex to show unique questions asked
        if (!userQuestions[key] || (data.createdAt?.toMillis() || 0) > (userQuestions[key].createdAt?.toMillis() || 0)) {
          userQuestions[key] = {
            id: docSnap.id,
            examId: data.examId,
            examTitle: data.examTitle || 'পরীক্ষা',
            questionIndex: data.questionIndex,
            questionText: data.questionText || '',
            userId: data.userId,
            userName: data.userName,
            userRole: data.userRole,
            text: data.text,
            createdAt: data.createdAt,
          };
        }
      });

      const doubtList = Object.values(userQuestions);

      // Now for each question, check if there is a teacher reply in the doubts collection
      for (const item of doubtList) {
        try {
          const repliesQuery = query(
            collection(db, 'doubts'),
            where('examId', '==', item.examId),
            where('questionIndex', '==', item.questionIndex)
          );
          const repliesSnap = await getDocs(repliesQuery);
          let teacherReply: string | undefined = undefined;
          let count = 0;

          repliesSnap.docs.forEach(rDoc => {
            count++;
            const rData = rDoc.data();
            if (rData.userRole === 'owner' || rData.userRole === 'assistant') {
              teacherReply = rData.text;
            }
          });

          item.hasTeacherReply = !!teacherReply;
          item.latestTeacherReply = teacherReply;
          item.allCommentsCount = count;
        } catch (e) {
          console.error("Error checking replies:", e);
        }
      }

      // Sort by date descending
      doubtList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setDoubts(doubtList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-lg">আপনার ডাউট ও প্রশ্নগুলো লোড হচ্ছে...</div>;

  const filteredDoubts = doubts.filter(d => {
    if (filter === 'replied') return d.hasTeacherReply;
    if (filter === 'pending') return !d.hasTeacherReply;
    return true;
  });

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined) return '০';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark flex items-center gap-3">
            <MessageSquare size={32} className="text-accent-light dark:text-accent-dark" /> আমার প্রশ্ন ও ডাউটসমূহ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            বিভিন্ন পরীক্ষায় আপনার করা সমস্ত ডাউট এবং শিক্ষকদের দেওয়া উত্তরগুলো এখানে সংরক্ষিত আছে।
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-sm font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            সকল ({toBengaliNumber(doubts.length)})
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'replied'
                ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            উত্তর দেওয়া হয়েছে ({toBengaliNumber(doubts.filter(d => d.hasTeacherReply).length)})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'pending'
                ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            অপেক্ষমাণ ({toBengaliNumber(doubts.filter(d => !d.hasTeacherReply).length)})
          </button>
        </div>
      </div>

      {/* Doubts List */}
      {filteredDoubts.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <HelpCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'আপনি এখনো কোনো ডাউট বা প্রশ্ন করেননি।' : 'এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            পরীক্ষা শেষে ফলাফল পেজে যেকোনো প্রশ্নের নিচে "ডাউট ক্লিয়ারিং / আলোচনা" অপশন থেকে আপনার প্রশ্ন করতে পারেন।
          </p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-primary-light text-white rounded-xl font-bold hover:bg-primary-dark transition-all text-sm"
          >
            পরীক্ষা দিন <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDoubts.map((doubt, index) => {
            const dateStr = doubt.createdAt?.toDate
              ? doubt.createdAt.toDate().toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'সম্প্রতি';

            return (
              <div
                key={doubt.id || index}
                className={`bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border transition-all ${
                  doubt.hasTeacherReply
                    ? 'border-green-200 dark:border-green-900/50'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark rounded-full">
                      {doubt.examTitle}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                      প্রশ্ন নং: {toBengaliNumber(doubt.questionIndex + 1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {doubt.hasTeacherReply ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                        <CheckCircle2 size={14} /> শিক্ষকের উত্তর যুক্ত হয়েছে
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock size={14} /> শিক্ষকের উত্তরের অপেক্ষায়
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{dateStr}</span>
                  </div>
                </div>

                {/* Main Question Text if available */}
                {doubt.questionText && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-400 block mb-1">মূল প্রশ্ন:</span>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      <MathText text={doubt.questionText} />
                    </p>
                  </div>
                )}

                {/* Student's Doubt Query */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-primary-light dark:text-primary-dark mb-1">
                    আপনার ডাউট / জিজ্ঞাসা:
                  </div>
                  <div className="p-3 bg-accent-light/5 dark:bg-accent-dark/5 border border-accent-light/20 dark:border-accent-dark/20 rounded-xl text-sm text-gray-800 dark:text-gray-200">
                    <MathText text={doubt.text} />
                  </div>
                </div>

                {/* Teacher's Reply Highlight if exists */}
                {doubt.latestTeacherReply && (
                  <div className="mb-4 p-4 bg-green-50/70 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800/60">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                        শিক্ষকের উত্তর 🎓
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      <MathText text={doubt.latestTeacherReply} />
                    </p>
                  </div>
                )}

                {/* Interactive Discussion Section */}
                <QuestionDiscussion
                  examId={doubt.examId}
                  questionIndex={doubt.questionIndex}
                  examTitle={doubt.examTitle}
                  questionText={doubt.questionText}
                />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
