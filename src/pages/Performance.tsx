import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Performance() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, average: '0', highest: 0 });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'results'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        let totalExams = snapshot.size;
        let highestScore = -Infinity;
        let totalPercentage = 0;
        const resultsList: any[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          resultsList.push({ id: doc.id, ...data });
          
          if (data.stats) {
            let score = Number(data.stats.totalScore);
            let outOf = Number(data.stats.outOf);
            if (Number.isNaN(score)) {
              const c = Number(data.stats.correct) || 0;
              const w = Number(data.stats.wrong) || 0;
              score = Number(((c * 1) - (w * 0.25)).toFixed(2));
            }
            if (Number.isNaN(outOf) || outOf <= 0) {
              const totalQ = (Number(data.stats.correct) || 0) + (Number(data.stats.wrong) || 0) + (Number(data.stats.skipped) || 0);
              outOf = totalQ > 0 ? totalQ : 100;
            }
            const percentage = (score / outOf) * 100;
            
            if (score > highestScore) highestScore = score;
            totalPercentage += percentage;
          }
        });
        
        if (highestScore === -Infinity) highestScore = 0;
        const average = totalExams > 0 ? (totalPercentage / totalExams).toFixed(1) : '0';
        
        // Sort chronologically (oldest to newest) to show a left-to-right trend
        resultsList.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeA - timeB;
        });

        setRecentResults(resultsList.slice(-7)); // Last 7 exams
        
        setStats({
          total: totalExams,
          average,
          highest: highestScore
        });
      } catch (error) {
        console.error("Error fetching performance stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined || num === '' || Number.isNaN(Number(num))) {
      return '০';
    }
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-10 px-4"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent-light/10 dark:bg-accent-dark/10 rounded-xl text-accent-light dark:text-accent-dark">
          <BarChart3 size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">পারফরম্যান্স অ্যানালাইসিস</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">আপনার পরীক্ষার ওভারঅল অগ্রগতি এবং দুর্বলতা</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">মোট পরীক্ষা</p>
            <h3 className="text-2xl font-bold">{toBengaliNumber(stats.total)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">গড় মার্কস</p>
            <h3 className="text-2xl font-bold">{toBengaliNumber(stats.average)}%</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">সর্বোচ্চ মার্কস</p>
            <h3 className="text-2xl font-bold">{toBengaliNumber(stats.highest)}</h3>
          </div>
        </div>
      </div>

      {recentResults.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 md:p-8 mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">সাম্প্রতিক পরীক্ষার ফলাফল (ট্রেন্ড)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">মার্কস অনুযায়ী স্তম্ভের উচ্চতা ও রঙ স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়</p>
            </div>

            {/* Performance Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>৭০%+ (চমৎকার - সবুজ)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>৪০%-৬৯% (মধ্যম - হলুদ)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>৪০% এর কম (দুর্বল - লাল)</span>
              </div>
            </div>
          </div>

          {/* Chart Wrapper with Y-Axis */}
          <div className="relative pt-6 pb-2">
            {/* Horizontal Grid Lines & Y-Axis Labels */}
            <div className="absolute inset-x-0 top-6 bottom-14 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400 pl-8">
              {[100, 75, 50, 25, 0].map((val) => (
                <div key={val} className="flex items-center w-full">
                  <span className="w-8 -ml-8 text-right pr-2 shrink-0 select-none">{toBengaliNumber(val)}%</span>
                  <div className="w-full border-b border-gray-100 dark:border-gray-800"></div>
                </div>
              ))}
            </div>

            {/* Bars Container */}
            <div className="h-56 md:h-64 flex items-end justify-around gap-2 md:gap-4 pl-8 relative z-10">
              {recentResults.map((res, i) => {
                let score = Number(res.stats?.totalScore);
                let outOf = Number(res.stats?.outOf);
                if (Number.isNaN(score)) {
                  const c = Number(res.stats?.correct) || 0;
                  const w = Number(res.stats?.wrong) || 0;
                  score = Number(((c * 1) - (w * 0.25)).toFixed(2));
                }
                if (Number.isNaN(outOf) || outOf <= 0) {
                  const totalQ = (Number(res.stats?.correct) || 0) + (Number(res.stats?.wrong) || 0) + (Number(res.stats?.skipped) || 0);
                  outOf = totalQ > 0 ? totalQ : 100;
                }
                const rawPercentage = (score / outOf) * 100;
                const displayPercentage = Math.round(rawPercentage);
                const isNegative = score < 0;

                // Dynamic Color Coding based on performance:
                // High (>= 70%): Green
                // Medium (40% - 69%): Yellow
                // Low (< 40% or negative): Red
                let colorClass = 'from-emerald-500 to-green-600 border-emerald-400';
                let statusText = 'চমৎকার পারফরম্যান্স';

                if (isNegative || rawPercentage < 40) {
                  colorClass = 'from-rose-500 to-red-600 border-rose-400';
                  statusText = isNegative ? 'মাইনাস মার্কিং' : 'বিশেষ মনোযোগ প্রয়োজন';
                } else if (rawPercentage < 70) {
                  colorClass = 'from-amber-400 to-yellow-500 border-amber-400';
                  statusText = 'সন্তোষজনক / মধ্যম';
                }

                // Minimum height so low or negative scores are still visible and clickable
                const barHeightPercent = isNegative 
                  ? 6 
                  : Math.min(100, Math.max(6, rawPercentage));

                return (
                  <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end relative">
                    {/* Hover Floating Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute -top-12 z-20 flex flex-col items-center">
                      <div className="bg-gray-900/95 dark:bg-gray-800/95 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center gap-0.5 border border-gray-700">
                        <span className="font-bold">
                          {toBengaliNumber(score)} / {toBengaliNumber(outOf)} ({toBengaliNumber(displayPercentage)}%)
                        </span>
                        <span className="text-[10px] text-gray-300">{statusText}</span>
                      </div>
                      <div className="w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 -mt-1"></div>
                    </div>

                    {/* Animated Vertical Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeightPercent}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                      className={`w-full max-w-[36px] md:max-w-[54px] bg-gradient-to-t ${colorClass} rounded-t-lg transition-transform group-hover:scale-105 shadow-sm relative cursor-pointer flex justify-center items-start pt-1`}
                    >
                      {/* Score Badge inside bar when high enough */}
                      {barHeightPercent > 25 && (
                        <span className="text-[10px] font-bold text-white drop-shadow-xs opacity-90 group-hover:opacity-100 hidden sm:inline">
                          {toBengaliNumber(displayPercentage)}%
                        </span>
                      )}
                    </motion.div>

                    {/* Exam Title Below Bar */}
                    <div 
                      className="mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate w-full text-center px-1 font-medium group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors" 
                      title={res.examTitle}
                    >
                      {res.examTitle.length > 10 ? res.examTitle.slice(0, 10) + '...' : res.examTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center">
          <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BarChart3 size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">অ্যানালাইসিস প্রস্তুত হচ্ছে...</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
            পর্যাপ্ত ডেটা পাওয়া যায়নি। আরো কিছু পরীক্ষা দিলে এখানে আপনার বিষয়ভিত্তিক দুর্বলতা এবং গ্রাফিক্যাল রিপোর্ট দেখতে পাবেন!
          </p>
          <Link 
            to="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-light text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            পরীক্ষা দিতে থাকুন
          </Link>
        </div>
      )}
    </motion.div>
  );
}
