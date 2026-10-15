import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { XCircle, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestionDiscussion from '../components/forum/QuestionDiscussion';
import { MathText } from '../components/MathText';

interface Mistake {
  examId: string;
  examTitle: string;
  questionIndex: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  explanation: string;
}

export default function MistakeBank() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user) return;
      try {
        // Fetch all results for this user
        const q = query(collection(db, 'results'), where('userId', '==', user.uid));
        const resultSnap = await getDocs(q);
        
        const allMistakes: Mistake[] = [];
        const examCache: Record<string, any> = {};

        for (const docSnap of resultSnap.docs) {
          const res = docSnap.data();
          const { examId, examTitle, answers } = res;

          // Only fetch the exam document if they made mistakes
          if (res.stats && res.stats.wrong > 0) {
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
            if (examData && examData.questions) {
              examData.questions.forEach((q: any, idx: number) => {
                const userAnswer = answers[idx];
                if (userAnswer !== undefined && userAnswer !== q.correctAnswer) {
                  allMistakes.push({
                    examId,
                    examTitle,
                    questionIndex: idx,
                    questionText: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    userAnswer,
                    explanation: q.explanation
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

  if (loading) return <div className="p-8 text-center">লোড হচ্ছে...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-error-light dark:text-error-dark flex items-center gap-3">
          <XCircle size={32} /> ভুল উত্তরের ডায়েরি (Mistake Bank)
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          আপনার সমস্ত পরীক্ষার ভুল উত্তরগুলো এখানে সংরক্ষিত আছে। এগুলো বারবার চর্চা করে নিজের ভুল শুধরে নিন।
        </p>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <BookOpen size={48} className="mx-auto text-green-300 dark:text-green-700 mb-4" />
          <h2 className="text-xl font-medium text-gray-500 dark:text-gray-400">আপনার কোনো ভুল উত্তর নেই! দারুণ কাজ!</h2>
        </div>
      ) : (
        <div className="space-y-6">
          {mistakes.map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border-2 border-red-100 dark:border-red-900/30">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-md">
                  পরীক্ষা: {m.examTitle}
                </span>
                <Link to={`/take-exam/${m.examId}`} className="text-xs flex items-center gap-1 text-primary-light dark:text-primary-dark hover:underline">
                  পরীক্ষাটি আবার দিন <ChevronRight size={14} />
                </Link>
              </div>

              <h3 className="font-medium text-lg mb-4">
                <MathText text={m.questionText} />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {m.options.map((opt, optIdx) => {
                  let optStyle = "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500";
                  
                  if (optIdx === m.correctAnswer) {
                    optStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500 text-green-700 dark:text-green-300 font-medium";
                  } else if (optIdx === m.userAnswer) {
                    optStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 line-through";
                  }

                  return (
                    <div key={optIdx} className={`p-3 rounded-xl border ${optStyle} flex justify-between items-center gap-2`}>
                      <span className="flex-1"><MathText text={opt} /></span>
                      <span className="text-xs shrink-0 font-medium">
                        {optIdx === m.userAnswer && "(আপনার উত্তর)"} {optIdx === m.correctAnswer && "(সঠিক উত্তর)"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {m.explanation && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-xl text-sm border border-blue-100 dark:border-blue-900">
                  <strong className="block mb-1 text-blue-800 dark:text-blue-300">ব্যাখ্যা:</strong>
                  <MathText text={m.explanation} />
                </div>
              )}

              <QuestionDiscussion 
                examId={m.examId} 
                questionIndex={m.questionIndex} 
                examTitle={m.examTitle}
                questionText={m.questionText}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
