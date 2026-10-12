import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowRight, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExamResult {
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

export default function MyExams() {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'results'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const fetchedResults: ExamResult[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          fetchedResults.push({ id: doc.id, ...data } as ExamResult);
        });

        // Sort by submittedAt descending (newest first)
        fetchedResults.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeB - timeA;
        });

        setResults(fetchedResults);
      } catch (error) {
        console.error("Error fetching exams history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined || num === '' || Number.isNaN(Number(num))) {
      return '০';
    }
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'অজানা সময়';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    // Format to Bengali string
    let formatted = new Intl.DateTimeFormat('bn-BD', options).format(date);
    return formatted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileText size={32} className="text-primary-light dark:text-primary-dark" /> 
          আমার পরীক্ষাগুলো
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          এখানে আপনার দেওয়া সকল পরীক্ষার তালিকা এবং ফলাফল দেওয়া হলো।
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">আপনি এখনো কোনো পরীক্ষা দেননি!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            পরীক্ষা দিয়ে নিজেকে যাচাই করতে আমাদের এক্সাম সেকশনে যান।
          </p>
          <Link 
            to="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-light text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            পরীক্ষা দিন
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, idx) => {
            let score = Number(result.stats?.totalScore);
            let outOf = Number(result.stats?.outOf);

            if (Number.isNaN(score)) {
              const c = Number(result.stats?.correct) || 0;
              const w = Number(result.stats?.wrong) || 0;
              score = Number(((c * 1) - (w * 0.25)).toFixed(2));
            }

            if (Number.isNaN(outOf) || outOf <= 0) {
              const totalQ = (Number(result.stats?.correct) || 0) + (Number(result.stats?.wrong) || 0) + (Number(result.stats?.skipped) || 0);
              outOf = totalQ > 0 ? totalQ : 100;
            }

            return (
              <Link 
                key={result.id} 
                to={`/result/${result.id}`}
                className="block bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-xs font-bold bg-primary-light/10 text-primary-light px-3 py-1 rounded-full">
                        পরীক্ষা নং {toBengaliNumber(results.length - idx)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(result.submittedAt)}
                      </span>
                      <Link
                        to={`/leaderboard/${result.examId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                      >
                        <Award size={12} /> মেধা তালিকা
                      </Link>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                      {result.examTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1">
                        <Award size={14} /> প্রাপ্ত নম্বর
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {toBengaliNumber(score)} 
                        <span className="text-base font-normal text-gray-500"> / {toBengaliNumber(outOf)}</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-primary-light group-hover:text-white transition-colors">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
