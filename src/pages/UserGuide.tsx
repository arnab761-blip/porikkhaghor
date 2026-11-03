import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Clock, 
  Award, 
  Lock, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Zap 
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  summary: string;
  steps: {
    heading: string;
    description: string;
    tip?: string;
  }[];
}

export default function UserGuide() {
  const { toLangNumber, language } = useLanguage();
  const { user, userData, role } = useAuth();

  // Role Permissions:
  // 1. Master Admin (Developer/Owner - geminioperator5@gmail.com): All 3 (Teacher, Student, Client Pitch)
  // 2. Teacher / Admin (owner, assistant): Teacher & Student (NO Client Pitch)
  // 3. Student / Guest: Student Guide ONLY
  const isMasterAdmin = Boolean(
    (user?.email && user.email.toLowerCase().trim() === 'geminioperator5@gmail.com') ||
    userData?.isMasterAdmin === true
  );

  const isTeacher = Boolean(
    isMasterAdmin ||
    role === 'owner' ||
    role === 'assistant' ||
    userData?.role === 'owner' ||
    userData?.role === 'assistant'
  );

  const canViewTeacher = isTeacher;
  const canViewClient = isMasterAdmin;
  const canViewStudent = true;

  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'student' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(canViewTeacher ? 'create-exam' : 'student-exam');

  useEffect(() => {
    if (!canViewTeacher && expandedId === 'create-exam') {
      setExpandedId('student-exam');
    }
  }, [canViewTeacher, expandedId]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Bengali Guides
  const teacherGuidesBn: GuideSection[] = [
    {
      id: 'create-exam',
      title: 'নতুন পরীক্ষা তৈরি ও নেগেটিভ মার্কিং সেট করা',
      icon: Layers,
      summary: 'সাধারণ পরীক্ষা বা ঢাকা বিশ্ববিদ্যালয়/মেডিকেল/ইঞ্জিনিয়ারিং ভর্তি প্যাটার্নে পরীক্ষা তৈরি ও এক্সেল ফাইল থেকে প্রশ্ন ইম্পোর্ট।',
      steps: [
        {
          heading: '১. পরীক্ষা তৈরির পেজে প্রবেশ:',
          description: 'ড্যাশবোর্ড অথবা উপরের মেনু থেকে "নতুন পরীক্ষা তৈরি" (/create-exam) পেজে যান।'
        },
        {
          heading: '২. বেসিক তথ্য পূরণ:',
          description: 'পরীক্ষার শিরোনাম (Title), সময়সীমা (Time Limit), প্রতি প্রশ্নের মান এবং ক্যাটাগরি ও সাব-ক্যাটাগরি লিখুন। যেমন: ক্যাটাগরি: "HSC 2024", সাব-ক্যাটাগরি: "পদার্থবিজ্ঞান ১ম পত্র"। এতে ফোল্ডার আকারে সাজানো থাকবে।'
        },
        {
          heading: '৩. নেগেটিভ মার্কিং নির্ধারণ:',
          description: 'নেগেটিভ মার্কিং ইনপুটে ভুল উত্তরের জন্য কত নম্বর কাটা যাবে তা লিখুন (যেমন: 0.25)। যদি আপনি কোনো নেগেটিভ মার্কিং ছাড়া পরীক্ষা নিতে চান (যেমন ঢাকা ৭ কলেজ বা স্কুলের পরীক্ষা), তবে সেখানে 0 লিখে দিন। ০ রাখলে ভুল উত্তরের জন্য কোনো নম্বর কাটা হবে না।',
          tip: 'নেগেটিভ মার্কিং শূন্য (০) রাখলে শিক্ষার্থীদের এক্সাম কার্ডে "নেগেটিভ নেই (০)" গ্রিন ব্যাজ দেখাবে।'
        },
        {
          heading: '৪. এডমিশন প্যাটার্ন ও অপশনাল বিষয়:',
          description: 'যদি এটি কোনো বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষা হয় (যেমন: ঢাবি ক ইউনিট, গুচ্ছ ক ইউনিট, রাবি সি ইউনিট, চবি, বুয়েট, মেডিকেল), তবে এডমিশন প্যাটার্ন ড্রপডাউন থেকে সিলেক্ট করে দিন। এতে শিক্ষার্থীরা পরীক্ষার শুরুতে তাদের ঐচ্ছিক বিষয় (যেমন: উচ্চতর গণিত / জীববিজ্ঞান) বেছে নিয়ে পরীক্ষা দিতে পারবে।'
        },
        {
          heading: '৫. প্রশ্ন যুক্ত করার ২ টি মাধ্যম:',
          description: 'ক) সরাসরি ওয়েবসাইটে প্রশ্ন, অপশন ও ব্যাখ্যা লিখে "+ প্রশ্ন যোগ করুন" চাপুন (ম্যাথ ফর্মুলা KaTeX LaTeX স্বয়ংক্রিয়ভাবে রেন্ডার হয়)।\nখ) এক্সেল শিট থেকে ইম্পোর্ট: ওয়েবসাইটের ডেমো এক্সেল টেমপ্লেটটি ডাউনলোড করে তাতে প্রশ্ন সাজিয়ে ১ ক্লিকে আপলোড করলেই ১০০-১৫০টি প্রশ্ন একসাথে যুক্ত হয়ে যাবে।'
        }
      ]
    },
    {
      id: 'manage-packages',
      title: 'কোর্স প্যাকেজ ও কভার ছবি পরিচালনা',
      icon: Briefcase,
      summary: 'পরীক্ষা ও লেকচার শিটগুলোকে একসাথে বান্ডেল করে আকর্ষণীয় কোর্স প্যাকেজ হিসেবে তৈরি ও বিক্রি করার নিয়ম।',
      steps: [
        {
          heading: '১. প্যাকেজ তৈরি পেজে যান:',
          description: 'ড্যাশবোর্ড থেকে "প্যাকেজ ও কোর্স পরিচালনা" (/manage-packages) পেজে ক্লিক করুন।'
        },
        {
          heading: '২. প্যাকেজের বিবরণ ও মূল্য:',
          description: 'প্যাকেজের আকর্ষণীয় নাম (যেমন: "মেডিকেল ফাইনাল রিভিশন মডেল টেস্ট"), বিবরণ এবং মূল্য (টাকায়) লিখুন।'
        },
        {
          heading: '৩. কভার ছবি যুক্ত করা:',
          description: 'আপনার কোর্সের ব্যানার বা ছবির ডিরেক্ট URL (যেমন: ImgBB, PostImages, Google Drive বা যেকোনো ইমেজ লিঙ্ক) পেস্ট করুন। ওয়েবসাইটে স্বয়ংক্রিয়ভাবে ঝকঝকে ব্যানারসহ প্যাকেজ কার্ড তৈরি হয়ে যাবে।'
        },
        {
          heading: '৪. প্যাকেজে পরীক্ষা ও শিট যুক্ত করা:',
          description: 'ড্রপডাউন ও চেকবক্স থেকে বেছে নিন এই প্যাকেজ কিনলে শিক্ষার্থী কোন কোন পরীক্ষা দিতে পারবে এবং কোন কোন লেকচার শিটের পিডিএফ পড়তে পারবে। সেভ বাটনে চাপ দিলেই প্যাকেজটি লাইভ হয়ে যাবে।'
        }
      ]
    },
    {
      id: 'manage-students',
      title: 'শিক্ষার্থী খাতা দেখা ও প্যাকেজ/পরীক্ষা আনলক ম্যানেজমেন্ট',
      icon: Users,
      summary: 'শিক্ষার্থীর ইমেইল সার্চ করে তার সম্পূর্ণ ফলাফল দেখা এবং কেনা অনুযায়ী নির্দিষ্ট প্যাকেজ বা একক পরীক্ষা আনলক করা।',
      steps: [
        {
          heading: '১. শিক্ষার্থী অনুসন্ধান:',
          description: 'শিক্ষার্থী ম্যানেজমেন্ট (/manage-students) পেজে গিয়ে শিক্ষার্থীর নিবন্ধিত ইমেইলটি লিখে "খুঁজুন" বাটনে চাপ দিন।'
        },
        {
          heading: '২. দেওয়া পরীক্ষার ফলাফল ও খাতা পরীক্ষা:',
          description: 'শিক্ষার্থী কোন কোন পরীক্ষা দিয়েছে, কোন তারিখে দিয়েছে, কত নম্বর পেয়েছে, কয়টি সঠিক ও ভুল হয়েছে তা দেখা যাবে। "খাতা দেখুন" লিংকে চাপ দিলে সে কোন প্রশ্নে কি উত্তর দিয়েছিল এবং সঠিক সমাধান কি ছিল তা শিক্ষক লাইভ দেখতে পারবেন।'
        },
        {
          heading: '৩. নির্দিষ্ট প্যাকেজ আনলক (Granular Access):',
          description: 'শিক্ষার্থী যে প্যাকেজটি কিনেছে, শুধু সেই প্যাকেজের পাশে "এই প্যাকেজটি আনলক করুন" বাটনে চাপ দিন। এতে কেবল সেই প্যাকেজের ভেতরের পরীক্ষা ও শিটগুলো আনলক হবে। অন্যান্য প্যাকেজ ও বাইরের পরীক্ষা লকই থাকবে!'
        },
        {
          heading: '৪. একক পরীক্ষা বা একক পিডিএফ আনলক:',
          description: 'যদি কোনো শিক্ষার্থী প্যাকেজ না কিনে শুধুমাত্র ১টি নির্দিষ্ট পেইড পরীক্ষা বা ১টি লেকচার শিট কিনতে চায়, তবে ড্রপডাউন থেকে সেই নির্দিষ্ট পরীক্ষা বা রিসোর্স বেছে নিয়ে "+ আনলক করুন" দিন।'
        },
        {
          heading: '৫. অল-ইন-ওয়ান ভিআইপি পাস:',
          description: 'যদি শিক্ষক কোনো বিশেষ শিক্ষার্থীকে পুরো ওয়েবসাইটের সব প্যাকেজ ও পরীক্ষা একসাথে অ্যাক্সেস দিতে চান, তবে "অল-ইন-ওয়ান ভিআইপি এক্সেস" চালু করতে পারবেন।'
        }
      ]
    },
    {
      id: 'leaderboard-monitoring',
      title: 'পরীক্ষাভিত্তিক মেধা তালিকা (Leaderboard & Merits)',
      icon: Award,
      summary: 'প্রতিটি পরীক্ষায় শিক্ষার্থীদের র‍্যাংক ও প্রথম চেষ্টার (First Attempt) ভিত্তিতে মেধা তালিকা তৈরি।',
      steps: [
        {
          heading: '১. রিয়েল-টাইম মেধা তালিকা:',
          description: 'যেকোনো পরীক্ষার কার্ড থেকে "মেধা তালিকা" লিংকে চাপ দিন অথবা শিক্ষার্থী ম্যানেজমেন্টের ২য় ট্যাবে যান।'
        },
        {
          heading: '২. প্রথম চেষ্টা (First Attempt) ফিল্টার:',
          description: 'শিক্ষার্থীরা যাতে বারবার পরীক্ষা দিয়ে বেশি নম্বর বানিয়ে মেধা তালিকায় বিভ্রান্তি তৈরি করতে না পারে, সেজন্য সিস্টেম স্বয়ংক্রিয়ভাবে তাদের প্রথম প্রচেষ্টাকে "1st Attempt" হিসেবে চিহ্নিত করে এবং মেধা তালিকায় ১ম প্রচেষ্টার মার্কস প্রদর্শন করে।'
        },
        {
          heading: '৩. র‍্যাংক টাইব্রেকার নীতি:',
          description: '১ম: মোট প্রাপ্ত নম্বর (Score), ২য়: সঠিক উত্তরের সংখ্যা, ৩য়: কে কম সময়ে সাবমিট করেছে।'
        }
      ]
    },
    {
      id: 'doubt-system',
      title: 'শিক্ষার্থী-শিক্ষক ডাউট বক্স (Doubt Resolution)',
      icon: HelpCircle,
      summary: 'শিক্ষার্থীরা কোনো প্রশ্ন না বুঝলে প্রশ্ন থেকে সরাসরি শিক্ষককে ডাউট পাঠাতে পারে এবং শিক্ষক উত্তর দিতে পারেন।',
      steps: [
        {
          heading: '১. ডাউট নোটিফিকেশন:',
          description: 'কোনো শিক্ষার্থী কোনো প্রশ্নে খটকা লাগলে সেখান থেকে সরাসরি ডাউট সাবমিট করতে পারে। শিক্ষকের ড্যাশবোর্ডে ও নোটিফিকেশনে লাল ব্যাজ উঠবে।'
        },
        {
          heading: '২. শিক্ষক ডাউট পেজ:',
          description: '"ডাউট সমাধান (শিক্ষক)" পেজে গেলে সব শিক্ষার্থীর প্রশ্ন, সংশ্লিষ্ট পরীক্ষার প্রশ্নপত্র ও অপশন দেখা যাবে। শিক্ষক সেখানে বিস্তারিত ব্যাখ্যা লিখে উত্তর দিতে পারবেন।'
        }
      ]
    },
    {
      id: 'admin-settings',
      title: 'এডমিন সেটিংস, পেমেন্ট নম্বর ও সহকারী শিক্ষক নিয়োগ',
      icon: ShieldCheck,
      summary: 'কোচিংয়ের বিকাশ/নগদ নম্বর পরিবর্তন, টেলিগ্রাম চ্যানেল লিঙ্ক যুক্ত করা এবং সহকর্মী শিক্ষকদের এক্সেস দেওয়া।',
      steps: [
        {
          heading: '১. পেমেন্ট নম্বর পরিবর্তন:',
          description: 'এডমিন সেটিংস (/admin-settings) থেকে আপনার বিকাশ (Bkash), নগদ (Nagad), বা রকেট পার্সোনাল/মার্চেন্ট নম্বর এবং পেমেন্ট সংক্রান্ত বিশেষ নির্দেশনা লিখে সেভ করতে পারবেন। শিক্ষার্থীরা পেমেন্ট মডালে সেই নম্বর দেখতে পাবে।'
        },
        {
          heading: '২. সহকারী শিক্ষক (Assistant Teacher) নিয়োগ:',
          description: 'আপনার সাথে যদি অন্য কোনো শিক্ষক বা প্রশ্ন তৈরিকারক থাকেন, তবে ওনার জিমেইলটি "সহকারী শিক্ষক যোগ করুন" বক্সে লিখে সাবমিট করলেই উনি প্রশ্ন তৈরি ও রেজাল্ট দেখার এক্সেস পেয়ে যাবেন।'
        },
        {
          heading: '৩. এক ক্লিকে এক্সেস বাতিল:',
          description: 'সহকারী শিক্ষক তালিকা থেকে যেকোনো সময় ডিলিট বাটনে চাপ দিলে তার শিক্ষক এক্সেস তৎক্ষণাৎ বন্ধ হয়ে যাবে এবং সে সাধারণ শিক্ষার্থী হয়ে যাবে।'
        }
      ]
    }
  ];

  const studentGuidesBn: GuideSection[] = [
    {
      id: 'student-exam',
      title: 'পরীক্ষা দেওয়া ও টাইমার ব্যবস্থাপনা',
      icon: Clock,
      summary: 'লাইভ টাইমার, ওএমআর অপশন দাগানো ও পরীক্ষার নিয়মাবলী।',
      steps: [
        {
          heading: '১. পরীক্ষা শুরু করা:',
          description: 'পরীক্ষা তালিকা থেকে আপনার পছন্দের পরীক্ষাটি বেছে নিয়ে "Start Exam" বাটনে চাপ দিন।'
        },
        {
          heading: '২. অপশনাল বিষয় নির্বাচন (যদি প্রযোজ্য হয়):',
          description: 'ভর্তি পরীক্ষার ক্ষেত্রে শুরুতে আপনার আবশ্যিক ও ঐচ্ছিক বিষয়গুলো (যেমন: ম্যাথ / বায়োলজি) নির্বাচন করে পরীক্ষা শুরু করুন।'
        },
        {
          heading: '৩. ইন-প্রোগ্রেস সেভিং (Network Safe):',
          description: 'পরীক্ষা চলাকালে মোবাইল বন্ধ হয়ে গেলে বা নেট চলে গেলেও ভয় নেই! আপনার দেওয়া উত্তর ও অবশিষ্ট সময় ব্রাউজারে সুরক্ষিত থাকে। পুনরায় পেজে ঢুকলে "Continue Exam" দিয়ে সেখান থেকেই পরীক্ষা চালিয়ে যেতে পারবেন।'
        },
        {
          heading: '৪. ওএমআর গ্রিড ও সরাসরি জাম্প:',
          description: 'উপরে থাকা গ্রিড আইকনে চাপ দিলে সব প্রশ্নের নম্বর একসাথে দেখতে পাবেন এবং যেকোনো প্রশ্নে সরাসরি লাফিয়ে যেতে পারবেন।'
        }
      ]
    },
    {
      id: 'student-mistake-bank',
      title: 'ভুল উত্তরের ডায়েরি (Mistake Bank) ও রিভিশন',
      icon: CheckCircle2,
      summary: 'পরীক্ষায় হওয়া সব ভুল প্রশ্নের স্বয়ংক্রিয় সংরক্ষণাগার।',
      steps: [
        {
          heading: '১. স্বয়ংক্রিয় সেভ:',
          description: 'আপনি যতগুলো পরীক্ষা দেবেন, সেগুলোতে যে যে প্রশ্ন আপনি ভুল করবেন বা ছেড়ে দেবেন, সেগুলো স্বয়ংক্রিয়ভাবে আপনার "ভুল উত্তরের ডায়েরি" (/mistakes) পেজে জমা হবে।'
        },
        {
          heading: '২. পরীক্ষার আগে রিভিশন:',
          description: 'ফাইনাল পরীক্ষার আগে এই ভুলগুলো বারবার রিভিশন দিয়ে নিজের দুর্বলতা কাটিয়ে উঠতে পারবেন।'
        }
      ]
    },
    {
      id: 'student-auth',
      title: 'লগইন, রেজিস্ট্রেশন ও পাসওয়ার্ড রিকভারি',
      icon: Lock,
      summary: 'গুগল দিয়ে এক-ক্লিকে লগইন, ম্যানুয়াল ইমেইল ও মোবাইল নম্বর দিয়ে একাউন্ট এবং পাসওয়ার্ড পুনরুদ্ধার।',
      steps: [
        {
          heading: '১. গুগল দিয়ে এক-ক্লিক লগইন:',
          description: 'যেকোনো জিমেইল অ্যাকাউন্ট দিয়ে পাসওয়ার্ড মনে রাখার ঝামেলা ছাড়াই সরাসরি লগইন করা যায়।'
        },
        {
          heading: '২. মোবাইল ও ইমেইল দিয়ে রেজিস্ট্রেশন:',
          description: 'নাম, ইমেইল, মোবাইল নম্বর এবং ৬ অক্ষরের পাসওয়ার্ড দিয়ে নতুন অ্যাকাউন্ট তৈরি করা যায়। চোখের আইকনে চাপ দিয়ে পাসওয়ার্ড দেখা ও লুকানো যায়।'
        },
        {
          heading: '৩. পাসওয়ার্ড ভুলে গেলে:',
          description: '"পাসওয়ার্ড মনে নেই?" অপশনে ক্লিক করে নিজের ইমেইল লিখে দিলে সাথে সাথে ইনবক্সে পাসওয়ার্ড রিসেটের লিংক চলে যাবে।'
        }
      ]
    }
  ];

  const businessGuidesBn: GuideSection[] = [
    {
      id: 'tech-stack',
      title: 'সফটওয়্যারটির বিশেষ প্রযুক্তি ও পারফরম্যান্স সুবিধা',
      icon: Zap,
      summary: 'কেন এই প্ল্যাটফর্মটি যেকোনো সাধারণ কোচিং সফটওয়্যারের চেয়ে দ্রুত, আধুনিক ও সুরক্ষিত?',
      steps: [
        {
          heading: '১. ক্লাউড সার্ভারলেস স্পিড (Serverless React & Vite):',
          description: 'ওয়েবসাইটটি সুপার-ফাস্ট আধুনিক React + Vite আর্কিটেকচারে তৈরি। হাজার হাজার শিক্ষার্থী একসাথে পরীক্ষা দিলেও সার্ভার কখনোই স্লো বা হ্যাং হবে না।'
        },
        {
          heading: '২. গুগল ক্লাউড ফায়ারস্টোর (Google Cloud Firestore):',
          description: 'প্রতিটি শিক্ষার্থীর ডাটা ও উত্তরপত্র গুগলের এন্টারপ্রাইজ গ্রেড ডেটাবেসে সুরক্ষিত থাকে। কোনো ডাটা হারানোর ভয় নেই।'
        },
        {
          heading: '৩. ১০০% মোবাইল রেসপন্সিভ ডিজাইন:',
          description: 'শিক্ষার্থীরা সাধারণত মোবাইলে পরীক্ষা দেয়। তাই ছোট স্ক্রিনেও বড় সার্চ বার, ক্লিয়ার বাটন ও সহজ ইন্টারফেস নিশ্চিত করা হয়েছে।'
        },
        {
          heading: '৪. জিরো মান্থলি সার্ভার মেইনটেন্যান্স হেডেখ:',
          description: 'ক্লাউডফ্লেয়ার পেজেস এবং ফায়ারবেসের ফ্রি টিয়ারেই হাজার হাজার স্টুডেন্ট হ্যান্ডেল করা সম্ভব, ফলে প্রতি মাসে ভারী হোস্টিং বিলের চিন্তা নেই।'
        }
      ]
    },
    {
      id: 'selling-points',
      title: 'ক্লায়েন্টের কাছে বিক্রির সময় যেসব পয়েন্ট তুলে ধরবেন',
      icon: Sparkles,
      summary: 'কোচিং শিক্ষক বা প্রতিষ্ঠানের কাছে প্রেজেন্ট করার মূল আকর্ষণীয় ফিচারসমূহ।',
      steps: [
        {
          heading: '১. সম্পূর্ণ নিজস্ব ব্র্যান্ডিং:',
          description: 'শিক্ষক তার নিজের কোচিংয়ের নাম, লোগো, বিকাশ/নগদ নম্বর ওয়েবসাইটেই প্রদর্শন করতে পারবেন।'
        },
        {
          heading: '২. এক্সেল থেকে ১ ক্লিকে প্রশ্ন তৈরি:',
          description: 'শিক্ষককে ঘণ্টার পর ঘণ্টা বসে প্রশ্ন টাইপ করতে হবে না। মাইক্রোসফট এক্সেলে প্রশ্ন সাজিয়ে ড্রপ করলেই সেকেন্ডের মধ্যে পরীক্ষা তৈরি হয়ে যায়।'
        },
        {
          heading: '৩. ইনকাম বাড়ানোর প্যাকেজ সিস্টেম:',
          description: 'শিক্ষক বিভিন্ন স্পেশাল মডেল টেস্ট প্যাকেজ বানিয়ে আকর্ষণীয় মূল্যে বিক্রি করতে পারবেন।'
        },
        {
          heading: '৪. নিখুঁত কপিরাইট সুরক্ষা:',
          description: 'সোর্স কোড থাকবে আপনার নিয়ন্ত্রণে। শিক্ষক তার নিজস্ব ডোমেইনে সম্পূর্ণ প্ল্যাটফর্ম ব্যবহার করবেন।'
        }
      ]
    }
  ];

  // English Guides
  const teacherGuidesEn: GuideSection[] = [
    {
      id: 'create-exam',
      title: 'Creating Exams & Configuring Negative Marking',
      icon: Layers,
      summary: 'Create general exams, university/medical admission patterns, and import 100+ questions from Excel.',
      steps: [
        {
          heading: '1. Access Exam Creation Page:',
          description: 'Navigate to "Create Exam" (/create-exam) from your dashboard or top navigation.'
        },
        {
          heading: '2. Fill Basic Exam Info:',
          description: 'Set Title, Time Limit, Marks per question, Category, and Sub-category (e.g. Category: "HSC 2024", Sub-category: "Physics 1st Paper") to automatically organize into folders.'
        },
        {
          heading: '3. Set Negative Marking:',
          description: 'Input penalty marks per incorrect response (e.g. 0.25). To conduct tests without penalties (e.g. Dhaka 7 Colleges or school exams), set it to 0. A green badge "No Negative (0)" will display on the exam card.',
          tip: 'Setting 0 negative marking enables stress-free practice for foundation students.'
        },
        {
          heading: '4. Admission Patterns & Optional Subjects:',
          description: 'Select university admission presets (DU A-Unit, GST A-Unit, RU, CU, BUET, Medical). Candidates can choose their optional subjects (Higher Math / Biology) before starting.'
        },
        {
          heading: '5. Adding Questions via 2 Methods:',
          description: 'a) Web Editor: Type questions, options & explanations with automatic KaTeX/LaTeX math formula rendering.\nb) 1-Click Excel Import: Download the demo template, paste questions, and upload up to 150 questions in seconds.'
        }
      ]
    },
    {
      id: 'manage-packages',
      title: 'Managing Course Packages & Cover Banners',
      icon: Briefcase,
      summary: 'Bundle exams and lecture sheets together to sell premium prep packages.',
      steps: [
        {
          heading: '1. Open Packages Page:',
          description: 'Click "Manage Packages & Courses" (/manage-packages) from the dashboard.'
        },
        {
          heading: '2. Package Details & Pricing:',
          description: 'Provide an engaging course title, description, and price in BDT.'
        },
        {
          heading: '3. Add Cover Banner URL:',
          description: 'Paste direct image URL from ImgBB, PostImages, Google Drive, or any image host to generate a crisp course card.'
        },
        {
          heading: '4. Assign Exams & Sheets:',
          description: 'Select exams and lecture notes included in the package. Save to publish instantly.'
        }
      ]
    },
    {
      id: 'manage-students',
      title: 'Student Grading & Granular Access Control',
      icon: Users,
      summary: 'Search student by email, view their attempted answer sheets, and unlock specific packages or individual exams.',
      steps: [
        {
          heading: '1. Search Student:',
          description: 'On "Students & Results" (/manage-students), enter the student email and click Search.'
        },
        {
          heading: '2. View Submissions & Detailed Answers:',
          description: 'Review dates, scores, correct/wrong counts, and inspect their full question-by-question answer script live.'
        },
        {
          heading: '3. Granular Package Unlock:',
          description: 'Click "Unlock This Package" next to the purchased course. Only the exams and sheets in that package will unlock; all other packages remain securely locked!'
        },
        {
          heading: '4. Single Exam or PDF Unlock:',
          description: 'If a student purchases an individual exam or sheet, pick it from the dropdown and click "+ Unlock".'
        },
        {
          heading: '5. All-In-One VIP Pass:',
          description: 'To grant full platform access, toggle "All-in-One VIP Access".'
        }
      ]
    },
    {
      id: 'leaderboard-monitoring',
      title: 'Exam Merit List & Ranking (Leaderboard)',
      icon: Award,
      summary: 'Track real-time candidate merit lists with automated 1st-attempt filtering.',
      steps: [
        {
          heading: '1. Real-Time Leaderboard:',
          description: 'Click "Merit List" on any exam card or visit the Leaderboard tab in student management.'
        },
        {
          heading: '2. 1st-Attempt Fairness Filter:',
          description: 'To prevent students from inflating rankings through repeated attempts, the system highlights their 1st attempt.'
        },
        {
          heading: '3. Tie-breaking Protocol:',
          description: '1st: Total Score, 2nd: Higher Correct Count, 3rd: Fastest Submission Time.'
        }
      ]
    },
    {
      id: 'doubt-system',
      title: 'Student-Teacher Doubt Resolution Forum',
      icon: HelpCircle,
      summary: 'Students can ask doubts directly from any exam question and teachers reply with instant notifications.',
      steps: [
        {
          heading: '1. Doubt Submission & Alert:',
          description: 'Students submit doubts from the exam result page. A red alert badge notifies the teacher immediately.'
        },
        {
          heading: '2. Teacher Doubt Resolution Page:',
          description: 'Teachers review the original question, user query, and reply with LaTeX-enabled explanations.'
        }
      ]
    },
    {
      id: 'admin-settings',
      title: 'Admin Settings, Payment Numbers & Assistant Teachers',
      icon: ShieldCheck,
      summary: 'Update bKash/Nagad merchant numbers, Telegram channel links, and manage assistant teachers.',
      steps: [
        {
          heading: '1. Payment Methods Setup:',
          description: 'In Admin Settings (/admin-settings), configure your bKash, Nagad, or Rocket numbers and payment instructions.'
        },
        {
          heading: '2. Add Assistant Teachers:',
          description: 'Add colleague Gmail addresses under "Add Assistant Teacher" to delegate exam creation and result reviews.'
        },
        {
          heading: '3. 1-Click Access Revocation:',
          description: 'Click delete beside an assistant teacher at any time to instantly revoke privileges back to standard student role.'
        }
      ]
    }
  ];

  const studentGuidesEn: GuideSection[] = [
    {
      id: 'student-exam',
      title: 'Taking Exams & Timer Management',
      icon: Clock,
      summary: 'Live countdown timer, OMR bubble selection, and network-safe offline auto-saving.',
      steps: [
        {
          heading: '1. Launching an Exam:',
          description: 'Select your preferred exam from the exams catalog and click "Start Exam".'
        },
        {
          heading: '2. Optional Subject Selection:',
          description: 'For university admission patterns, choose your compulsory and optional subjects (e.g. Higher Math / Biology).'
        },
        {
          heading: '3. Network-Safe In-Progress Saving:',
          description: 'If your phone restarts or the internet disconnects, your answers and remaining time are preserved. Re-open to "Continue Exam" seamlessly.'
        },
        {
          heading: '4. OMR Navigation Grid:',
          description: 'Tap the OMR grid button to view all question statuses and jump directly to any question.'
        }
      ]
    },
    {
      id: 'student-mistake-bank',
      title: 'Mistake Bank & Revision Diary',
      icon: CheckCircle2,
      summary: 'Automated repository of all incorrectly answered exam questions for targeted practice.',
      steps: [
        {
          heading: '1. Automated Collection:',
          description: 'Whenever you answer incorrectly in any exam, the questions are automatically saved to your "Mistake Bank" (/mistakes).'
        },
        {
          heading: '2. Pre-Exam Revision:',
          description: 'Revise all logged mistakes before major exams to eliminate recurring weaknesses.'
        }
      ]
    },
    {
      id: 'student-auth',
      title: 'Login, Registration & Password Recovery',
      icon: Lock,
      summary: 'One-click Google login, email & phone registration, and instant password recovery.',
      steps: [
        {
          heading: '1. Google 1-Click Sign In:',
          description: 'Sign in effortlessly using your Google account without needing to remember extra passwords.'
        },
        {
          heading: '2. Mobile & Email Registration:',
          description: 'Create an account with name, email, phone number, and a secure password. Use the eye toggle to view or hide passwords.'
        },
        {
          heading: '3. Password Recovery:',
          description: 'Click "Forgot Password?" and submit your email to receive an instant password reset link.'
        }
      ]
    }
  ];

  const businessGuidesEn: GuideSection[] = [
    {
      id: 'tech-stack',
      title: 'Platform Architecture & Performance Advantages',
      icon: Zap,
      summary: 'Why this platform runs faster, more securely, and with zero maintenance compared to traditional coaching software.',
      steps: [
        {
          heading: '1. Serverless React + Vite Performance:',
          description: 'Built on high-speed React + Vite architecture. Even when thousands of students take exams simultaneously, the app responds instantaneously without lag.'
        },
        {
          heading: '2. Google Cloud Firestore Real-Time Database:',
          description: 'Student responses and exam records are backed by enterprise-grade Google Cloud security with zero data loss risk.'
        },
        {
          heading: '3. 100% Mobile Responsive Interface:',
          description: 'Optimized with large search bars, touch-friendly buttons, and seamless mobile navigation.'
        },
        {
          heading: '4. Zero Server Maintenance Overhead:',
          description: 'Runs on Cloudflare Pages and Firebase free tiers, supporting thousands of active students with zero monthly hosting bills.'
        }
      ]
    },
    {
      id: 'selling-points',
      title: 'Key Selling Points for Prospective Clients & Institutions',
      icon: Sparkles,
      summary: 'Core presentation highlights when demoing or pitching this website to coaching centers and educators.',
      steps: [
        {
          heading: '1. 100% Custom White-Label Branding:',
          description: 'The educator can display their own brand name, logo, bKash/Nagad payment info, and direct contact details.'
        },
        {
          heading: '2. Instant Excel Question Upload:',
          description: 'No manual typing needed. Import entire 100-question test papers from Excel spreadsheets in 5 seconds.'
        },
        {
          heading: '3. Monetization via Course Packages:',
          description: 'Create and sell model test batches, revision packages, and lecture sheets with automated locking.'
        },
        {
          heading: '4. Full Intellectual Property Protection:',
          description: 'Source code remains in your possession. Clients receive their customized deployment on their custom domain.'
        }
      ]
    }
  ];

  const teacherGuides = language === 'en' ? teacherGuidesEn : teacherGuidesBn;
  const studentGuides = language === 'en' ? studentGuidesEn : studentGuidesBn;
  const businessGuides = language === 'en' ? businessGuidesEn : businessGuidesBn;

  // Combine and filter based on permissions
  const allGuides = [
    ...(canViewTeacher ? teacherGuides.map(g => ({ ...g, category: 'teacher' as const })) : []),
    ...(canViewStudent ? studentGuides.map(g => ({ ...g, category: 'student' as const })) : []),
    ...(canViewClient ? businessGuides.map(g => ({ ...g, category: 'business' as const })) : [])
  ];

  const effectiveTab = 
    (activeTab === 'teacher' && !canViewTeacher) ? 'student' :
    (activeTab === 'business' && !canViewClient) ? 'student' :
    activeTab;

  const filteredGuides = allGuides.filter(g => {
    if (effectiveTab !== 'all' && g.category !== effectiveTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || 
           g.summary.toLowerCase().includes(q) ||
           g.steps.some(s => s.heading.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  });

  const heroSubtitle = canViewClient
    ? (language === 'en' 
        ? 'Comprehensive platform documentation covering exam creation, question import, package monetization, student access management, and client pitch materials.' 
        : 'পরীক্ষা তৈরি, এক্সেল আপলোড, প্যাকেজ তৈরি, স্টুডেন্ট ম্যানেজমেন্ট ও ক্লায়েন্ট উপস্থাপনার সম্পূর্ণ নির্দেশিকা।')
    : canViewTeacher
    ? (language === 'en'
        ? 'Teacher and admin manual for creating exams, Excel question imports, package management, and student unlocks.'
        : 'শিক্ষক ও অ্যাডমিনদের জন্য পরীক্ষা তৈরি, এক্সেল আপলোড, প্যাকেজ ও স্টুডেন্ট আনলক ম্যানেজমেন্ট নির্দেশিকা।')
    : (language === 'en'
        ? 'Student guide for attending exams, live timers, negative marking calculations, and reviewing mistakes.'
        : 'শিক্ষার্থীদের পরীক্ষা দেওয়ার নিয়ম, লাইভ টাইমার, ওএমআর শিট দাগানো, ফলাফল বিশ্লেষণ ও ভুল উত্তরের রিভিশন নির্দেশিকা।');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto pb-16 px-4 pt-6"
    >
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-light via-indigo-600 to-primary-dark text-white p-6 sm:p-10 mb-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <BookOpen size={14} /> {language === 'en' ? 'Porikkhaghor Official User Guide' : 'পরীক্ষাঘর অফিসিয়াল ইউজার গাইড'}
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold mb-3">
            {language === 'en' ? 'Platform Feature Documentation & Manual' : 'প্ল্যাটফর্মের সকল ফিচার ও ব্যবহার নির্দেশিকা'}
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            {heroSubtitle}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search Bar & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search features, tools, or guides (e.g., excel, negative marking, packages)...' : 'যেকোনো ফিচার বা নিয়ম লিখে খুঁজুন (যেমন: এক্সেল, নেগেটিভ, প্যাকেজ)...'}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white shadow-sm"
          />
        </div>

        {/* Category Tabs (Teacher/Admin or Master Admin) */}
        {(canViewTeacher || canViewClient) ? (
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                effectiveTab === 'all'
                  ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {language === 'en' ? `All Topics (${toLangNumber(allGuides.length)})` : `সকল বিষয় (${toLangNumber(allGuides.length)})`}
            </button>
            {canViewTeacher && (
              <button
                onClick={() => setActiveTab('teacher')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  effectiveTab === 'teacher'
                    ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <ShieldCheck size={14} /> {language === 'en' ? 'Teacher & Admin' : 'শিক্ষক ও এডমিন'}
              </button>
            )}
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                effectiveTab === 'student'
                  ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <GraduationCap size={14} /> {language === 'en' ? 'Student Guide' : 'শিক্ষার্থী গাইড'}
            </button>
            {canViewClient && (
              <button
                onClick={() => setActiveTab('business')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  effectiveTab === 'business'
                    ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Briefcase size={14} /> {language === 'en' ? 'Client Pitch' : 'ক্লায়েন্ট পিচ'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs font-bold shrink-0">
            <GraduationCap size={14} /> {language === 'en' ? `Student Guide (${toLangNumber(allGuides.length)})` : `শিক্ষার্থী নির্দেশিকা (${toLangNumber(allGuides.length)})`}
          </div>
        )}
      </div>

      {/* Guide Cards Accordion */}
      {filteredGuides.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <HelpCircle size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <h3 className="font-bold text-gray-700 dark:text-gray-300">
            {language === 'en' ? 'No guides found' : 'কোনো ফলাফল পাওয়া যায়নি'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'en' ? 'Try searching with different keywords.' : 'অন্য কোনো শব্দ লিখে সার্চ করে দেখুন।'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map(item => {
            const Icon = item.icon;
            const isExpanded = expandedId === item.id;
            const categoryBadge = 
              item.category === 'teacher' ? { label: language === 'en' ? 'Teacher & Admin' : 'শিক্ষক ও এডমিন', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' } :
              item.category === 'student' ? { label: language === 'en' ? 'Student' : 'শিক্ষার্থী', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' } :
              { label: language === 'en' ? 'Client & Tech' : 'ক্লায়েন্ট ও টেকনোলজি', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' };

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:border-primary-light/40"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryBadge.color}`}>
                          {categoryBadge.label}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-8"
                    >
                      <div className="space-y-4">
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs">
                            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-primary-light dark:text-primary-dark shrink-0" />
                              {step.heading}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line pl-6">
                              {step.description}
                            </p>
                            {step.tip && (
                              <div className="mt-2.5 ml-6 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                <strong>💡 {language === 'en' ? 'Tip:' : 'টিপস:'}</strong> {step.tip}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Quick Links */}
      <div className="mt-12 p-6 sm:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {language === 'en' ? 'Start Using the Platform Now' : 'এখনই প্ল্যাটফর্মটি ব্যবহার করুন'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {language === 'en' ? 'All features are ready. Jump directly into your preferred section.' : 'সব ফিচার রেডি। আপনার পছন্দের সেকশনে সরাসরি চলে যান।'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {canViewTeacher ? (
            <>
              <Link
                to="/create-exam"
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary-light hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all text-center shadow-sm"
              >
                {language === 'en' ? 'Create Exam →' : 'পরীক্ষা তৈরি →'}
              </Link>
              <Link
                to="/manage-students"
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all text-center"
              >
                {language === 'en' ? 'Manage Students →' : 'শিক্ষার্থী ম্যানেজ →'}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/exams"
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary-light hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all text-center shadow-sm"
              >
                {language === 'en' ? 'Exams Catalog →' : 'পরীক্ষা সমূহ →'}
              </Link>
              <Link
                to="/courses"
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all text-center"
              >
                {language === 'en' ? 'Course Packages →' : 'প্যাকেজ সমূহ →'}
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
