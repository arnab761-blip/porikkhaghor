import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Award, 
  ArrowLeft, 
  Search, 
  Users, 
  TrendingUp, 
  FileText,
  Trophy
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ResultEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  stats: {
    totalScore: number;
    outOf: number;
    correct: number;
    wrong: number;
    skipped: number;
  };
  submittedAt: any;
}

export default function Leaderboard() {
  const { examId } = useParams();
  const { user, role } = useAuth();
  const { t, language, toLangNumber, formatDate } = useLanguage();
  const [examTitle, setExamTitle] = useState('');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isTeacher = role === 'owner' || role === 'assistant';

  useEffect(() => {
    if (!examId) return;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // 1. Fetch Exam title
        const examSnap = await getDoc(doc(db, 'exams', examId));
        if (examSnap.exists()) {
          setExamTitle(examSnap.data().title || 'পরীক্ষা');
        }

        // 2. Fetch all submissions for this exam
        const q = query(collection(db, 'results'), where('examId', '==', examId));
        const snap = await getDocs(q);

        const rawList: ResultEntry[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data();
          rawList.push({
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || 'শিক্ষার্থী',
            userEmail: data.userEmail || '',
            stats: data.stats || { totalScore: 0, outOf: 100, correct: 0, wrong: 0, skipped: 0 },
            submittedAt: data.submittedAt
          });
        });

        // 3. Sort chronologically (oldest first) to identify the first attempt
        rawList.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
          return timeA - timeB;
        });

        // 4. Keep ONLY the FIRST attempt for each unique student (retakes are ignored)
        const firstAttemptsMap = new Map<string, ResultEntry>();
        for (const entry of rawList) {
          const studentKey = (entry.userId && entry.userId !== 'guest')
            ? entry.userId
            : (entry.userEmail ? entry.userEmail.trim().toLowerCase() : entry.userName.trim().toLowerCase());

          if (!firstAttemptsMap.has(studentKey)) {
            firstAttemptsMap.set(studentKey, entry);
          }
        }

        const uniqueFirstAttempts = Array.from(firstAttemptsMap.values());

        // 5. Sort unique 1st attempts by merit (score desc, correct desc, wrong asc, time asc)
        uniqueFirstAttempts.sort((a, b) => {
          const scoreA = Number(a.stats?.totalScore) || 0;
          const scoreB = Number(b.stats?.totalScore) || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;

          const corA = Number(a.stats?.correct) || 0;
          const corB = Number(b.stats?.correct) || 0;
          if (corB !== corA) return corB - corA;

          const wrgA = Number(a.stats?.wrong) || 0;
          const wrgB = Number(b.stats?.wrong) || 0;
          if (wrgA !== wrgB) return wrgA - wrgB;

          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeA - timeB;
        });

        setResults(uniqueFirstAttempts);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [examId]);

  // Stats calculation
  const totalStudents = results.length;
  const highestScore = totalStudents > 0 ? results[0].stats?.totalScore : 0;
  const averageScore = totalStudents > 0 
    ? (results.reduce((acc, curr) => acc + (Number(curr.stats?.totalScore) || 0), 0) / totalStudents).toFixed(2)
    : 0;

  // Filtered list
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      (r.userName && r.userName.toLowerCase().includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q))
    );
  }, [results, searchQuery]);

  // Current user's rank
  const myRankIndex = user ? results.findIndex(r => r.userId === user.uid) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">{t('loading')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto pb-16 px-4"
    >
      {/* Top Breadcrumb / Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/exams" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
        >
          <ArrowLeft size={16} /> {language === 'bn' ? 'সকল পরীক্ষায় ফিরে যান' : 'Back to All Exams'}
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-light to-primary-dark text-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <Trophy size={14} className="text-amber-300" /> {language === 'bn' ? 'অফিসিয়াল মেধাতালিকা' : 'Official Merit List'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
            {examTitle || t('leaderboardHeading')}
          </h1>
          <p className="text-white/80 text-sm">
            {language === 'bn' 
              ? 'প্রতিটি শিক্ষার্থীর শুধুমাত্র প্রথম পরীক্ষার ফলাফল (First Attempt) নিয়ে তৈরি অফিসিয়াল মেধা তালিকা। পুনরায় দেওয়া পরীক্ষা (Retake) মেধা তালিকায় যুক্ত হবে না।' 
              : 'Official merit list based on each student\'s first attempt. Retakes are not counted towards the official rank.'}
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">{language === 'bn' ? 'মোট পরীক্ষার্থী' : 'Total Examinees'}</span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {toLangNumber(totalStudents)} {language === 'bn' ? 'জন' : ''}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">{language === 'bn' ? 'সর্বোচ্চ নম্বর' : 'Highest Score'}</span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {toLangNumber(highestScore)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">{language === 'bn' ? 'গড় নম্বর (Average)' : 'Average Score'}</span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {toLangNumber(averageScore)}
            </div>
          </div>
        </div>
      </div>

      {/* User's Own Rank Banner (if student took this exam) */}
      {myRank && (
        <div className="mb-8 p-5 bg-amber-500/10 dark:bg-amber-500/20 border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
              #{toLangNumber(myRank)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                {language === 'bn' ? `আপনার মেধা অবস্থান: ${toLangNumber(myRank)} নম্বর স্থান` : `Your Merit Position: Rank #${toLangNumber(myRank)}`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn' 
                  ? `মোট ${toLangNumber(totalStudents)} জন পরীক্ষার্থীর মধ্যে আপনার প্রাপ্ত স্কোর: ${toLangNumber(results[myRankIndex].stats?.totalScore)}` 
                  : `Score: ${toLangNumber(results[myRankIndex].stats?.totalScore)} among ${toLangNumber(totalStudents)} students`}
              </p>
            </div>
          </div>

          <Link
            to={`/result/${results[myRankIndex].id}`}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <FileText size={16} /> {language === 'bn' ? 'নিজের খাতা ও ব্যাখ্যা দেখুন' : 'View Script & Solutions'}
          </Link>
        </div>
      )}

      {/* Top 3 Podium */}
      {results.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="order-2 sm:order-1 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm relative pt-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-sm shadow">
              {toLangNumber(2)}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{results[1].userName}</h4>
            <div className="text-2xl font-bold text-slate-600 dark:text-slate-300 my-1">
              {toLangNumber(results[1].stats?.totalScore)} <span className="text-xs font-normal text-gray-400">/ {toLangNumber(results[1].stats?.outOf)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {language === 'bn' ? 'সঠিক' : 'Correct'}: {toLangNumber(results[1].stats?.correct)} | {language === 'bn' ? 'ভুল' : 'Wrong'}: {toLangNumber(results[1].stats?.wrong)}
            </div>
          </div>

          {/* 1st Place (Champion) */}
          <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900 p-6 rounded-3xl border-2 border-amber-400 text-center shadow-md relative pt-9 transform sm:-translate-y-2">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center text-base shadow-md">
              👑 {toLangNumber(1)}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">{results[0].userName}</h4>
            <div className="text-3xl font-extrabold text-amber-500 my-1">
              {toLangNumber(results[0].stats?.totalScore)} <span className="text-xs font-normal text-gray-400">/ {toLangNumber(results[0].stats?.outOf)}</span>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              {language === 'bn' ? 'সঠিক' : 'Correct'}: {toLangNumber(results[0].stats?.correct)} | {language === 'bn' ? 'ভুল' : 'Wrong'}: {toLangNumber(results[0].stats?.wrong)}
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm relative pt-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700/60 text-white font-bold flex items-center justify-center text-sm shadow">
              {toLangNumber(3)}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{results[2].userName}</h4>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-400 my-1">
              {toLangNumber(results[2].stats?.totalScore)} <span className="text-xs font-normal text-gray-400">/ {toLangNumber(results[2].stats?.outOf)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {language === 'bn' ? 'সঠিক' : 'Correct'}: {toLangNumber(results[2].stats?.correct)} | {language === 'bn' ? 'ভুল' : 'Wrong'}: {toLangNumber(results[2].stats?.wrong)}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Table Header */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="text-primary-light dark:text-primary-dark" size={22} /> {t('leaderboardHeading')} ({toLangNumber(filteredResults.length)} {language === 'bn' ? 'জন' : ''})
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStudentPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
            />
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">
            {t('noSubmissionsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-medium text-xs">
                  <th className="pb-3 text-center w-16">{t('rankHeader')}</th>
                  <th className="pb-3">{t('studentHeader')}</th>
                  <th className="pb-3 text-center">{t('scoreHeader')}</th>
                  <th className="pb-3 text-center hidden md:table-cell">{t('correctWrongHeader')}</th>
                  <th className="pb-3 text-right hidden sm:table-cell">{t('submittedAtHeader')}</th>
                  {isTeacher && <th className="pb-3 text-right">{language === 'bn' ? 'খাতা' : 'Script'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredResults.map((item, index) => {
                  const rank = index + 1;
                  const isMe = user && item.userId === user.uid;
                  const formattedTime = item.submittedAt?.toDate 
                    ? formatDate(item.submittedAt.toDate(), {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : (language === 'bn' ? 'এখনই' : 'Just now');

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isMe 
                          ? 'bg-amber-500/10 dark:bg-amber-500/20 font-semibold' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-400 text-amber-950 rounded-full font-bold text-xs shadow-sm">
                            {toLangNumber(1)}
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-300 text-slate-800 rounded-full font-bold text-xs shadow-sm">
                            {toLangNumber(2)}
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-700/60 text-white rounded-full font-bold text-xs shadow-sm">
                            {toLangNumber(3)}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {toLangNumber(rank)}
                          </span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {item.userName}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-primary-light text-white font-bold px-2 py-0.5 rounded-full">
                              {language === 'bn' ? 'আপনি' : 'You'}
                            </span>
                          )}
                        </div>
                        {isTeacher && item.userEmail && (
                          <span className="text-xs text-gray-400 block">{item.userEmail}</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-4 text-center font-bold text-primary-light dark:text-primary-dark">
                        {toLangNumber(item.stats?.totalScore)}
                        <span className="text-xs text-gray-400 font-normal"> / {toLangNumber(item.stats?.outOf)}</span>
                      </td>

                      {/* Correct / Wrong */}
                      <td className="py-4 text-center hidden md:table-cell text-xs whitespace-nowrap leading-normal">
                        <span className="text-green-600 font-semibold inline-block">{toLangNumber(item.stats?.correct)} {language === 'bn' ? 'সঠিক' : 'Correct'}</span>
                        <span className="text-gray-300 dark:text-gray-700 mx-1.5">|</span>
                        <span className="text-red-500 font-semibold inline-block">{toLangNumber(item.stats?.wrong)} {language === 'bn' ? 'ভুল' : 'Wrong'}</span>
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 text-right hidden sm:table-cell text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formattedTime}
                      </td>

                      {/* Teacher view student answer sheet */}
                      {isTeacher && (
                        <td className="py-4 text-right">
                          <Link 
                            to={`/result/${item.id}`}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-primary-light dark:text-primary-dark font-medium transition-colors"
                          >
                            <FileText size={12} /> {language === 'bn' ? 'দেখুন' : 'View'}
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
