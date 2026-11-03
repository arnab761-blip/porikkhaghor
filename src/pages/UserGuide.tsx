import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'student' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('create-exam');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Guide Data
  const teacherGuides: GuideSection[] = [
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

  const studentGuides: GuideSection[] = [
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

  const businessGuides: GuideSection[] = [
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

  // Combine and filter
  const allGuides = [
    ...teacherGuides.map(g => ({ ...g, category: 'teacher' as const })),
    ...studentGuides.map(g => ({ ...g, category: 'student' as const })),
    ...businessGuides.map(g => ({ ...g, category: 'business' as const }))
  ];

  const filteredGuides = allGuides.filter(g => {
    if (activeTab !== 'all' && g.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || 
           g.summary.toLowerCase().includes(q) ||
           g.steps.some(s => s.heading.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  });

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
            <BookOpen size={14} /> পরীক্ষাঘর অফিসিয়াল ইউজার গাইড
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold mb-3">
            প্ল্যাটফর্মের সকল ফিচার ও ব্যবহার নির্দেশিকা
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            পরীক্ষা তৈরি, এক্সেল প্রশ্ন আপলোড, প্যাকেজ তৈরি, স্টুডেন্ট আনলক ম্যানেজমেন্ট এবং শিক্ষার্থীদের পরীক্ষা দেওয়ার সব নিয়মাবলী এখানে সুন্দরভাবে ধাপে ধাপে সাজানো রয়েছে।
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
            placeholder="যেকোনো ফিচার বা নিয়ম লিখে খুঁজুন (যেমন: এক্সেল, নেগেটিভ, প্যাকেজ)..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white shadow-sm"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            সকল বিষয় ({allGuides.length})
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'teacher'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <ShieldCheck size={14} /> শিক্ষক ও এডমিন
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'student'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <GraduationCap size={14} /> শিক্ষার্থী গাইড
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'business'
                ? 'bg-white dark:bg-gray-900 text-primary-light dark:text-primary-dark shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Briefcase size={14} /> ক্লায়েন্ট পিচ
          </button>
        </div>
      </div>

      {/* Guide Cards Accordion */}
      {filteredGuides.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <HelpCircle size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <h3 className="font-bold text-gray-700 dark:text-gray-300">কোনো ফলাফল পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500 mt-1">অন্য কোনো শব্দ লিখে সার্চ করে দেখুন।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map(item => {
            const Icon = item.icon;
            const isExpanded = expandedId === item.id;
            const categoryBadge = 
              item.category === 'teacher' ? { label: 'শিক্ষক ও এডমিন', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' } :
              item.category === 'student' ? { label: 'শিক্ষার্থী', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' } :
              { label: 'ক্লায়েন্ট ও টেকনোলজি', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' };

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
                                <strong>💡 টিপস:</strong> {step.tip}
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
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">এখনই প্ল্যাটফর্মটি ব্যবহার করুন</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">সব ফিচার রেডি। আপনার পছন্দের সেকশনে সরাসরি চলে যান।</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/exams"
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary-light hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all text-center shadow-sm"
          >
            পরীক্ষা সমূহ →
          </Link>
          <Link
            to="/courses"
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all text-center"
          >
            প্যাকেজ সমূহ →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
