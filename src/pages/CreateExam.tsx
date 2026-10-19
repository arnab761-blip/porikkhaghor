import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, FileSpreadsheet, X, FolderPlus, Copy, ArrowUp, ArrowDown, RotateCcw, Download, HelpCircle, FileCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ADMISSION_PRESETS } from '../lib/admissionRules';
import { MathText } from '../components/MathText';
import { SymbolToolbar } from '../components/SymbolToolbar';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  tags: string;
  subject: string;
}

const DEFAULT_CATEGORIES = [
  'পদার্থবিজ্ঞান (Physics)',
  'রসায়ন (Chemistry)',
  'উচ্চতর গণিত (Higher Math)',
  'জীববিজ্ঞান (Biology)',
  'ইংরেজি (English)',
  'বাংলা (Bangla)',
  'টেক্সটাইল (Textile)',
  'ভর্তি পরীক্ষা (Admission Test)',
  'মডেল টেস্ট (Model Test)',
  'প্রশ্ন ব্যাংক (Question Bank)',
  'পেপার ফাইনাল (Paper Final)',
  'মেডিকেল প্রস্তুতি (Medical Preparation)'
];

export default function CreateExam() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [admissionPattern, setAdmissionPattern] = useState<string>('custom');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const [timeLimit, setTimeLimit] = useState(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPaid, setIsPaid] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  // Fetch existing categories from exams to avoid duplicates
  useEffect(() => {
    const fetchExistingCategories = async () => {
      try {
        const snap = await getDocs(collection(db, 'exams'));
        const cats = new Set<string>(DEFAULT_CATEGORIES);
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.category && typeof data.category === 'string' && data.category.trim()) {
            cats.add(data.category.trim());
          }
        });
        setAvailableCategories(Array.from(cats));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchExistingCategories();
  }, []);

  // New Section States
  const [hasSections, setHasSections] = useState(false);
  const [detectedSubjects, setDetectedSubjects] = useState<string[]>([]);
  const [compulsorySubjects, setCompulsorySubjects] = useState<string[]>([]);
  
  // First System: Simple Optionals
  const [simpleOptionalSubjects, setSimpleOptionalSubjects] = useState<string[]>([]);
  const [optionalSelectionCount, setOptionalSelectionCount] = useState<number>(0);

  // Second System: Advanced Group Rules (GST style)
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
  const [groupRules, setGroupRules] = useState<GroupRule[]>([]);

  // Third System: Bundle Optionals
  interface Choice {
    label: string;
    subjects: string[];
  }
  interface OptionalRule {
    id: string;
    title: string;
    choices: Choice[];
  }
  const [optionalRules, setOptionalRules] = useState<OptionalRule[]>([]);

  // Bulk Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      // Helper to find value across multiple aliases (case, symbol and whitespace-insensitive)
      const getRowValue = (row: any, keys: string[]): string => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null) {
            return String(row[key]).trim();
          }
        }
        const rowEntries = Object.entries(row);
        for (const [rowKey, val] of rowEntries) {
          const cleanKey = rowKey.toLowerCase().replace(/[\s_\-\(\)\.\:\#]+/g, '');
          for (const key of keys) {
            const cleanTarget = key.toLowerCase().replace(/[\s_\-\(\)\.\:\#]+/g, '');
            if (cleanKey === cleanTarget && val !== undefined && val !== null) {
              return String(val).trim();
            }
          }
        }
        return '';
      };

      // Helper to resolve 1/2/3/4, A/B/C/D, ক/খ/গ/ঘ, Option A, অপশন ক, রোমান বা সরাসরি অপশনের লেখার সাথে মিলিয়ে 0-based index বের করা
      const parseCorrectAnswer = (rawAns: string, optionsList?: string[]): number => {
        if (!rawAns && rawAns !== '0') return 0;
        const str = rawAns.toString().trim();

        // 1. Check exact match with options text if options provided
        if (optionsList && optionsList.length > 0) {
          const directIdx = optionsList.findIndex(opt => opt.trim().toLowerCase() === str.toLowerCase());
          if (directIdx !== -1) return directIdx;
        }

        // Clean prefix like 'Option A', 'অপশন ১', 'Ans: B', 'উত্তর: ক', brackets, dots, colons
        const clean = str
          .replace(/^(option|opt|অপশন|answer|ans|উত্তর|সঠিক উত্তর)\s*[\:\-\.]?\s*/i, '')
          .replace(/^[\(\[\{]/, '')
          .replace(/[\)\]\}\.\:\#\s]/g, '')
          .trim()
          .toLowerCase();
        
        // 1st option: 1, ১, a, A, এ, ক, i, first, এক, প্রথম
        if (clean === '1' || clean === '১' || clean === 'a' || clean === 'এ' || clean === 'ক' || clean === 'i' || clean === 'first' || clean === 'এক' || clean === 'প্রথম') return 0;
        
        // 2nd option: 2, ২, b, B, বি, খ, ii, second, দুই, দ্বিতীয়
        if (clean === '2' || clean === '২' || clean === 'b' || clean === 'বি' || clean === 'খ' || clean === 'ii' || clean === 'second' || clean === 'দুই' || clean === 'দ্বিতীয়') return 1;
        
        // 3rd option: 3, ৩, c, C, সি, গ, iii, third, তিন, তৃতীয়
        if (clean === '3' || clean === '৩' || clean === 'c' || clean === 'সি' || clean === 'গ' || clean === 'iii' || clean === 'third' || clean === 'তিন' || clean === 'তৃতীয়') return 2;
        
        // 4th option: 4, ৪, d, D, ডি, ঘ, iv, fourth, চার, চতুর্থ
        if (clean === '4' || clean === '৪' || clean === 'd' || clean === 'ডি' || clean === 'ঘ' || clean === 'iv' || clean === 'fourth' || clean === 'চার' || clean === 'চতুর্থ') return 3;

        // 5th option: 5, ৫, e, E, ই, ঙ, v, fifth, পাঁচ, পঞ্চম
        if (clean === '5' || clean === '৫' || clean === 'e' || clean === 'ই' || clean === 'ঙ' || clean === 'v' || clean === 'fifth' || clean === 'পাঁচ' || clean === 'পঞ্চম') return 4;

        // 6th option: 6, ৬, f, F, এফ, চ, vi, sixth, ছয়, ষষ্ঠ
        if (clean === '6' || clean === '৬' || clean === 'f' || clean === 'এফ' || clean === 'চ' || clean === 'vi' || clean === 'sixth' || clean === 'ছয়' || clean === 'ষষ্ঠ') return 5;

        // Bengali number to English digit mapping fallback
        const bnToEnMap: Record<string, string> = { '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6' };
        const converted = clean.replace(/[১২৩৪৫৬]/g, d => bnToEnMap[d] || d);
        const parsed = parseInt(converted, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
          return parsed - 1;
        }

        // Secondary partial check with options text
        if (optionsList && optionsList.length > 0) {
          const matchIdx = optionsList.findIndex(opt => {
            const cleanOpt = opt.trim().toLowerCase();
            return cleanOpt === clean || cleanOpt.includes(clean) || clean.includes(cleanOpt);
          });
          if (matchIdx !== -1) return matchIdx;
        }

        return 0;
      };

      const newQuestions: Question[] = json.map((row, index) => {
        const rawText = getRowValue(row, [
          'Question', 'Questions', 'প্রশ্ন', 'Q', 'Ques', 'QuestionText', 'Question Text'
        ]);

        const opt1 = getRowValue(row, [
          'Option 1', 'Option1', 'অপশন ১', 'অপশন১', 'Option A', 'OptionA', 'Option a', 'অপশন এ', 'অপশনএ', 'ক', 'অপশন ক', 'অপশনক', 'A', 'a', 'Opt 1', 'Opt A', '1', '১'
        ]);

        const opt2 = getRowValue(row, [
          'Option 2', 'Option2', 'অপশন ২', 'অপশন২', 'Option B', 'OptionB', 'Option b', 'অপশন বি', 'অপশনবি', 'খ', 'অপশন খ', 'অপশনখ', 'B', 'b', 'Opt 2', 'Opt B', '2', '২'
        ]);

        const opt3 = getRowValue(row, [
          'Option 3', 'Option3', 'অপশন ৩', 'অপশন৩', 'Option C', 'OptionC', 'Option c', 'অপশন সি', 'অপশনসি', 'গ', 'অপশন গ', 'অপশনগ', 'C', 'c', 'Opt 3', 'Opt C', '3', '৩'
        ]);

        const opt4 = getRowValue(row, [
          'Option 4', 'Option4', 'অপশন ৪', 'অপশন৪', 'Option D', 'OptionD', 'Option d', 'অপশন ডি', 'অপশনডি', 'ঘ', 'অপশন ঘ', 'অপশনঘ', 'D', 'd', 'Opt 4', 'Opt D', '4', '৪'
        ]);

        const rawAns = getRowValue(row, [
          'Correct Option', 'Correct Answer', 'Correct', 'Answer', 'Ans', 'সঠিক উত্তর', 'উত্তর', 'সঠিক অপশন', 'সঠিক', 'CorrectOption', 'CorrectAns', 'Right Option', 'Right Answer'
        ]);

        const rawExp = getRowValue(row, [
          'Explanation', 'ব্যাখ্যা', 'Explain', 'Solution', 'সমাধান'
        ]);

        const rawTags = getRowValue(row, [
          'Tags', 'ট্যাগ', 'Tag'
        ]);

        const rawSubj = getRowValue(row, [
          'Subject', 'বিষয়', 'সাবজেক্ট', 'Section', 'বিভাগ'
        ]);

        const resolvedOptions = [opt1, opt2, opt3, opt4].filter(o => o !== '');

        return {
          id: Date.now().toString() + index,
          text: rawText,
          options: resolvedOptions,
          correctAnswer: parseCorrectAnswer(rawAns, resolvedOptions),
          explanation: rawExp,
          tags: rawTags,
          subject: rawSubj
        };
      }).filter(q => q.text !== ''); // Filter out empty rows

      setQuestions(prev => {
        const merged = [...prev, ...newQuestions];
        const updatedSubjects = Array.from(new Set(merged.map(q => q.subject).filter(s => s.trim() !== '')));
        
        if (updatedSubjects.length > 0) {
          setHasSections(true);
          setDetectedSubjects(updatedSubjects);
          // Auto add new subjects to compulsory by default
          setCompulsorySubjects(curr => {
            const newComp = updatedSubjects.filter(s => !curr.includes(s));
            return [...curr, ...newComp];
          });
        }
        return merged;
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Question': 'একটি বস্তুর ভর $m = 2\\text{ kg}$ এবং ত্বরণ $a = 5\\text{ ms}^{-2}$ হলে প্রযুক্ত বল কত?',
        'Option 1': '5 N',
        'Option 2': '10 N',
        'Option 3': '15 N',
        'Option 4': '20 N',
        'Correct Option': '2',
        'Explanation': 'আমরা জানি, $F = ma = 2 \\times 5 = 10\\text{ N}$।',
        'Subject': 'Physics',
        'Tags': 'DU 2023, বলবিদ্যা'
      },
      {
        'Question': 'পানির রাসায়নিক সংকেত কোনটি?',
        'Option 1': 'CO2',
        'Option 2': 'H2O',
        'Option 3': 'NaCl',
        'Option 4': 'O2',
        'Correct Option': 'B',
        'Explanation': 'পানি হাইড্রোজেন এবং অক্সিজেন দ্বারা গঠিত যৌগ যার সংকেত H2O।',
        'Subject': 'Chemistry',
        'Tags': 'রসায়ন ১ম পত্র'
      },
      {
        'Question': '$\\int x^2 dx$ এর মান কত?',
        'Option 1': '$2x + c$',
        'Option 2': '$\\frac{x^3}{3} + c$',
        'Option 3': '$\\frac{x^2}{2} + c$',
        'Option 4': '$x^3 + c$',
        'Correct Option': 'খ',
        'Explanation': 'আমরা জানি, $\\int x^n dx = \\frac{x^{n+1}}{n+1} + c$',
        'Subject': 'Math',
        'Tags': 'ক্যালকুলাস'
      },
      {
        'Question': 'বাংলাদেশের সংবিধান কত সালে প্রণীত হয়?',
        'Option 1': '1971',
        'Option 2': '1972',
        'Option 3': '1973',
        'Option 4': '1975',
        'Correct Option': '২',
        'Explanation': '১৯৭২ সালের ৪ নভেম্বর বাংলাদেশের সংবিধান গৃহীত হয় এবং ১৬ ডিসেম্বর থেকে কার্যকর হয়।',
        'Subject': 'General Knowledge',
        'Tags': 'সাধারণ জ্ঞান'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 55 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 45 },
      { wch: 18 },
      { wch: 22 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'porikkhaghor_sample_questions.xlsx');
  };

  const addManualQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      tags: '',
      subject: ''
    }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update unique subjects dynamically if they type a new subject manually
    if (field === 'subject') {
      const allSubjects = Array.from(new Set(updated.map(q => q.subject).filter(s => s.trim() !== '')));
      if (allSubjects.length > 0) {
        setHasSections(true);
        setDetectedSubjects(allSubjects);
        // keep only subjects that still exist
        setCompulsorySubjects(curr => curr.filter(c => allSubjects.includes(c)));
      } else {
        setHasSections(false);
        setDetectedSubjects([]);
        setCompulsorySubjects([]);
      }
    }
    
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    const allSubjects = Array.from(new Set(updated.map(q => q.subject).filter(s => s.trim() !== '')));
    if (allSubjects.length === 0) setHasSections(false);
    setDetectedSubjects(allSubjects);
    setCompulsorySubjects(curr => curr.filter(c => allSubjects.includes(c)));
    setQuestions(updated);
  };

  // Active target for Symbol Toolbar insertion
  const [activeTarget, setActiveTarget] = useState<{
    qIndex: number;
    field: 'text' | 'explanation' | number;
  }>({ qIndex: 0, field: 'text' });

  const lastFocusedInputRef = useRef<{
    element: HTMLInputElement | HTMLTextAreaElement;
    qIndex: number;
    field: 'text' | 'explanation' | number;
  } | null>(null);

  const activeTargetLabel = useMemo(() => {
    if (!questions[activeTarget.qIndex]) return undefined;
    const qNum = activeTarget.qIndex + 1;
    if (activeTarget.field === 'text') return `প্রশ্ন ${qNum} (মূল প্রশ্ন)`;
    if (activeTarget.field === 'explanation') return `প্রশ্ন ${qNum} (ব্যাখ্যা)`;
    return `প্রশ্ন ${qNum} (অপশন ${Number(activeTarget.field) + 1})`;
  }, [activeTarget, questions]);

  const handleInsertSymbol = (symbol: string) => {
    if (questions.length === 0) {
      addManualQuestion();
    }

    const target = lastFocusedInputRef.current;
    if (target && target.element) {
      const el = target.element;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const currentVal = el.value;
      const newVal = currentVal.substring(0, start) + symbol + currentVal.substring(end);

      if (target.field === 'text') {
        updateQuestion(target.qIndex, 'text', newVal);
      } else if (target.field === 'explanation') {
        updateQuestion(target.qIndex, 'explanation', newVal);
      } else if (typeof target.field === 'number') {
        updateOption(target.qIndex, target.field, newVal);
      }

      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + symbol.length, start + symbol.length);
      }, 10);
    } else {
      const targetQ = activeTarget ? activeTarget.qIndex : 0;
      const targetField = activeTarget ? activeTarget.field : 'text';
      if (questions[targetQ]) {
        if (targetField === 'text') {
          updateQuestion(targetQ, 'text', (questions[targetQ].text || '') + symbol);
        } else if (targetField === 'explanation') {
          updateQuestion(targetQ, 'explanation', (questions[targetQ].explanation || '') + symbol);
        } else if (typeof targetField === 'number') {
          updateOption(targetQ, targetField, (questions[targetQ].options[targetField] || '') + symbol);
        }
      }
    }
  };

  const duplicateQuestion = (index: number) => {
    const original = questions[index];
    const cloned: Question = {
      ...original,
      id: Date.now().toString(),
      options: [...original.options]
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, cloned);
    setQuestions(updated);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setQuestions(updated);
  };

  const clearOptions = (index: number) => {
    const updated = [...questions];
    updated[index].options = ['', '', '', ''];
    setQuestions(updated);
  };

  const addOptionToQuestion = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) return;
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const removeOptionFromQuestion = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      alert('কমপক্ষে ২টি অপশন থাকতে হবে।');
      return;
    }
    updated[qIndex].options.splice(optIndex, 1);
    if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
      updated[qIndex].correctAnswer = 0;
    }
    setQuestions(updated);
  };

  const addOptionalRule = () => {
    setOptionalRules([...optionalRules, {
      id: Date.now().toString(),
      title: 'নতুন ঐচ্ছিক নিয়ম',
      choices: [
        { label: 'Option 1', subjects: [] },
        { label: 'Option 2', subjects: [] }
      ]
    }]);
  };

  const addGroupRule = () => {
    setGroupRules([...groupRules, {
      id: Date.now().toString(),
      title: 'গুচ্ছ বা কাস্টম বাছাই নিয়ম',
      totalRequired: 2,
      groups: [
        { label: 'গ্রুপ ১', subjects: [], minSelect: 1, maxSelect: 2 },
        { label: 'গ্রুপ ২', subjects: [], minSelect: 0, maxSelect: 1 }
      ]
    }]);
  };

  const saveExam = async () => {
    if (!title || questions.length === 0) {
      alert('অনুগ্রহ করে পরীক্ষার নাম এবং অন্তত একটি প্রশ্ন যোগ করুন।');
      return;
    }

    const finalCategory = (isCustomCategory ? customCategory : selectedCategory).trim() || 'সাধারণ';
    const finalSubCategory = subCategory.trim();

    try {
      setIsSaving(true);
      await addDoc(collection(db, 'exams'), {
        title,
        category: finalCategory,
        subCategory: finalSubCategory,
        timeLimit,
        marksPerQuestion: Number(marksPerQuestion) || 1,
        negativeMarking: negativeMarking !== undefined ? Number(negativeMarking) : 0.25,
        admissionPattern: admissionPattern || 'custom',
        isPaid,
        hasSections,
        compulsorySubjects,
        simpleOptionalSubjects,
        optionalSelectionCount,
        groupRules,
        optionalRules,
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
        questions: questions 
      });
      sessionStorage.removeItem('porikkhaghor_cached_exams');
      sessionStorage.removeItem('porikkhaghor_cached_exams_time');
      alert('পরীক্ষা সফলভাবে তৈরি হয়েছে!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('পরীক্ষা সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPreset = ADMISSION_PRESETS.find(p => p.id === admissionPattern) || ADMISSION_PRESETS[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-light dark:text-primary-dark">নতুন পরীক্ষা তৈরি</h1>
        <button 
          onClick={saveExam}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Save size={20} />
          {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </button>
      </div>

      {/* Exam Settings Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <h2 className="text-xl font-bold mb-4">পরীক্ষার বিস্তারিত তথ্য</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">পরীক্ষার নাম *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700" placeholder="যেমন: ভৌত জগৎ ও পরিমাপ - স্পেশাল পরীক্ষা" />
          </div>

          {/* Category / Main Folder */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">ক্যাটাগরি / মূল ফোল্ডার *</label>
              <button 
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) setCustomCategory('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <FolderPlus size={14} />
                {isCustomCategory ? 'তালিকায় থাকা ক্যাটাগরি বেছে নিন' : '+ নতুন ক্যাটাগরি তৈরি'}
              </button>
            </div>

            {isCustomCategory ? (
              <input 
                type="text" 
                value={customCategory} 
                onChange={e => setCustomCategory(e.target.value)} 
                className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-light" 
                placeholder="নতুন ক্যাটাগরির নাম লিখুন (যেমন: Textile Model Test)" 
              />
            ) : (
              <select 
                value={selectedCategory} 
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsCustomCategory(true);
                    setCustomCategory('');
                  } else {
                    setSelectedCategory(e.target.value);
                  }
                }}
                className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 bg-white dark:text-white"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__NEW__">+ নতুন ক্যাটাগরি / ফোল্ডার তৈরি করুন...</option>
              </select>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">একই বিষয়ের সব পরীক্ষা একই ফোল্ডারে জমা হবে</p>
          </div>

          {/* Sub-Category / Chapter Folder */}
          <div>
            <label className="block text-sm font-medium mb-1">সাব-ফোল্ডার বা চ্যাপ্টার (ঐচ্ছিক)</label>
            <input 
              type="text" 
              value={subCategory} 
              onChange={e => setSubCategory(e.target.value)} 
              className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
              placeholder="যেমন: ১ম পত্র, পেপার ফাইনাল, বা অধ্যায় ভিত্তিক" 
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['১ম পত্র', '২য় পত্র', 'পেপার ফাইনাল', 'অধ্যায় ভিত্তিক', 'মডেল টেস্ট'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSubCategory(chip)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700 transition-colors"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">সময় (মিনিট)</label>
            <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">প্রতি প্রশ্নের মান</label>
              <input type="number" value={marksPerQuestion} onChange={e => setMarksPerQuestion(Number(e.target.value))} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">নেগেটিভ মার্কিং</label>
              <input type="number" step="0.25" value={negativeMarking} onChange={e => setNegativeMarking(Number(e.target.value))} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input type="checkbox" id="isPaid" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-5 h-5 accent-accent-light" />
            <label htmlFor="isPaid" className="font-medium">এটি একটি পেইড (Paid) পরীক্ষা</label>
          </div>
        </div>
      </div>

      {/* ADMISSION PATTERN / PRESET SELECTION CARD */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 border-l-4 border-l-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🎯 ভর্তি পরীক্ষার ধরন ও বিষয় লজিক (Admission Preset)
          </h2>
          <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold rounded-full border border-blue-200 dark:border-blue-800">
            স্বয়ংক্রিয় সাবজেক্ট রুলস
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          যে বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষার জন্য প্রশ্ন তৈরি করছেন সেটি নির্বাচন করুন। সিস্টেম স্বয়ংক্রিয়ভাবে উক্ত বিশ্ববিদ্যালয়ের অফিশিয়াল বাধ্যবাধকতা ও ঐচ্ছিক সাবজেক্ট লজিক শিক্ষার্থীদের জন্য প্রয়োগ করবে।
        </p>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
            ইউনিভার্সিটি / এক্সাম প্যাটার্ন নির্বাচন করুন:
          </label>
          <select
            value={admissionPattern}
            onChange={(e) => setAdmissionPattern(e.target.value)}
            className="w-full p-3 border-2 border-blue-200 dark:border-blue-900/60 rounded-xl dark:bg-gray-800 dark:text-white font-medium focus:border-blue-500 bg-white"
          >
            <option value="custom">⚙️ কাস্টম নিয়ম (Custom Rules - যেকোনো বিভাগ / সাধারণ পরীক্ষা)</option>
            <optgroup label="🏛️ সাধারণ ও বিজ্ঞান বিশ্ববিদ্যালয়সমূহ">
              <option value="du_a">১. ঢাকা বিশ্ববিদ্যালয় (ক ইউনিট) ও ৭ কলেজ (বিজ্ঞান)</option>
              <option value="gst_a">২. গুচ্ছ বিজ্ঞান (GST - এ ইউনিট)</option>
              <option value="ru_c">৩. রাজশাহী বিশ্ববিদ্যালয় (সি ইউনিট - বিজ্ঞান)</option>
              <option value="cu_a">৪. চট্টগ্রাম বিশ্ববিদ্যালয় (এ ইউনিট)</option>
              <option value="ju_a">৫. জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (এ ইউনিট - গাণিতিক ও পদার্থ)</option>
              <option value="ju_d">৫. জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (ডি ইউনিট - জীববিজ্ঞান অনুষদ)</option>
              <option value="agri_gst">৯. কৃষি গুচ্ছ (Agri GST)</option>
            </optgroup>
            <optgroup label="⚙️ ইঞ্জিনিয়ারিং ও প্রযুক্তি">
              <option value="buet">৬. বুয়েট (BUET)</option>
              <option value="ckruet">৬. প্রকৌশল গুচ্ছ (CKRUET - চুয়েট, কুয়েট, রুয়েট)</option>
              <option value="butex">৭. বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয় (BUTEX)</option>
            </optgroup>
            <optgroup label="🩺 মেডিকেল ও স্বাস্থ্য">
              <option value="medical">৮. মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (MBBS / BDS)</option>
            </optgroup>
          </select>
        </div>

        {/* Selected Preset Details Box */}
        {admissionPattern !== 'custom' ? (
          <div className="bg-blue-50/70 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                {selectedPreset.name}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">
                {selectedPreset.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 self-center">বাধ্যতামূলক বিষয়:</span>
              {selectedPreset.compulsoryDisplay.map(subj => (
                <span key={subj} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800 shadow-2xs">
                  ✅ {subj}
                </span>
              ))}
            </div>

            {selectedPreset.optionalDisplay && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 self-center">ঐচ্ছিক/বিকল্প বিষয়:</span>
                {selectedPreset.optionalDisplay.map(subj => (
                  <span key={subj} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium border border-gray-200 dark:border-gray-700 shadow-2xs">
                    🔹 {subj}
                  </span>
                ))}
              </div>
            )}

            {selectedPreset.sustWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-medium">
                ⚠️ <strong>সতর্কতা (SUST):</strong> শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের (সাস্ট) ইঞ্জিনিয়ারিং বা ফিজিক্যাল সায়েন্সের বিষয় পেতে হলে গণিত বাধ্যতামূলক এবং বায়োলজিক্যাল সায়েন্স পেতে হলে জীববিজ্ঞান বাধ্যতামূলক—এই সতর্কতা সাবজেক্ট নির্বাচনের সময় শিক্ষার্থীকে প্রদর্শিত হবে।
              </div>
            )}

            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              💡 স্টুডেন্ট যখন পরীক্ষায় ঢুকবে, তখন সিস্টেম তাকে শুধুমাত্র নিয়মানুযায়ী সঠিক অপশনগুলো বাছাই করতে দেবে। অতিরিক্ত বা অবৈধ কোনো কম্বিনেশন দাগানোর সুযোগ থাকবে না।
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs text-gray-600 dark:text-gray-400">
            ℹ️ কাস্টম নিয়মে আপনি নিচে থেকে নিজের মতো করে বাধ্যতামূলক বিষয়, সরল ঐচ্ছিক বিষয় বা গ্রুপ রুলস তৈরি করতে পারবেন। সায়েন্স ছাড়াও আর্টস বা কমার্সের পরীক্ষার জন্য এটি ব্যবহার করুন।
          </div>
        )}
      </div>

      {/* Section / Subject Configuration (Active when custom or when questions detected) */}
      {(admissionPattern === 'custom' || (hasSections && detectedSubjects.length > 0)) && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 border-l-4 border-l-primary-light">
          <h2 className="text-lg font-bold mb-4">
            {admissionPattern === 'custom' ? 'কাস্টম বিষয়ভিত্তিক সেটিংস (Subject Sections)' : 'শনাক্তকৃত বিষয়সমূহ (Detected Subjects in Questions)'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {admissionPattern === 'custom' 
              ? 'আপনার প্রশ্নে কিছু বিষয় শনাক্ত হয়েছে। নিচে থেকে কোনগুলো বাধ্যতামূলক ও ঐচ্ছিক তা নির্বাচন করুন।' 
              : 'প্রশ্নে প্রাপ্ত বিষয়সমূহ নিচে প্রদর্শিত হলো:'}
          </p>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-3">শনাক্তকৃত বিষয়সমূহ:</h3>
            <div className="flex flex-wrap gap-3">
              {detectedSubjects.map(subj => (
                <label key={subj} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={compulsorySubjects.includes(subj)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCompulsorySubjects([...compulsorySubjects, subj]);
                      } else {
                        setCompulsorySubjects(compulsorySubjects.filter(c => c !== subj));
                      }
                    }}
                    className="w-4 h-4 accent-primary-light"
                  />
                  <span>{subj}</span>
                </label>
              ))}
            </div>
          </div>

          {admissionPattern === 'custom' && (
            <>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">সরল ঐচ্ছিক বিষয়সমূহ (Simple Optional Subjects)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">স্টুডেন্ট এই লিস্ট থেকে যেকোনো নির্দিষ্ট সংখ্যক বিষয় নির্বাচন করবে। (এটি গুচ্ছ বা বান্ডেল সিস্টেম নয়)</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {detectedSubjects.filter(s => !compulsorySubjects.includes(s)).map(subj => (
                <label key={subj} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={simpleOptionalSubjects.includes(subj)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSimpleOptionalSubjects([...simpleOptionalSubjects, subj]);
                      } else {
                        setSimpleOptionalSubjects(simpleOptionalSubjects.filter(c => c !== subj));
                      }
                    }}
                    className="w-4 h-4 accent-primary-light"
                  />
                  <span>{subj}</span>
                </label>
              ))}
            </div>
            {simpleOptionalSubjects.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">এই ঐচ্ছিক বিষয়গুলো থেকে শিক্ষার্থী কয়টি সিলেক্ট করতে পারবে?</label>
                <input 
                  type="number" 
                  min="1" 
                  max={simpleOptionalSubjects.length}
                  value={optionalSelectionCount}
                  onChange={(e) => setOptionalSelectionCount(Number(e.target.value))}
                  className="w-16 p-1 border rounded text-center dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            )}
          </div>



          {/* ADVANCED GROUP RULES */}
          <div className="mb-8 border-l-4 border-l-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-r-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">অ্যাডভান্সড গ্রুপ লজিক (Advanced Group Rules)</h3>
                <p className="text-xs text-blue-600/90 dark:text-blue-300/90 mt-1">গুচ্ছ বা জটিল লজিকের জন্য (যেমন: অপশন ১ থেকে অন্তত ১টি নিতেই হবে, বাকিটি অপশন ২ থেকে)</p>
              </div>
              <button 
                onClick={addGroupRule}
                className="text-sm flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} /> নতুন অ্যাডভান্সড লজিক যোগ করুন
              </button>
            </div>

            <div className="space-y-6">
              {groupRules.map((rule, ruleIdx) => (
                <div key={rule.id} className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 shadow-sm relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">লজিকের নাম (যেমন: গুচ্ছ ঐচ্ছিক)</label>
                      <input 
                        type="text" 
                        value={rule.title}
                        onChange={(e) => {
                          const newRules = [...groupRules];
                          newRules[ruleIdx].title = e.target.value;
                          setGroupRules(newRules);
                        }}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="block text-xs font-medium text-gray-500 mb-1">মোট সিলেক্ট করতে হবে (Total):</label>
                      <input 
                        type="number" 
                        min="1"
                        value={rule.totalRequired}
                        onChange={(e) => {
                          const newRules = [...groupRules];
                          newRules[ruleIdx].totalRequired = Number(e.target.value);
                          setGroupRules(newRules);
                        }}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <button 
                      onClick={() => setGroupRules(groupRules.filter((_, i) => i !== ruleIdx))}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                      title="মুছে ফেলুন"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {rule.groups.map((group, groupIdx) => (
                      <div key={groupIdx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">গ্রুপের নাম (যেমন: Option 1)</label>
                            <input 
                              type="text" 
                              value={group.label}
                              onChange={(e) => {
                                const newRules = [...groupRules];
                                newRules[ruleIdx].groups[groupIdx].label = e.target.value;
                                setGroupRules(newRules);
                              }}
                              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white"
                            />
                          </div>
                          <div className="flex gap-4">
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">সর্বনিম্ন (Min)</label>
                              <input 
                                type="number" 
                                min="0"
                                value={group.minSelect}
                                onChange={(e) => {
                                  const newRules = [...groupRules];
                                  newRules[ruleIdx].groups[groupIdx].minSelect = Number(e.target.value);
                                  setGroupRules(newRules);
                                }}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">সর্বোচ্চ (Max)</label>
                              <input 
                                type="number" 
                                min="1"
                                value={group.maxSelect}
                                onChange={(e) => {
                                  const newRules = [...groupRules];
                                  newRules[ruleIdx].groups[groupIdx].maxSelect = Number(e.target.value);
                                  setGroupRules(newRules);
                                }}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const newRules = [...groupRules];
                                newRules[ruleIdx].groups = newRules[ruleIdx].groups.filter((_, i) => i !== groupIdx);
                                setGroupRules(newRules);
                              }}
                              className="self-end mb-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">এই গ্রুপের অন্তর্ভুক্ত বিষয়সমূহ:</label>
                          <div className="flex flex-wrap gap-2">
                            {detectedSubjects.filter(s => !compulsorySubjects.includes(s)).map(subj => (
                              <label key={subj} className="flex items-center gap-1.5 text-sm cursor-pointer bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                <input 
                                  type="checkbox" 
                                  checked={group.subjects.includes(subj)}
                                  onChange={(e) => {
                                    const newRules = [...groupRules];
                                    const currentGroup = newRules[ruleIdx].groups[groupIdx];
                                    if (e.target.checked) {
                                      currentGroup.subjects.push(subj);
                                    } else {
                                      currentGroup.subjects = currentGroup.subjects.filter(s => s !== subj);
                                    }
                                    setGroupRules(newRules);
                                  }}
                                  className="accent-blue-500"
                                />
                                {subj}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const newRules = [...groupRules];
                        newRules[ruleIdx].groups.push({ 
                          label: `Option ${newRules[ruleIdx].groups.length + 1}`, 
                          subjects: [], 
                          minSelect: 0, 
                          maxSelect: 1 
                        });
                        setGroupRules(newRules);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-2"
                    >
                      <Plus size={16} /> আরও একটি গ্রুপ যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">ঐচ্ছিক বিষয়/বান্ডেল (Optional Rules)</h3>
              <button 
                onClick={addOptionalRule}
                className="text-sm flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <Plus size={16} /> নতুন নিয়ম যোগ করুন
              </button>
            </div>

            <div className="space-y-4">
              {optionalRules.map((rule, ruleIdx) => (
                <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                  <button 
                    onClick={() => setOptionalRules(optionalRules.filter(r => r.id !== rule.id))}
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="mb-4 pr-8">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">নিয়মের শিরোনাম (যেমন: গুচ্ছ ঐচ্ছিক বা ৪র্থ বিষয়)</label>
                    <input 
                      type="text" 
                      value={rule.title}
                      onChange={(e) => {
                        const newRules = [...optionalRules];
                        newRules[ruleIdx].title = e.target.value;
                        setOptionalRules(newRules);
                      }}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                    <label className="block text-sm font-medium">শিক্ষার্থী নিচের অপশনগুলো থেকে যেকোনো একটি বাছাই করতে পারবে:</label>
                    {rule.choices.map((choice, choiceIdx) => (
                      <div key={choiceIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={choice.label}
                            onChange={(e) => {
                              const newRules = [...optionalRules];
                              newRules[ruleIdx].choices[choiceIdx].label = e.target.value;
                              setOptionalRules(newRules);
                            }}
                            placeholder="যেমন: Math + Biology"
                            className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">অন্তর্ভুক্ত বিষয়সমূহ:</div>
                          <div className="flex flex-wrap gap-2">
                            {detectedSubjects.map(subj => (
                              <label key={subj} className="flex items-center gap-1 text-xs cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={choice.subjects.includes(subj)}
                                  onChange={(e) => {
                                    const newRules = [...optionalRules];
                                    const currentSubjects = newRules[ruleIdx].choices[choiceIdx].subjects;
                                    if (e.target.checked) {
                                      newRules[ruleIdx].choices[choiceIdx].subjects = [...currentSubjects, subj];
                                    } else {
                                      newRules[ruleIdx].choices[choiceIdx].subjects = currentSubjects.filter(s => s !== subj);
                                    }
                                    setOptionalRules(newRules);
                                  }}
                                  className="accent-primary-light"
                                />
                                <span>{subj}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const newRules = [...optionalRules];
                            newRules[ruleIdx].choices = newRules[ruleIdx].choices.filter((_, i) => i !== choiceIdx);
                            setOptionalRules(newRules);
                          }}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const newRules = [...optionalRules];
                        newRules[ruleIdx].choices.push({ label: `Option ${newRules[ruleIdx].choices.length + 1}`, subjects: [] });
                        setOptionalRules(newRules);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 font-medium"
                    >
                      + আরও একটি অপশন যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Rapid Question Input Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <button 
          type="button"
          onClick={addManualQuestion} 
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary-light dark:border-blue-400/50 text-primary-light dark:text-blue-300 rounded-xl hover:bg-primary-light/5 dark:hover:bg-blue-400/10 transition-colors cursor-pointer group"
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform" />
          <span className="font-bold">ম্যানুয়ালি প্রশ্ন যোগ করুন</span>
        </button>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-accent-light text-accent-dark rounded-xl hover:bg-accent-light/5 transition-colors h-full cursor-pointer group">
            <FileSpreadsheet size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold">Excel/CSV ফাইল আপলোড</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={downloadSampleTemplate} 
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer group shadow-xs"
          title="প্রশ্ন সাজানোর রেডিমেড এক্সেল ফাইল ডাউনলোড করুন"
        >
          <Download size={22} className="group-hover:scale-110 transition-transform" />
          <span className="font-bold">নমুনা এক্সেল ডাউনলোড (.xlsx)</span>
        </button>
      </div>

      {/* Excel Format Guide Toggle & Detailed Panel */}
      <div className="mb-8">
        <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 px-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-blue-900 dark:text-blue-200 font-medium">
            <HelpCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>এক্সেলে প্রশ্ন কীভাবে লিখবেন বুঝতে সমস্যা হচ্ছে?</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <FileCheck size={14} />
            <span>{showFormatGuide ? 'নির্দেশিকা লুকান' : 'এক্সেল ফরম্যাট নির্দেশিকা দেখুন'}</span>
          </button>
        </div>

        {/* Detailed Format Instruction Drawer */}
        {showFormatGuide && (
          <div className="mt-3 p-5 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-2xl shadow-sm text-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={20} />
                এক্সেলে যে কলামগুলো থাকতে হবে (Excel Column Format)
              </h3>
              <button 
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors cursor-pointer"
              >
                <Download size={14} /> তৈরি করা ডেমো এক্সেল ফাইল নামিয়ে নিন
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              💡 <strong>সবচেয়ে সহজ উপায়:</strong> আপনি উপরের <strong>'নমুনা এক্সেল ডাউনলোড'</strong> বাটনে ক্লিক করে ডেমো ফাইলটি নামিয়ে নিন। ফাইলে কলামগুলো সাজানোই আছে—সেখানে ডেমো প্রশ্নগুলোর জায়গায় আপনার প্রশ্নগুলো লিখে সেভ করে আপলোড করে দিন!
            </p>

            {/* Table of Columns */}
            <div className="overflow-x-auto mb-4 border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2.5 font-bold">কলামের ইংরেজি নাম</th>
                    <th className="p-2.5 font-bold">অথবা বাংলায় নাম</th>
                    <th className="p-2.5 font-bold">বিবরণ ও উদাহরণ</th>
                    <th className="p-2.5 font-bold text-center">বাধ্যতামূলক?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Question</td>
                    <td className="p-2.5 font-semibold">প্রশ্ন</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">মূল প্রশ্নটি এখানে লিখবেন (যেমন: বলের একক কী?)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">হ্যাঁ</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Option 1 / Option A / 1 / A</td>
                    <td className="p-2.5 font-semibold">অপশন ১ / অপশন এ / ক</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">১ম উত্তরের অপশন (Option 1, Option A, ক, অপশন ১ বা A)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">হ্যাঁ</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Option 2 / Option B / 2 / B</td>
                    <td className="p-2.5 font-semibold">অপশন ২ / অপশন বি / খ</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">২য় উত্তরের অপশন (Option 2, Option B, খ, অপশন ২ বা B)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">হ্যাঁ</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Option 3 / Option C / 3 / C</td>
                    <td className="p-2.5 font-semibold">অপশন ৩ / অপশন সি / গ</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">৩য় উত্তরের অপশন (Option 3, Option C, গ, অপশন ৩ বা C)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ঐচ্ছিক</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Option 4 / Option D / 4 / D</td>
                    <td className="p-2.5 font-semibold">অপশন ৪ / অপশন ডি / ঘ</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">৪র্থ উত্তরের অপশন (Option 4, Option D, ঘ, অপশন ৪ বা D)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ঐচ্ছিক</span></td>
                  </tr>
                  <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                    <td className="p-2.5 font-mono font-semibold text-amber-600 dark:text-amber-400">Correct Option / Ans / Answer</td>
                    <td className="p-2.5 font-semibold text-amber-700 dark:text-amber-300">সঠিক উত্তর / উত্তর</td>
                    <td className="p-2.5 text-gray-700 dark:text-gray-300 font-medium">যেকোনো ফরম্যাটে লিখুন: <strong>1, 2, 3, 4</strong> অথবা <strong>A, B, C, D</strong> অথবা <strong>ক, খ, গ, ঘ</strong> (কিংবা ১, ২, ৩, ৪)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">হ্যাঁ</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Explanation</td>
                    <td className="p-2.5 font-semibold">ব্যাখ্যা</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">সঠিক উত্তরের ব্যাখ্যা (ছাত্রছাত্রীরা পরীক্ষা শেষে দেখবে)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ঐচ্ছিক</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Subject</td>
                    <td className="p-2.5 font-semibold">বিষয়</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">বিষয়ের নাম (যেমন: Physics, Chemistry, Math)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ঐচ্ছিক</span></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">Tags</td>
                    <td className="p-2.5 font-semibold">ট্যাগ</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">কমা দিয়ে ট্যাগ (যেমন: DU 2023, বোর্ড পরীক্ষা)</td>
                    <td className="p-2.5 text-center"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ঐচ্ছিক</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">✅ বহুমুখী অপশন কলাম:</span>
                আপনি এক্সেলে কলামের নাম হিসেবে 'Option 1..4', 'Option A..D', 'অপশন ১..৪', 'অপশন এ..ডি', কিংবা সরাসরি 'ক, খ, গ, ঘ'—যেকোনোটি ব্যবহার করতে পারেন।
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">✅ সঠিক উত্তর শনাক্তকরণ:</span>
                সঠিক উত্তরের কলামে 1, 2, 3, 4 কিংবা A, B, C, D কিংবা ক, খ, গ, ঘ অথবা ১, ২, ৩, ৪ (এমনকি Option A বা অপশন ক) লিখলেও সফটওয়্যার নির্ভুলভাবে সেট করে নেবে।
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">✅ গাণিতিক প্রতীক ও সমীকরণ:</span>
                এক্সেলে সরাসরি আলফা-বিটা ($\alpha, \beta, \gamma$), ডিগ্রি ($^\circ$), পাওয়ার ($ms^{-2}$) অথবা ল্যাটেক্স সমীকরণ লিখলেও নিমিষেই সুন্দরভাবে প্রদর্শিত হবে।
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKY SYMBOL TOOLBAR FOR EASY ACCESS */}
      {questions.length > 0 && (
        <div className="sticky top-[72px] z-30 mb-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-2xl shadow-md border border-blue-200 dark:border-blue-900">
          <SymbolToolbar onInsert={handleInsertSymbol} targetName={activeTargetLabel} />
        </div>
      )}

      {/* Question List Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>প্রশ্ন তালিকা</span>
          <span className="text-xs bg-primary-light/10 dark:bg-blue-400/15 text-primary-light dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold">
            {questions.length}টি প্রশ্ন
          </span>
        </h2>
        {questions.length > 0 && (
          <button 
            type="button" 
            onClick={addManualQuestion} 
            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Plus size={14} /> নতুন প্রশ্ন যোগ করুন
          </button>
        )}
      </div>

      {/* Question List */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div 
            key={q.id} 
            className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border transition-all ${
              activeTarget.qIndex === qIndex 
                ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            {/* Question Card Header */}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-light/10 dark:bg-blue-400/15 text-primary-light dark:text-blue-300 font-bold text-sm flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">প্রশ্ন {qIndex + 1}</span>
                {q.subject && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-600 dark:text-gray-400">
                    {q.subject}
                  </span>
                )}
              </div>

              {/* Action Buttons for this question */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveQuestion(qIndex, 'up')}
                  disabled={qIndex === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="প্রশ্নটি উপরে নিন"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qIndex, 'down')}
                  disabled={qIndex === questions.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="প্রশ্নটি নিচে নিন"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateQuestion(qIndex)}
                  className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer font-medium"
                  title="এই প্রশ্নটি হুবহু কপি বা ডুপ্লিকেট করুন"
                >
                  <Copy size={13} /> ডুপ্লিকেট
                </button>
                <button
                  type="button"
                  onClick={() => clearOptions(qIndex)}
                  className="text-xs flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="সবগুলো অপশন খালি করুন"
                >
                  <RotateCcw size={13} /> ক্লিয়ার
                </button>
                <button 
                  type="button"
                  onClick={() => removeQuestion(qIndex)} 
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="প্রশ্নটি মুছে ফেলুন"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Question Textarea */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                প্রশ্নের বিবরণ:
              </label>
              <textarea 
                value={q.text} 
                onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                onFocus={(e) => {
                  setActiveTarget({ qIndex, field: 'text' });
                  lastFocusedInputRef.current = { element: e.target, qIndex, field: 'text' };
                }}
                className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light/30 focus:border-primary-light outline-none transition-all text-base" 
                placeholder="প্রশ্নটি এখানে লিখুন (যেমন: একটি তারের ব্যাসার্ধ r = 0.5 mm, অসহ পীড়ন কত?)..."
                rows={2}
              />
            </div>

            {/* Live Math Preview for Question */}
            {q.text && (q.text.includes('$') || q.text.includes('\\')) && (
              <div className="mb-4 p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-sm text-blue-950 dark:text-blue-200">
                <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 block mb-1">ক্যাটেক্স/ম্যাথ লাইভ প্রিভিউ:</span>
                <MathText text={q.text} />
              </div>
            )}

            {/* Options List */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                অপশনসমূহ (সঠিক উত্তরের বাম পাশের গোল রেডিও বাটনে ক্লিক করুন):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={`correct-${q.id}`} 
                        checked={q.correctAnswer === optIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                        className="w-5 h-5 accent-green-600 cursor-pointer"
                        title="এই অপশনটিকে সঠিক উত্তর হিসেবে নির্বাচন করুন"
                      />
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                        onFocus={(e) => {
                          setActiveTarget({ qIndex, field: optIndex });
                          lastFocusedInputRef.current = { element: e.target, qIndex, field: optIndex };
                        }}
                        className={`flex-1 p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light/30 outline-none transition-all ${
                          q.correctAnswer === optIndex 
                            ? 'border-green-500 ring-2 ring-green-500/20 bg-green-50/20 dark:bg-green-950/10' 
                            : ''
                        }`}
                        placeholder={`অপশন ${optIndex + 1}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionFromQuestion(qIndex, optIndex)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          title="এই অপশনটি বাদ দিন"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {opt && (opt.includes('$') || opt.includes('\\')) && (
                      <div className="ml-7 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
                        <MathText text={opt} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add option button if less than 6 */}
              {q.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => addOptionToQuestion(qIndex)}
                  className="text-xs text-primary-light dark:text-primary-dark hover:underline flex items-center gap-1 mt-2.5 cursor-pointer font-medium"
                >
                  <Plus size={14} /> আরও একটি অপশন যোগ করুন (অপশন {q.options.length + 1})
                </button>
              )}
            </div>

            {/* Explanation & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ব্যাখ্যা (অপশনাল - ছাত্রছাত্রীরা পরীক্ষার পর দেখবে)</label>
                <textarea 
                  value={q.explanation} 
                  onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                  onFocus={(e) => {
                    setActiveTarget({ qIndex, field: 'explanation' });
                    lastFocusedInputRef.current = { element: e.target, qIndex, field: 'explanation' };
                  }}
                  className="w-full p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-light/30 outline-none" 
                  rows={2}
                  placeholder="সঠিক উত্তরের ব্যাখ্যা..."
                />
                {q.explanation && (q.explanation.includes('$') || q.explanation.includes('\\')) && (
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40 text-xs mt-1">
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
              <div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">বিষয় / সেকশন (Subject / Section)</label>
                  <input 
                    type="text" 
                    value={q.subject || ''} 
                    onChange={e => updateQuestion(qIndex, 'subject', e.target.value)}
                    className="w-full p-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-light/30 outline-none" 
                    placeholder="যেমন: Physics, Chemistry, Math"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ট্যাগ (যেমন: DU 2022, Board 2023)</label>
                  <input 
                    type="text" 
                    value={q.tags} 
                    onChange={e => updateQuestion(qIndex, 'tags', e.target.value)}
                    className="w-full p-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-light/30 outline-none" 
                    placeholder="কমা দিয়ে ট্যাগ লিখুন"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Add Question Button */}
      {questions.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={addManualQuestion}
            className="px-6 py-3 bg-white dark:bg-gray-900 border-2 border-dashed border-primary-light dark:border-blue-400/50 text-primary-light dark:text-blue-300 hover:bg-primary-light/5 dark:hover:bg-blue-400/10 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer shadow-xs"
          >
            <Plus size={20} /> আরও একটি প্রশ্ন যোগ করুন (প্রশ্ন {questions.length + 1})
          </button>
        </div>
      )}
    </motion.div>
  );
}
