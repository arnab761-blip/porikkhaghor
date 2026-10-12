import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LayoutGrid, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ADMISSION_PRESETS, isSubjectAllowed } from '../lib/admissionRules';
import { MathText } from '../components/MathText';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject?: string;
}

interface Choice {
  label: string;
  subjects: string[];
}

interface OptionalRule {
  id: string;
  title: string;
  choices: Choice[];
}

interface GroupRule {
  id: string;
  title: string;
  totalRequired: number;
  groups: {
    label: string;
    subjects: string[];
    minSelect: number;
    maxSelect: number;
  }[];
}

interface ExamData {
  title: string;
  timeLimit: number;
  questions: Question[];
  marksPerQuestion: number;
  negativeMarking: number;
  hasSections?: boolean;
  admissionPattern?: string;
  compulsorySubjects?: string[];
  simpleOptionalSubjects?: string[];
  optionalSelectionCount?: number;
  groupRules?: GroupRule[];
  optionalRules?: OptionalRule[];
}

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Exam State
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [showRuleAlert, setShowRuleAlert] = useState(true);
  
  // Section State (Custom)
  const [selectedOptionals, setSelectedOptionals] = useState<Record<string, number>>({});
  const [selectedSimpleOptionals, setSelectedSimpleOptionals] = useState<string[]>([]);
  const [selectedGroupSubjects, setSelectedGroupSubjects] = useState<Record<string, string[]>>({});

  // Admission Preset States
  const [selectedDuGstOptionals, setSelectedDuGstOptionals] = useState<string[]>(['math', 'biology']);
  const [selectedRuBlock, setSelectedRuBlock] = useState<'both' | 'math_only' | 'bio_only'>('both');
  const [selectedCuOptionals, setSelectedCuOptionals] = useState<string[]>(['physics', 'chemistry', 'math']);

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  // Fetch Exam
  useEffect(() => {
    if (!id) return;
    
    const fetchExam = async () => {
      try {
        const docRef = doc(db, 'exams', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ExamData;
          setExam(data);
          
          // Restore progress if available
          const savedProgress = localStorage.getItem(`exam_progress_${id}`);
          if (savedProgress) {
            const parsed = JSON.parse(savedProgress);
            setAnswers(parsed.answers || {});
            setShowRuleAlert(false); // Bypass rules if resuming
            
            // Restore progress if available
            if (parsed.selectedDuGstOptionals) setSelectedDuGstOptionals(parsed.selectedDuGstOptionals);
            if (parsed.selectedRuBlock) setSelectedRuBlock(parsed.selectedRuBlock);
            if (parsed.selectedCuOptionals) setSelectedCuOptionals(parsed.selectedCuOptionals);

            if (data.admissionPattern && data.admissionPattern !== 'custom') {
              let keys: string[] = [];
              const pattern = data.admissionPattern;
              if (pattern === 'du_a' || pattern === 'gst_a') {
                keys = ['physics', 'chemistry', ...(parsed.selectedDuGstOptionals || ['math', 'biology'])];
              } else if (pattern === 'ru_c') {
                const blk = parsed.selectedRuBlock || 'both';
                const base = ['physics', 'chemistry', 'ict'];
                keys = blk === 'math_only' ? [...base, 'math'] : blk === 'bio_only' ? [...base, 'biology'] : [...base, 'math', 'biology'];
              } else if (pattern === 'cu_a') {
                keys = ['english', ...(parsed.selectedCuOptionals || ['physics', 'chemistry', 'math'])];
              } else if (pattern === 'buet') {
                keys = ['math', 'physics', 'chemistry'];
              } else if (pattern === 'ckruet' || pattern === 'butex') {
                keys = ['math', 'physics', 'chemistry', 'english'];
              } else if (pattern === 'medical') {
                keys = ['biology', 'chemistry', 'physics', 'english', 'gk'];
              } else if (pattern === 'agri_gst') {
                keys = ['biology', 'chemistry', 'physics', 'math', 'english'];
              } else if (pattern === 'ju_a') {
                keys = ['math', 'physics', 'chemistry', 'ict', 'bangla', 'english'];
              } else if (pattern === 'ju_d') {
                keys = ['biology', 'chemistry', 'bangla', 'english', 'iq'];
              }

              const filtered = data.questions.filter(q => isSubjectAllowed(q.subject, keys));
              setActiveQuestions(filtered.length > 0 ? filtered : data.questions);
            } else if (parsed.selectedOptionals || parsed.selectedSimpleOptionals || parsed.selectedGroupSubjects) {
              if (parsed.selectedOptionals) setSelectedOptionals(parsed.selectedOptionals);
              if (parsed.selectedSimpleOptionals) setSelectedSimpleOptionals(parsed.selectedSimpleOptionals);
              if (parsed.selectedGroupSubjects) setSelectedGroupSubjects(parsed.selectedGroupSubjects);
              
              let allowed = [...(data.compulsorySubjects || [])];
              
              if (parsed.selectedOptionals && data.optionalRules) {
                const chosenSubjects = data.optionalRules.flatMap(rule => {
                  const choiceIdx = parsed.selectedOptionals[rule.id];
                  return choiceIdx !== undefined ? rule.choices[choiceIdx].subjects : [];
                });
                allowed = [...allowed, ...chosenSubjects];
              }
              
              if (parsed.selectedSimpleOptionals) {
                allowed = [...allowed, ...parsed.selectedSimpleOptionals];
              }

              if (parsed.selectedGroupSubjects) {
                Object.values(parsed.selectedGroupSubjects).forEach((subs: any) => {
                  allowed = [...allowed, ...subs];
                });
              }

              setActiveQuestions(data.questions.filter(q => !data.hasSections || allowed.includes(q.subject || '')));
            } else {
              if (data.hasSections && (!data.optionalRules?.length && !data.optionalSelectionCount && !data.groupRules?.length)) {
                setActiveQuestions(data.questions.filter(q => (data.compulsorySubjects || []).includes(q.subject || '')));
              } else if (!data.hasSections) {
                setActiveQuestions(data.questions);
              }
            }
            
            const remaining = Math.floor((parsed.endTime - Date.now()) / 1000);
            if (remaining > 0) {
              setTimeLeft(remaining);
            } else {
              localStorage.removeItem(`exam_progress_${id}`);
              alert('পরীক্ষার নির্ধারিত সময়সীমা ইতোমধ্যে শেষ হয়ে গেছে!');
              navigate('/exams');
              return;
            }
          } else {
            // New attempt - active questions set when startExam is clicked
            setTimeLeft(data.timeLimit * 60);
          }
        } else {
          alert('পরীক্ষাটি খুঁজে পাওয়া যায়নি!');
          navigate('/exams');
        }
      } catch (error) {
        console.error(error);
        alert('সমস্যা হয়েছে!');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExam();
  }, [id, navigate]);

  // Timer
  useEffect(() => {
    if (showRuleAlert || timeLeft <= 0 || !exam) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, exam, showRuleAlert]);

  const startExam = () => {
    if (!exam || !id) return;
    
    // ================= OFFICIAL ADMISSION PRESET VALIDATION =================
    if (exam.admissionPattern && exam.admissionPattern !== 'custom') {
      const pattern = exam.admissionPattern;
      let allowedKeys: string[] = [];

      if (pattern === 'du_a' || pattern === 'gst_a') {
        if (selectedDuGstOptionals.length !== 2) {
          alert('অনুগ্রহ করে ঐচ্ছিক/বিকল্প তালিকা থেকে ঠিক ২টি বিষয় নির্বাচন করুন।');
          return;
        }
        const hasScience = selectedDuGstOptionals.includes('math') || selectedDuGstOptionals.includes('biology');
        const languageCount = (selectedDuGstOptionals.includes('bangla') ? 1 : 0) + (selectedDuGstOptionals.includes('english') ? 1 : 0);
        
        if (!hasScience) {
          alert('গণিত বা জীববিজ্ঞানের অন্তত একটি বিষয় অবশ্যই নির্বাচন করতে হবে।');
          return;
        }
        if (languageCount > 1) {
          alert('৪র্থ বিষয়ের পরিবর্তে বাংলা অথবা ইংরেজি থেকে যেকোনো একটি বিষয় নির্বাচন করা যাবে। দুটি ভাষা একসাথে নেওয়া যাবে না।');
          return;
        }
        allowedKeys = ['physics', 'chemistry', ...selectedDuGstOptionals];
      } else if (pattern === 'ru_c') {
        const base = ['physics', 'chemistry', 'ict'];
        if (selectedRuBlock === 'math_only') {
          allowedKeys = [...base, 'math'];
        } else if (selectedRuBlock === 'bio_only') {
          allowedKeys = [...base, 'biology'];
        } else {
          allowedKeys = [...base, 'math', 'biology'];
        }
      } else if (pattern === 'cu_a') {
        if (selectedCuOptionals.length !== 3) {
          alert('অনুগ্রহ করে ঐচ্ছিক ৪টি বিষয় থেকে ঠিক ৩টি বিষয় নির্বাচন করুন।');
          return;
        }
        allowedKeys = ['english', ...selectedCuOptionals];
      } else if (pattern === 'buet') {
        allowedKeys = ['math', 'physics', 'chemistry'];
      } else if (pattern === 'ckruet' || pattern === 'butex') {
        allowedKeys = ['math', 'physics', 'chemistry', 'english'];
      } else if (pattern === 'medical') {
        allowedKeys = ['biology', 'chemistry', 'physics', 'english', 'gk'];
      } else if (pattern === 'agri_gst') {
        allowedKeys = ['biology', 'chemistry', 'physics', 'math', 'english'];
      } else if (pattern === 'ju_a') {
        allowedKeys = ['math', 'physics', 'chemistry', 'ict', 'bangla', 'english'];
      } else if (pattern === 'ju_d') {
        allowedKeys = ['biology', 'chemistry', 'bangla', 'english', 'iq'];
      }

      // Filter questions using isSubjectAllowed
      const filteredQuestions = exam.questions.filter(q => isSubjectAllowed(q.subject, allowedKeys));
      setActiveQuestions(filteredQuestions.length > 0 ? filteredQuestions : exam.questions);

      setShowRuleAlert(false);
      const limit = exam.timeLimit * 60;
      setTimeLeft(limit);
      localStorage.setItem(`exam_progress_${id}`, JSON.stringify({
        answers: {},
        selectedDuGstOptionals,
        selectedRuBlock,
        selectedCuOptionals,
        endTime: Date.now() + limit * 1000
      }));
      return;
    }

    // ================= CUSTOM PATTERN VALIDATION =================
    let allowedSubjects = [...(exam.compulsorySubjects || [])];

    // Validate optional bundle selection
    if (exam.hasSections && exam.optionalRules && exam.optionalRules.length > 0) {
      if (Object.keys(selectedOptionals).length !== exam.optionalRules.length) {
        alert(`অনুগ্রহ করে প্রতিটি গুচ্ছ ঐচ্ছিক নিয়ম থেকে একটি করে অপশন বাছাই করুন।`);
        return;
      }
      const chosenSubjects = exam.optionalRules.flatMap(rule => {
        const choiceIdx = selectedOptionals[rule.id];
        return choiceIdx !== undefined ? rule.choices[choiceIdx].subjects : [];
      });
      allowedSubjects = [...allowedSubjects, ...chosenSubjects];
    }

    // Validate simple optional selection
    if (exam.hasSections && exam.optionalSelectionCount && exam.optionalSelectionCount > 0) {
      if (selectedSimpleOptionals.length !== exam.optionalSelectionCount) {
        alert(`অনুগ্রহ করে সরল ঐচ্ছিক বিষয় থেকে ঠিক ${exam.optionalSelectionCount} টি বিষয় সিলেক্ট করুন।`);
        return;
      }
      allowedSubjects = [...allowedSubjects, ...selectedSimpleOptionals];
    }

    // Validate group optional selection
    if (exam.hasSections && exam.groupRules && exam.groupRules.length > 0) {
      for (const rule of exam.groupRules) {
        const selected = selectedGroupSubjects[rule.id] || [];
        if (selected.length !== rule.totalRequired) {
          alert(`"${rule.title}" নিয়মের জন্য মোট ${rule.totalRequired}টি বিষয় সিলেক্ট করতে হবে।`);
          return;
        }
        for (const group of rule.groups) {
          const groupSelected = selected.filter(s => group.subjects.includes(s));
          if (groupSelected.length < group.minSelect || groupSelected.length > group.maxSelect) {
            alert(`"${group.label}" থেকে সর্বনিম্ন ${group.minSelect}টি এবং সর্বোচ্চ ${group.maxSelect}টি বিষয় সিলেক্ট করা যাবে।`);
            return;
          }
        }
        allowedSubjects = [...allowedSubjects, ...selected];
      }
    }

    if (exam.hasSections) {
      setActiveQuestions(exam.questions.filter(q => allowedSubjects.includes(q.subject || '')));
    } else {
      setActiveQuestions(exam.questions);
    }

    setShowRuleAlert(false);
    const limit = exam.timeLimit * 60;
    setTimeLeft(limit);
    localStorage.setItem(`exam_progress_${id}`, JSON.stringify({
      answers: {},
      selectedOptionals,
      selectedSimpleOptionals,
      selectedGroupSubjects,
      endTime: Date.now() + limit * 1000
    }));
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (answers[qIndex] !== undefined) return; // Prevent changing answer
    
    setAnswers(prev => {
      const newAnswers = { ...prev, [qIndex]: optIndex };
      
      // Update local storage
      const current = localStorage.getItem(`exam_progress_${id}`);
      if (current) {
        const parsed = JSON.parse(current);
        localStorage.setItem(`exam_progress_${id}`, JSON.stringify({
          ...parsed,
          answers: newAnswers
        }));
      }
      
      return newAnswers;
    });
  };

  const submitExam = async () => {
    if (!exam || !id) return;
    
    // Clear local storage progress
    localStorage.removeItem(`exam_progress_${id}`);
    
    // Calculate score locally for immediate result (or server-side in a real app)
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    
    activeQuestions.forEach((q) => {
      // Find the index of this question in the original exam.questions array
      const originalIndex = exam.questions.findIndex(eq => eq.id === q.id);
      
      if (answers[originalIndex] === undefined) {
        skipped++;
      } else if (answers[originalIndex] === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const marks = Number(exam.marksPerQuestion) || 1;
    const neg = exam.negativeMarking !== undefined && !isNaN(Number(exam.negativeMarking)) ? Number(exam.negativeMarking) : 0.25;
    const totalScore = Number(((correct * marks) - (wrong * neg)).toFixed(2));
    const outOf = (activeQuestions.length || exam.questions.length || 1) * marks;

    const resultData = {
      examId: id,
      examTitle: exam.title,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email?.split('@')[0] || 'শিক্ষার্থী',
      userEmail: user?.email || '',
      answers,
      stats: { correct, wrong, skipped, totalScore, outOf },
      submittedAt: serverTimestamp()
    };

    try {
      setIsSubmitting(true);
      // Save result to global results collection (or user subcollection)
      const resultRef = await addDoc(collection(db, 'results'), resultData);
      
      // Navigate to result page
      navigate(`/result/${resultRef.id}`);
    } catch (error) {
      console.error(error);
      alert('রেজাল্ট সেভ করতে সমস্যা হয়েছে।');
      setIsSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে পরীক্ষাটি জমা দিতে চান?')) {
      submitExam();
    }
  };

  if (loading) return <div className="p-8 text-center">পরীক্ষা লোড হচ্ছে...</div>;
  if (!exam) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Rule Alert Modal */}
      <AnimatePresence>
        {showRuleAlert && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">সতর্কতা!</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-lg">
                প্রতিটি প্রশ্নের উত্তর মাত্র একবারই দেওয়া যাবে। একবার কোনো অপশন সিলেক্ট করলে তা আর পরিবর্তন করা যাবে না। তাই সাবধানে উত্তর দিন।
              </p>
              
              {/* OFFICIAL ADMISSION PRESET SELECTION MODAL */}
              {exam.admissionPattern && exam.admissionPattern !== 'custom' ? (
                <div className="mb-6 space-y-4 text-left">
                  {/* Preset Header Badge */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                        অফিসিয়াল ভর্তি পরীক্ষা নিয়ম
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {ADMISSION_PRESETS.find(p => p.id === exam.admissionPattern)?.name || 'ভর্তি পরীক্ষা'}
                      </h4>
                    </div>
                  </div>

                  {/* DU A & GST A UNIT */}
                  {(exam.admissionPattern === 'du_a' || exam.admissionPattern === 'gst_a') && (
                    <div className="space-y-4">
                      {/* Compulsory */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">বাধ্যতামূলক বিষয় (ডিফল্ট সিলেক্টেড):</p>
                        <div className="flex gap-2">
                          <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> পদার্থবিজ্ঞান
                          </span>
                          <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> রসায়ন
                          </span>
                        </div>
                      </div>

                      {/* SUST Warning if GST */}
                      {exam.admissionPattern === 'gst_a' && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <strong>বিশেষ শর্ত (SUST):</strong> সাস্টের ইঞ্জিনিয়ারিং বা ফিজিক্যাল সায়েন্সের বিষয় পেতে হলে গণিত এবং বায়োলজিক্যাল সায়েন্স পেতে হলে জীববিজ্ঞান বাধ্যতামূলক।
                          </div>
                        </div>
                      )}

                      {/* Optionals & Alternatives */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            ঐচ্ছিক ও বিকল্প বিষয় (যেকোনো ২টি নির্বাচন করুন):
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedDuGstOptionals.length === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                            {selectedDuGstOptionals.length}/২টি নির্বাচিত
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">
                          * ৪র্থ বিষয়ের পরিবর্তে বাংলা অথবা ইংরেজি থেকে যেকোনো ১টি নিতে পারেন। গণিত বা জীববিজ্ঞানের অন্তত ১টি থাকতে হবে।
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { key: 'math', label: 'উচ্চতর গণিত (Higher Math)', isAlt: false },
                            { key: 'biology', label: 'জীববিজ্ঞান (Biology)', isAlt: false },
                            { key: 'bangla', label: 'বাংলা (বিকল্প বিষয়)', isAlt: true },
                            { key: 'english', label: 'ইংরেজি (বিকল্প বিষয়)', isAlt: true }
                          ].map(opt => {
                            const isChecked = selectedDuGstOptionals.includes(opt.key);
                            return (
                              <label
                                key={opt.key}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-900 dark:text-blue-200' 
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Can only select up to 2
                                      if (selectedDuGstOptionals.length < 2) {
                                        // If selecting language and other language already selected
                                        if (opt.isAlt && (selectedDuGstOptionals.includes('bangla') || selectedDuGstOptionals.includes('english'))) {
                                          alert('বাংলা এবং ইংরেজি দুটি একসাথে নেওয়া যাবে না। যেকোনো একটি ভাষা নির্বাচন করুন।');
                                          return;
                                        }
                                        setSelectedDuGstOptionals([...selectedDuGstOptionals, opt.key]);
                                      } else {
                                        alert('আপনি ইতিমধ্যে ২টি বিষয় নির্বাচন করেছেন। অন্য বিষয় নিতে চাইলে আগে একটি আনচেক করুন।');
                                      }
                                    } else {
                                      setSelectedDuGstOptionals(selectedDuGstOptionals.filter(k => k !== opt.key));
                                    }
                                  }}
                                  className="w-4 h-4 accent-blue-600 rounded"
                                />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RU C UNIT (Science) */}
                  {exam.admissionPattern === 'ru_c' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">বাধ্যতামূলক বিষয়:</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> পদার্থবিজ্ঞান
                          </span>
                          <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> রসায়ন
                          </span>
                          <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> আইসিটি (ICT)
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          ঐচ্ছিক ব্লক (যেকোনো ১টি নির্বাচন করুন):
                        </p>
                        <p className="text-[11px] text-gray-500 mb-3">
                          * বিজ্ঞান ইউনিটে বাংলা বা ইংরেজি নির্বাচনের কোনো সুযোগ নেই।
                        </p>

                        <div className="space-y-2">
                          {[
                            { value: 'both', label: 'গণিত + জীববিজ্ঞান (উভয় বিষয়)' },
                            { value: 'math_only', label: 'শুধুমাত্র গণিত' },
                            { value: 'bio_only', label: 'শুধুমাত্র জীববিজ্ঞান' }
                          ].map(block => (
                            <label
                              key={block.value}
                              className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                selectedRuBlock === block.value
                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-900 dark:text-blue-200'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="ru_block"
                                value={block.value}
                                checked={selectedRuBlock === block.value}
                                onChange={() => setSelectedRuBlock(block.value as any)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              <span>{block.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CU A UNIT */}
                  {exam.admissionPattern === 'cu_a' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">বাধ্যতামূলক বিষয়:</p>
                        <span className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs inline-flex">
                          <CheckCircle2 size={13} /> ইংরেজি (English)
                        </span>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            ঐচ্ছিক বিষয় (যেকোনো ৩টি নির্বাচন করুন):
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedCuOptionals.length === 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {selectedCuOptionals.length}/৩টি নির্বাচিত
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { key: 'physics', label: 'পদার্থবিজ্ঞান' },
                            { key: 'chemistry', label: 'রসায়ন' },
                            { key: 'math', label: 'গণিত' },
                            { key: 'biology', label: 'জীববিজ্ঞান' }
                          ].map(opt => {
                            const isChecked = selectedCuOptionals.includes(opt.key);
                            return (
                              <label
                                key={opt.key}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-900 dark:text-blue-200' 
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (selectedCuOptionals.length < 3) {
                                        setSelectedCuOptionals([...selectedCuOptionals, opt.key]);
                                      } else {
                                        alert('আপনি ইতিমধ্যে ৩টি বিষয় নির্বাচন করেছেন।');
                                      }
                                    } else {
                                      setSelectedCuOptionals(selectedCuOptionals.filter(k => k !== opt.key));
                                    }
                                  }}
                                  className="w-4 h-4 accent-blue-600 rounded"
                                />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ALL-COMPULSORY PRESETS (BUET, CKRUET, BUTEX, Medical, Agri GST, JU A, JU D) */}
                  {['buet', 'ckruet', 'butex', 'medical', 'agri_gst', 'ju_a', 'ju_d'].includes(exam.admissionPattern) && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">সকল বিষয় বাধ্যতামূলক:</p>
                      <div className="flex flex-wrap gap-2">
                        {ADMISSION_PRESETS.find(p => p.id === exam.admissionPattern)?.compulsoryDisplay.map(sub => (
                          <span key={sub} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 font-semibold rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={13} /> {sub}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 pt-1">
                        ℹ️ এই পরীক্ষায় কোনো ঐচ্ছিক বিষয় নেই। পরীক্ষায় অন্তর্ভুক্ত সকল বিষয়ের উত্তর দেওয়া বাধ্যতামূলক।
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= CUSTOM OPTIONAL RULES FALLBACK ================= */
                <>
                  {exam.hasSections && exam.simpleOptionalSubjects && exam.simpleOptionalSubjects.length > 0 && exam.optionalSelectionCount && exam.optionalSelectionCount > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="font-bold mb-3 text-sm">সরল ঐচ্ছিক বিষয় (যেকোনো {exam.optionalSelectionCount} টি সিলেক্ট করুন):</p>
                      <div className="flex flex-col gap-2">
                        {exam.simpleOptionalSubjects.map((subj) => (
                          <label key={subj} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedSimpleOptionals.includes(subj)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedSimpleOptionals.length < (exam.optionalSelectionCount || 1)) {
                                    setSelectedSimpleOptionals([...selectedSimpleOptionals, subj]);
                                  }
                                } else {
                                  setSelectedSimpleOptionals(selectedSimpleOptionals.filter(s => s !== subj));
                                }
                              }}
                              className="w-4 h-4 accent-primary-light"
                            />
                            {subj}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {exam.hasSections && exam.groupRules && exam.groupRules.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {exam.groupRules.map((rule) => (
                        <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <p className="font-bold mb-3 text-sm">{rule.title} (মোট {rule.totalRequired}টি সিলেক্ট করুন):</p>
                          <div className="space-y-4">
                            {rule.groups.map((group, groupIdx) => (
                              <div key={groupIdx} className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900">
                                <p className="text-xs font-semibold text-gray-500 mb-2">
                                  {group.label} (সর্বনিম্ন {group.minSelect}টি, সর্বোচ্চ {group.maxSelect}টি)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {group.subjects.map(subj => {
                                    const selectedInRule = selectedGroupSubjects[rule.id] || [];
                                    const isSelected = selectedInRule.includes(subj);
                                    const groupSelectedCount = selectedInRule.filter(s => group.subjects.includes(s)).length;
                                    const isMaxReached = groupSelectedCount >= group.maxSelect;
                                    const isTotalReached = selectedInRule.length >= rule.totalRequired;
                                    
                                    const disabled = !isSelected && (isMaxReached || isTotalReached);
                                    
                                    return (
                                      <label key={subj} className={`flex items-center gap-2 text-sm px-2 py-1.5 border rounded-md transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'} ${isSelected ? 'border-primary-light bg-primary-light/10 text-primary-dark dark:text-primary-light' : 'border-gray-200 dark:border-gray-700'}`}>
                                        <input 
                                          type="checkbox"
                                          disabled={disabled}
                                          checked={isSelected}
                                          onChange={(e) => {
                                            let current = [...selectedInRule];
                                            if (e.target.checked) {
                                              current.push(subj);
                                            } else {
                                              current = current.filter(s => s !== subj);
                                            }
                                            setSelectedGroupSubjects(prev => ({
                                              ...prev,
                                              [rule.id]: current
                                            }));
                                          }}
                                          className="w-4 h-4 accent-primary-light"
                                        />
                                        {subj}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {exam.hasSections && exam.optionalRules && exam.optionalRules.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {exam.optionalRules.map((rule) => (
                        <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <p className="font-bold mb-3 text-sm">{rule.title}:</p>
                          <div className="flex flex-col gap-3">
                            {rule.choices.map((choice, choiceIdx) => (
                              <label key={choiceIdx} className="flex items-start gap-2 text-sm cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`optional_rule_${rule.id}`}
                                  checked={selectedOptionals[rule.id] === choiceIdx}
                                  onChange={() => {
                                    setSelectedOptionals(prev => ({
                                      ...prev,
                                      [rule.id]: choiceIdx
                                    }));
                                  }}
                                  className="w-4 h-4 mt-0.5 accent-primary-light"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{choice.label}</span>
                                  {choice.subjects && choice.subjects.length > 0 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      বিষয়: {choice.subjects.join(' + ')}
                                    </span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              <button 
                onClick={startExam}
                className="w-full py-3 bg-primary-light text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
              >
                বুঝতে পেরেছি এবং শুরু করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Top Bar for Timer and Submission */}
      <div className="sticky top-[64px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 mb-6 flex justify-between items-center shadow-sm -mx-4 px-4 sm:mx-0 sm:rounded-b-2xl">
        <div>
          <h2 className="font-bold text-lg hidden sm:block">{exam.title}</h2>
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => setViewMode('all')} 
              className={`text-xs px-3 py-1 rounded-full ${viewMode === 'all' ? 'bg-primary-light text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              সব প্রশ্ন একসাথে
            </button>
            <button 
              onClick={() => setViewMode('single')} 
              className={`text-xs px-3 py-1 rounded-full ${viewMode === 'single' ? 'bg-primary-light text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              একটি একটি করে
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-error-light animate-pulse' : 'text-primary-light dark:text-primary-dark'}`}>
            <Clock size={24} />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={confirmSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            {isSubmitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      </div>

      {/* Floating Progress Grid */}
      <div className="fixed bottom-32 md:bottom-8 right-4 md:right-8 z-[70] flex flex-col items-end">
        <AnimatePresence>
          {isGridOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-72 md:w-80 max-h-[60vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-2 border-b border-gray-100 dark:border-gray-800 z-10">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">প্রশ্ন তালিকা</h3>
                <button 
                  onClick={() => setIsGridOpen(false)} 
                  className="p-1.5 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeQuestions.map((q, activeIdx) => {
                  const originalIdx = exam.questions.findIndex(eq => eq.id === q.id);
                  return (
                    <button 
                      key={originalIdx}
                      onClick={() => { 
                        setCurrentQuestionIndex(activeIdx);
                        if (viewMode === 'all') {
                          const element = document.getElementById(`q-${originalIdx}`);
                          if (element) {
                            const yOffset = -120; // Offset for sticky header
                            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }
                        // Auto-close on smaller screens
                        if (window.innerWidth < 768) {
                          setIsGridOpen(false);
                        }
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors
                        ${answers[originalIdx] !== undefined 
                          ? 'bg-accent-light text-white shadow-sm' 
                          : currentQuestionIndex === activeIdx
                            ? 'border-2 border-primary-light text-primary-light dark:border-primary-dark dark:text-primary-dark'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {activeIdx + 1}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsGridOpen(!isGridOpen)}
          className="w-14 h-14 bg-primary-light text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-primary-light/30"
          title="প্রশ্ন তালিকা দেখুন"
        >
          {isGridOpen ? <X size={24} /> : <LayoutGrid size={24} />}
        </button>
      </div>

      {/* Questions Display */}
      {viewMode === 'all' ? (
        <div className="space-y-8">
          {activeQuestions.map((q, activeIdx) => {
            const originalIdx = exam.questions.findIndex(eq => eq.id === q.id);
            const prevQ = activeIdx > 0 ? activeQuestions[activeIdx - 1] : null;
            const showSubjectHeader = exam.hasSections && (!prevQ || prevQ.subject !== q.subject);

            return (
              <div key={originalIdx} id={`q-${originalIdx}`}>
                {showSubjectHeader && (
                  <div className="bg-primary-light/10 text-primary-light font-bold text-xl px-6 py-3 rounded-lg mb-4 mt-8 first:mt-0">
                    {q.subject || 'সাধারণ'}
                  </div>
                )}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <h3 className="text-lg font-medium mb-4 flex gap-3">
                    <span className="font-bold text-gray-400">{activeIdx + 1}.</span>
                    <span className="flex-1"><MathText text={q.text} /></span>
                  </h3>
                  <div className="flex flex-col gap-3 pl-7">
                    {q.options.map((opt, optIndex) => {
                      const isAnswered = answers[originalIdx] !== undefined;
                      const isSelected = answers[originalIdx] === optIndex;
                      return (
                        <label 
                          key={optIndex} 
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                            ${isAnswered ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}
                            ${isSelected 
                              ? 'border-accent-light bg-accent-light/5 dark:bg-accent-dark/10' 
                              : 'border-gray-200 dark:border-gray-700'}`}
                        >
                          <input 
                            type="radio" 
                            name={`q-${originalIdx}`} 
                            checked={isSelected}
                            onChange={() => handleSelectAnswer(originalIdx, optIndex)}
                            disabled={isAnswered}
                            className="w-5 h-5 accent-accent-light"
                          />
                          <span className="flex-1"><MathText text={opt} /></span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      ) : (
        activeQuestions.length > 0 && (
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px] flex flex-col"
          >
            <div className="flex-grow">
              {exam.hasSections && activeQuestions[currentQuestionIndex].subject && (
                <div className="bg-primary-light/10 text-primary-light font-bold text-sm px-3 py-1 rounded-full mb-4 inline-block">
                  {activeQuestions[currentQuestionIndex].subject}
                </div>
              )}
              <h3 className="text-xl font-medium mb-6 flex gap-3">
                <span className="font-bold text-gray-400">{currentQuestionIndex + 1}.</span>
                <span className="flex-1"><MathText text={activeQuestions[currentQuestionIndex].text} /></span>
              </h3>
              <div className="flex flex-col gap-4 pl-7">
                {activeQuestions[currentQuestionIndex].options.map((opt, optIndex) => {
                  const originalIdx = exam.questions.findIndex(eq => eq.id === activeQuestions[currentQuestionIndex].id);
                  const isAnswered = answers[originalIdx] !== undefined;
                  const isSelected = answers[originalIdx] === optIndex;
                  return (
                    <label 
                      key={optIndex} 
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-lg
                        ${isAnswered ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}
                        ${isSelected 
                          ? 'border-accent-light bg-accent-light/5 dark:bg-accent-dark/10' 
                          : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <input 
                        type="radio" 
                        name={`single-q-${originalIdx}`} 
                        checked={isSelected}
                        onChange={() => handleSelectAnswer(originalIdx, optIndex)}
                        disabled={isAnswered}
                        className="w-5 h-5 accent-accent-light"
                      />
                      <span className="flex-1"><MathText text={opt} /></span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Navigation for Single Mode */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-30"
              >
                আগেরটি
              </button>
              {currentQuestionIndex < activeQuestions.length - 1 ? (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
                  className="px-6 py-2 bg-primary-light text-white rounded-lg"
                >
                  পরেরটি
                </button>
              ) : (
                <button 
                  onClick={confirmSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg"
                >
                  পরীক্ষা জমা দিন
                </button>
              )}
            </div>
          </motion.div>
        )
      )}
    </div>
  );
}
