import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, Award, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import QuestionDiscussion from '../components/forum/QuestionDiscussion';
import { MathText } from '../components/MathText';
import { getCorrectAnswerIndex } from '../lib/questionUtils';

export default function ExamResult() {
  const { resultId } = useParams();
  const [resultData, setResultData] = useState<any>(null);
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'skipped'>('all');
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (!resultId) return;
        
        // 1. Fetch Result
        const resultRef = doc(db, 'results', resultId);
        const resultSnap = await getDoc(resultRef);
        
        if (!resultSnap.exists()) {
          alert('রেজাল্ট পাওয়া যায়নি!');
          return;
        }
        
        const resData = resultSnap.data();
        setResultData(resData);
        
        // 2. Fetch Original Exam for questions & explanations
        const examRef = doc(db, 'exams', resData.examId);
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
          setExamData(examSnap.data());
        }

        // 3. Calculate rank (Only 1st Attempt counts for official ranking)
        try {
          const q = query(collection(db, 'results'), where('examId', '==', resData.examId));
          const examResultsSnap = await getDocs(q);
          const rawSubmissions = examResultsSnap.docs.map(d => ({
            id: d.id,
            userId: d.data().userId || '',
            userEmail: d.data().userEmail || '',
            userName: d.data().userName || '',
            score: Number(d.data().stats?.totalScore) || 0,
            correct: Number(d.data().stats?.correct) || 0,
            wrong: Number(d.data().stats?.wrong) || 0,
            time: d.data().submittedAt?.toMillis ? d.data().submittedAt.toMillis() : 0
          }));

          // Sort chronologically (oldest first)
          rawSubmissions.sort((a, b) => a.time - b.time);

          // Deduplicate to keep only 1st attempt per unique student
          const firstAttemptsMap = new Map<string, typeof rawSubmissions[0]>();
          for (const sub of rawSubmissions) {
            const key = (sub.userId && sub.userId !== 'guest')
              ? sub.userId
              : (sub.userEmail ? sub.userEmail.trim().toLowerCase() : sub.userName.trim().toLowerCase());

            if (!firstAttemptsMap.has(key)) {
              firstAttemptsMap.set(key, sub);
            }
          }

          const uniqueList = Array.from(firstAttemptsMap.values());

          // Sort unique 1st attempts by merit
          uniqueList.sort((a, b) => b.score - a.score || b.correct - a.correct || a.wrong - b.wrong || a.time - b.time);

          const currentStudentKey = (resData.userId && resData.userId !== 'guest')
            ? resData.userId
            : (resData.userEmail ? resData.userEmail.trim().toLowerCase() : resData.userName?.trim().toLowerCase());

          const rIndex = uniqueList.findIndex(s => {
            const k = (s.userId && s.userId !== 'guest')
              ? s.userId
              : (s.userEmail ? s.userEmail.trim().toLowerCase() : s.userName.trim().toLowerCase());
            return k === currentStudentKey;
          });

          if (rIndex !== -1) {
            const firstSub = uniqueList[rIndex];
            const isRetake = firstSub.id !== resultId;
            setRankInfo({ 
              rank: rIndex + 1, 
              total: uniqueList.length,
              isRetake: isRetake 
            } as any);
          }
        } catch (rErr) {
          console.error("Rank calculation error:", rErr);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [resultId]);

  if (loading) return <div className="p-8 text-center text-lg">রেজাল্ট তৈরি হচ্ছে...</div>;
  if (!resultData || !examData) return <div className="p-8 text-center">ডেটা পাওয়া যায়নি।</div>;

  const { stats, answers } = resultData;

  const toBengaliNumber = (num: number | string) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '০';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const marks = Number(resultData?.marksPerQuestion) || Number(examData?.marksPerQuestion) || 1;
  const neg = (resultData?.negativeMarking !== undefined && resultData?.negativeMarking !== null)
    ? Number(resultData.negativeMarking)
    : (examData?.negativeMarking !== undefined && examData?.negativeMarking !== null && !isNaN(Number(examData.negativeMarking)) 
        ? Number(examData.negativeMarking) 
        : (examData?.admissionPattern === 'du_7college' ? 0 : 0.25));

  // Dynamically recompute stats using getCorrectAnswerIndex to fix any misgraded questions from past attempts
  const dynamicStats = useMemo(() => {
    if (!examData?.questions || !answers) return null;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    examData.questions.forEach((q: any, idx: number) => {
      const uAns = answers[idx];
      const correctIdx = getCorrectAnswerIndex(q);

      if (uAns === undefined || uAns === null) {
        skipped++;
      } else if (uAns === correctIdx) {
        correct++;
      } else {
        wrong++;
      }
    });

    const totalScore = Number(((correct * marks) - (wrong * neg)).toFixed(2));
    const outOf = (examData.questions.length || 1) * marks;

    return { correct, wrong, skipped, totalScore, outOf };
  }, [examData, answers, marks, neg]);

  const activeStats = dynamicStats || stats || { correct: 0, wrong: 0, skipped: 0, totalScore: 0, outOf: 0 };

  let displayScore = Number(activeStats?.totalScore);
  let displayOutOf = Number(activeStats?.outOf);

  if (Number.isNaN(displayScore)) {
    const c = Number(activeStats?.correct) || 0;
    const w = Number(activeStats?.wrong) || 0;
    displayScore = Number(((c * marks) - (w * neg)).toFixed(2));
  }

  if (Number.isNaN(displayOutOf) || displayOutOf <= 0) {
    const totalQ = (Number(activeStats?.correct) || 0) + (Number(activeStats?.wrong) || 0) + (Number(activeStats?.skipped) || 0);
    displayOutOf = (totalQ || examData?.questions?.length || 100) * marks;
  }

  const pieData = [
    { name: 'সঠিক', value: activeStats.correct, color: '#10B981' }, // Green
    { name: 'ভুল', value: activeStats.wrong, color: '#EF4444' }, // Red
    { name: 'উত্তর দেননি', value: activeStats.skipped, color: '#9CA3AF' } // Gray
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4">
          <Award size={40} />
        </div>
        <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark">
          পরীক্ষা সম্পন্ন হয়েছে!
        </h1>
        <p className="text-xl mt-2 text-gray-600 dark:text-gray-400">
          {examData.title}
        </p>
      </div>

      {/* Rank & Merit Position Banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Trophy size={30} className="text-white" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-100">মেধা অবস্থান / Merit Rank</span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5">
              {rankInfo ? `${toBengaliNumber(rankInfo.rank)} নম্বর স্থান` : 'গণনা হচ্ছে...'}
              {rankInfo && <span className="text-sm font-normal text-amber-100 ml-2">(মোট {toBengaliNumber(rankInfo.total)} জনের মধ্যে)</span>}
            </div>
            {(rankInfo as any)?.isRetake && (
              <p className="text-xs text-amber-100/90 mt-1 font-medium">
                💡 এটি আপনার অনুশীলনমূলক রি-টেক পরীক্ষা। অফিসিয়াল মেধা তালিকায় ১ম পরীক্ষার ফলাফল বহাল রয়েছে।
              </p>
            )}
          </div>
        </div>

        <Link
          to={`/leaderboard/${resultData.examId}`}
          className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-2xl text-sm transition-all shadow-sm flex items-center gap-2 shrink-0 hover:scale-105"
        >
          <Award size={18} /> সম্পূর্ণ মেধা তালিকা দেখুন →
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center">
          <h2 className="text-lg text-gray-500 dark:text-gray-400 mb-2">আপনার প্রাপ্ত নম্বর</h2>
          <div className="text-6xl font-bold text-accent-light dark:text-accent-dark">
            {toBengaliNumber(displayScore)} <span className="text-2xl text-gray-400 font-normal">/ {toBengaliNumber(displayOutOf)}</span>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {neg > 0 ? (
              stats.wrong > 0 
                ? `(নেগেটিভ মার্কিংয়ের জন্য -${toBengaliNumber((stats.wrong * neg).toFixed(2))} নম্বর কাটা গেছে)` 
                : '(কোনো নেগেটিভ মার্কিং কাটা যায়নি)'
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🎉 এই পরীক্ষায় কোনো নেগেটিভ মার্কিং ছিল না!</span>
            )}
          </p>
        </div>

        {/* Chart Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <div className="w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="font-medium">{toBengaliNumber(activeStats.correct)} সঠিক</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="font-medium">{toBengaliNumber(activeStats.wrong)} ভুল</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span className="font-medium">{toBengaliNumber(activeStats.skipped)} উত্তর দেননি</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 gap-4">
        <h2 className="text-2xl font-bold">প্রশ্নের সমাধান ও ব্যাখ্যা</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterMode('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-primary-light text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            সবগুলো
          </button>
          <button 
            onClick={() => setFilterMode('wrong')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'wrong' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'}`}
          >
            শুধু ভুল গুলো
          </button>
          <button 
            onClick={() => setFilterMode('skipped')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'skipped' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
          >
            উত্তর না দেওয়া প্রশ্ন গুলো
          </button>
        </div>
      </div>

      {/* Answer Review */}
      <div className="space-y-6">
        {examData.questions.map((q: any, idx: number) => {
          const userAnswer = answers[idx];
          const correctIdx = getCorrectAnswerIndex(q);
          const isCorrect = userAnswer === correctIdx;
          const isSkipped = userAnswer === undefined || userAnswer === null;

          // Apply filters
          if (filterMode === 'wrong' && (isCorrect || isSkipped)) return null;
          if (filterMode === 'skipped' && !isSkipped) return null;

          return (
            <div key={idx} className={`p-6 rounded-2xl border-2 ${
              isCorrect ? 'border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10' : 
              isSkipped ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30' : 
              'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10'
            }`}>
              <div className="flex gap-3 mb-4">
                <div className="mt-1">
                  {isCorrect ? <CheckCircle2 className="text-green-500" /> : 
                   isSkipped ? <MinusCircle className="text-gray-400" /> : 
                   <XCircle className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg flex gap-2">
                    <span>{idx + 1}.</span>
                    <span className="flex-1"><MathText text={q.text} /></span>
                  </h3>
                  {q.tags && <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">{q.tags}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9 mb-4">
                {q.options.map((opt: string, optIdx: number) => {
                  let optStyle = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
                  
                  if (optIdx === correctIdx) {
                    optStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500 text-green-800 dark:text-green-200 font-medium";
                  } else if (optIdx === userAnswer && !isCorrect) {
                    optStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                  }

                  return (
                    <div key={optIdx} className={`p-3 rounded-xl border ${optStyle} flex justify-between items-center gap-2`}>
                      <span className="flex-1"><MathText text={opt} /></span>
                      {optIdx === correctIdx && <CheckCircle2 size={18} className="text-green-600 shrink-0" />}
                      {optIdx === userAnswer && !isCorrect && <XCircle size={18} className="text-red-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ml-9 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-xl text-sm border border-blue-100 dark:border-blue-900">
                  <strong className="block mb-1 text-blue-800 dark:text-blue-300">ব্যাখ্যা:</strong>
                  <MathText text={q.explanation} />
                </div>
              )}

              <div className="ml-9">
                <QuestionDiscussion 
                  examId={resultData.examId} 
                  questionIndex={idx} 
                  examTitle={examData?.title || resultData.examTitle}
                  questionText={q.text}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        <Link 
          to={`/leaderboard/${resultData.examId}`}
          className="inline-flex items-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-sm hover:scale-105"
        >
          <Trophy size={18} /> সম্পূর্ণ মেধা তালিকা দেখুন
        </Link>
        <Link 
          to="/exams" 
          className="inline-flex items-center gap-2 px-7 py-3 bg-primary-light hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-sm hover:scale-105"
        >
          আরও পরীক্ষা দিন <ArrowRight size={18} />
        </Link>
      </div>
    </motion.div>
  );
}
