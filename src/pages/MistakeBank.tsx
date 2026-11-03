import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  XCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  Layers, 
  RotateCcw,
  CheckCircle2,
  Filter,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestionDiscussion from '../components/forum/QuestionDiscussion';
import { MathText } from '../components/MathText';
import { getCorrectAnswerIndex } from '../lib/questionUtils';
import { useLanguage } from '../context/LanguageContext';

interface Mistake {
  id: string;
  examId: string;
  examTitle: string;
  category?: string;
  subCategory?: string;
  questionIndex: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  explanation: string;
  submittedAt?: any;
}

interface ExamMistakeGroup {
  examId: string;
  examTitle: string;
  category?: string;
  subCategory?: string;
  mistakes: Mistake[];
}

export default function MistakeBank() {
  const { user } = useAuth();
  const { t, language, toLangNumber } = useLanguage();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open/collapsed state for each exam sector
  const [collapsedExams, setCollapsedExams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Fetch all results for this user
        const q = query(collection(db, 'results'), where('userId', '==', user.uid));
        const resultSnap = await getDocs(q);
        
        // Sort results newest first to avoid duplicate stale mistakes
        const sortedDocs = resultSnap.docs.slice().sort((a, b) => {
          const tA = a.data().submittedAt?.toMillis ? a.data().submittedAt.toMillis() : 0;
          const tB = b.data().submittedAt?.toMillis ? b.data().submittedAt.toMillis() : 0;
          return tB - tA;
        });

        const allMistakes: Mistake[] = [];
        const examCache: Record<string, any> = {};
        const seenQuestionKeys = new Set<string>();

        for (const docSnap of sortedDocs) {
          const res = docSnap.data();
          const { examId, examTitle, answers, submittedAt } = res;

          // Only fetch the exam document if they made mistakes
          if (res.stats && res.stats.wrong > 0 && examId) {
            if (!examCache[examId]) {
              try {
                const examSnap = await getDoc(doc(db, 'exams', examId));
                if (examSnap.exists()) {
                  examCache[examId] = examSnap.data();
                }
              } catch (e) {
                console.error("Error fetching exam for mistake:", e);
              }
            }

            const examData = examCache[examId];
            if (examData && Array.isArray(examData.questions)) {
              const finalExamTitle = examData.title || examTitle || 'Exam';
              const category = examData.category || '';
              const subCategory = examData.subCategory || '';

              examData.questions.forEach((q: any, idx: number) => {
                const userAnswer = answers ? answers[idx] : undefined;
                const correctIdx = getCorrectAnswerIndex(q);
                const questionKey = `${examId}_${idx}`;

                // If user answered wrongly and we haven't already included this question from a newer attempt
                if (userAnswer !== undefined && userAnswer !== correctIdx && !seenQuestionKeys.has(questionKey)) {
                  seenQuestionKeys.add(questionKey);
                  allMistakes.push({
                    id: questionKey,
                    examId,
                    examTitle: finalExamTitle,
                    category,
                    subCategory,
                    questionIndex: idx,
                    questionText: q.text || '',
                    options: Array.isArray(q.options) ? q.options : [],
                    correctAnswer: correctIdx,
                    userAnswer,
                    explanation: q.explanation || '',
                    submittedAt
                  });
                }
              });
            }
          }
        }

        setMistakes(allMistakes);
      } catch (error) {
        console.error("Error fetching mistakes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, [user]);

  // Group mistakes by Exam
  const examGroups: ExamMistakeGroup[] = useMemo(() => {
    const map = new Map<string, ExamMistakeGroup>();
    
    for (const m of mistakes) {
      if (!map.has(m.examId)) {
        map.set(m.examId, {
          examId: m.examId,
          examTitle: m.examTitle,
          category: m.category,
          subCategory: m.subCategory,
          mistakes: []
        });
      }
      map.get(m.examId)!.mistakes.push(m);
    }

    return Array.from(map.values());
  }, [mistakes]);

  // Filter groups according to selectedExamFilter and searchQuery
  const filteredGroups: ExamMistakeGroup[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return examGroups
      .filter(group => {
        if (selectedExamFilter !== 'all' && group.examId !== selectedExamFilter) {
          return false;
        }
        return true;
      })
      .map(group => {
        if (!q) return group;

        // Check if exam title or category matches the query
        const examMatches = 
          group.examTitle.toLowerCase().includes(q) ||
          (group.category && group.category.toLowerCase().includes(q)) ||
          (group.subCategory && group.subCategory.toLowerCase().includes(q));

        if (examMatches) {
          return group;
        }

        // Otherwise filter only questions matching the query
        const matchingMistakes = group.mistakes.filter(m => 
          m.questionText.toLowerCase().includes(q) ||
          m.explanation.toLowerCase().includes(q) ||
          m.options.some(opt => opt.toLowerCase().includes(q))
        );

        return {
          ...group,
          mistakes: matchingMistakes
        };
      })
      .filter(group => group.mistakes.length > 0);
  }, [examGroups, selectedExamFilter, searchQuery]);

  const totalFilteredMistakes = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.mistakes.length, 0);
  }, [filteredGroups]);

  const toggleExamCollapse = (examId: string) => {
    setCollapsedExams(prev => ({
      ...prev,
      [examId]: !prev[examId]
    }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    examGroups.forEach(g => {
      next[g.examId] = true;
    });
    setCollapsedExams(next);
  };

  const expandAll = () => {
    setCollapsedExams({});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center text-gray-500 dark:text-gray-400">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">{t('loading')}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-16 px-4 pt-4 sm:pt-6">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 mb-8 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <XCircle size={15} /> {language === 'bn' ? 'ব্যক্তিগত রিভিশন ডায়েরি' : 'Personal Revision Diary'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
            {t('mistakeBankHeading')}
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            {language === 'bn'
              ? 'আপনার পরীক্ষায় হওয়া ভুল প্রশ্নগুলো এখানে পরীক্ষা ও বিষয় অনুযায়ী সুন্দরভাবে ভাগ করা রয়েছে। ফাইনাল পরীক্ষার আগে বারবার রিভিশন দিয়ে নিজের ভুল শুধরে নিন।'
              : t('mistakeBankSubtitle')}
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center p-12 sm:p-16 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-500 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t('noMistakesYet')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {language === 'bn' 
              ? 'আপনি এখন পর্যন্ত যে পরীক্ষাগুলো দিয়েছেন সেগুলোতে কোনো ভুল করেননি অথবা এখনো কোনো পরীক্ষায় অংশগ্রহণ করেননি।' 
              : 'You have not made any mistakes in the exams you completed, or you have not taken any exams yet.'}
          </p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-light hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <BookOpen size={16} /> {language === 'bn' ? 'পরীক্ষা দিন' : 'Take an Exam'}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{language === 'bn' ? 'মোট ভুল প্রশ্ন' : 'Total Mistakes'}</p>
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {toLangNumber(mistakes.length)} {language === 'bn' ? 'টি' : ''}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{language === 'bn' ? 'পরীক্ষার সংখ্যা' : 'Exams with Mistakes'}</p>
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {toLangNumber(examGroups.length)} {language === 'bn' ? 'টি' : ''}
                </h4>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between sm:justify-start gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles size={22} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  {language === 'bn' ? 'সব খুলুন' : 'Expand All'}
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  {language === 'bn' ? 'সব বন্ধ করুন' : 'Collapse All'}
                </button>
              </div>
            </div>
          </div>

          {/* Search & Exam Filter Bar */}
          <div className="space-y-3 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'প্রশ্ন, অপশন বা ব্যাখ্যা লিখে খুঁজুন...' : 'Search questions, options, or explanations...'}
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Exam / Subject Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
              <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center gap-1 mr-1">
                <Filter size={13} /> {language === 'bn' ? 'পরীক্ষা ফিল্টার:' : 'Filter by Exam:'}
              </span>

              <button
                onClick={() => setSelectedExamFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedExamFilter === 'all'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {language === 'bn' ? `সকল পরীক্ষা (${toLangNumber(mistakes.length)})` : `All Exams (${toLangNumber(mistakes.length)})`}
              </button>

              {examGroups.map(group => {
                const isSelected = selectedExamFilter === group.examId;
                return (
                  <button
                    key={group.examId}
                    onClick={() => setSelectedExamFilter(group.examId)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{group.examTitle}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    }`}>
                      {toLangNumber(group.mistakes.length)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter / Search Feedback if no results */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <Search size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                {language === 'bn' ? 'কোনো ভুল প্রশ্ন পাওয়া যায়নি' : 'No matching mistakes found'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery ? `"${searchQuery}" এর জন্য কোনো ফলাফল নেই।` : 'এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।'}
              </p>
              {(searchQuery || selectedExamFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedExamFilter('all'); }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </button>
              )}
            </div>
          ) : (
            /* ================= EXAM-WISE SECTORS LIST ================= */
            <div className="space-y-6">
              {(searchQuery || selectedExamFilter !== 'all') && (
                <div className="flex items-center justify-between px-2 text-xs text-gray-500 font-medium">
                  <span>
                    {language === 'bn' 
                      ? `ফিল্টার অনুযায়ী মোট ${toLangNumber(totalFilteredMistakes)}টি ভুল প্রশ্ন পাওয়া গেছে:` 
                      : `Found ${toLangNumber(totalFilteredMistakes)} mistakes matching filter:`}
                  </span>
                </div>
              )}
              {filteredGroups.map(group => {
                const isCollapsed = Boolean(collapsedExams[group.examId]);

                return (
                  <div
                    key={group.examId}
                    className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-red-100 dark:border-red-900/40 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Exam Sector Header */}
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-red-50/60 via-white to-rose-50/40 dark:from-red-950/20 dark:via-gray-900 dark:to-rose-950/10 border-b border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Layers size={22} />
                        </div>
                        <div>
                          {/* Subject / Category Badges */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {group.category && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800">
                                {group.category}
                              </span>
                            )}
                            {group.subCategory && (
                              <span className="text-[11px] font-medium px-2.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full">
                                {group.subCategory}
                              </span>
                            )}
                            <span className="text-[11px] font-bold px-2 py-0.5 bg-red-600 text-white rounded-full">
                              {toLangNumber(group.mistakes.length)} {language === 'bn' ? 'টি ভুল প্রশ্ন' : 'Mistakes'}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                            {group.examTitle}
                          </h3>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          to={`/take-exam/${group.examId}`}
                          className="px-3.5 py-2 bg-primary-light hover:bg-primary-dark text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                          title={language === 'bn' ? 'এই পরীক্ষাটি পুনরায় দিন' : 'Retake this exam'}
                        >
                          <RotateCcw size={13} /> {language === 'bn' ? 'পরীক্ষাটি আবার দিন' : 'Retake Exam'}
                        </Link>

                        <button
                          onClick={() => toggleExamCollapse(group.examId)}
                          className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-colors"
                          title={isCollapsed ? (language === 'bn' ? 'প্রশ্নের তালিকা খুলুন' : 'Expand') : (language === 'bn' ? 'সংকুচিত করুন' : 'Collapse')}
                        >
                          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Questions Accordion Body */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 sm:p-6 space-y-6 divide-y divide-gray-100 dark:divide-gray-800"
                        >
                          {group.mistakes.map((m, qIndex) => (
                            <div key={m.id} className={qIndex > 0 ? "pt-6" : ""}>
                              {/* Question Heading Number */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/50">
                                  {language === 'bn' 
                                    ? `ভুল প্রশ্ন #${toLangNumber(qIndex + 1)} (মূল পরীক্ষার প্রশ্ন #${toLangNumber(m.questionIndex + 1)})`
                                    : `Mistake #${toLangNumber(qIndex + 1)} (Question #${toLangNumber(m.questionIndex + 1)})`}
                                </span>
                              </div>

                              {/* Question Text */}
                              <h4 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 dark:text-white leading-relaxed">
                                <MathText text={m.questionText} />
                              </h4>

                              {/* Options Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {m.options.map((opt, optIdx) => {
                                  let optStyle = "border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300";
                                  
                                  if (optIdx === m.correctAnswer) {
                                    optStyle = "border-green-500 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-500 text-green-800 dark:text-green-300 font-semibold";
                                  } else if (optIdx === m.userAnswer) {
                                    optStyle = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 line-through font-medium";
                                  }

                                  return (
                                    <div key={optIdx} className={`p-3 rounded-2xl border ${optStyle} flex justify-between items-center gap-2 transition-all`}>
                                      <span className="flex-1 text-xs sm:text-sm">
                                        <MathText text={opt} />
                                      </span>
                                      <span className="text-[11px] shrink-0 font-bold">
                                        {optIdx === m.userAnswer && (
                                          <span className="text-red-600 dark:text-red-400">
                                            ({t('yourAnswer')})
                                          </span>
                                        )}
                                        {optIdx === m.correctAnswer && (
                                          <span className="text-green-600 dark:text-green-400 ml-1">
                                            ({t('correctAnswer')})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation Box */}
                              {m.explanation && (
                                <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 rounded-2xl text-xs sm:text-sm border border-blue-100 dark:border-blue-900/60 mb-4">
                                  <strong className="block mb-1 text-blue-800 dark:text-blue-300 font-bold">
                                    💡 {language === 'bn' ? 'ব্যাখ্যা:' : 'Explanation:'}
                                  </strong>
                                  <div className="leading-relaxed">
                                    <MathText text={m.explanation} />
                                  </div>
                                </div>
                              )}

                              {/* Question Discussion / Forum */}
                              <QuestionDiscussion 
                                examId={m.examId} 
                                questionIndex={m.questionIndex} 
                                examTitle={m.examTitle}
                                questionText={m.questionText}
                              />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
