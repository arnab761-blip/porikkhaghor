import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Target, ShieldCheck, PlayCircle, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 15, exams: 5, questions: 250, resources: 10 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, examsSnap, resourcesSnap] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'exams')),
          getCountFromServer(collection(db, 'resources'))
        ]);
        
        const examsQuerySnap = await getDocs(collection(db, 'exams'));
        let totalQuestions = 0;
        examsQuerySnap.forEach(doc => {
          const data = doc.data();
          if (data.questions && Array.isArray(data.questions)) {
            totalQuestions += data.questions.length;
          }
        });

        setStats({
          users: usersSnap.data().count,
          exams: examsSnap.data().count,
          questions: totalQuestions,
          resources: resourcesSnap.data().count
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const toBengaliNumber = (num: number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-primary-light/10 dark:bg-primary-dark/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-10 w-72 h-72 bg-accent-light/10 dark:bg-accent-dark/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-20 w-72 h-72 bg-purple-300/10 dark:bg-purple-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary-light/10 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark text-sm font-semibold mb-6 border border-primary-light/20 dark:border-primary-dark/30">
              দেশের সেরা অনলাইন এক্সাম প্ল্যাটফর্ম 🎯
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 dark:text-white leading-tight mb-6">
              আপনার প্রস্তুতি হোক আরও <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light dark:from-blue-400 dark:to-amber-400">নির্ভুল</span> এবং <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-light to-primary-light dark:from-amber-400 dark:to-blue-400">শাণিত</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              সঠিক সময়ে সঠিক পরীক্ষা দিন। ভুলগুলো ডায়েরিতে সংরক্ষণ করুন এবং আলোচনার মাধ্যমে নিজের দুর্বলতা দূর করে চূড়ান্ত সাফল্যের জন্য নিজেকে প্রস্তুত করুন।
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to={user ? "/exams" : "/login"}
                className="w-full sm:w-auto px-8 py-4 bg-primary-light text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2"
              >
                {user ? "পরীক্ষা শুরু করুন" : "ফ্রি অ্যাকাউন্ট খুলুন"} <ArrowRight size={20} />
              </Link>
              <Link 
                to="/resources"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg hover:border-primary-light dark:hover:border-primary-dark transition-all flex items-center justify-center gap-2"
              >
                <FileText size={20} /> রিসোর্স দেখুন
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">কেন আমাদের প্ল্যাটফর্ম সেরা?</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">আমরা শুধু পরীক্ষাই নিই না, আপনার ভুলগুলো শুধরে আপনাকে সফল হতে সাহায্য করি।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <PlayCircle size={32} />,
              title: 'লাইভ ও মক টেস্ট',
              desc: 'রিয়েল-টাইম টাইমার ও নেগেটিভ মার্কিং সহ পরীক্ষা দিয়ে আসল পরীক্ষার পরিবেশ অনুভব করুন।',
              color: 'text-blue-500',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              link: '/exams'
            },
            {
              icon: <BookOpen size={32} />,
              title: 'ভুল উত্তরের ডায়েরি',
              desc: 'আপনার সব ভুল উত্তর স্বয়ংক্রিয়ভাবে একটি ডায়েরিতে সেভ হয়ে থাকবে রিভিশন দেওয়ার জন্য।',
              color: 'text-red-500',
              bg: 'bg-red-50 dark:bg-red-900/20',
              link: '/mistakes'
            },
            {
              icon: <Users size={32} />,
              title: 'ডাউট ক্লিয়ারিং ফোরাম',
              desc: 'যেকোনো প্রশ্নে সন্দেহ থাকলে সরাসরি অন্য ছাত্র বা শিক্ষকের সাথে আলোচনা করুন।',
              color: 'text-green-500',
              bg: 'bg-green-50 dark:bg-green-900/20',
              link: '/mistakes'
            },
            {
              icon: <Target size={32} />,
              title: 'সঠিক ব্যাখ্যা ও অ্যানালাইসিস',
              desc: 'পরীক্ষা শেষে প্রতিটি প্রশ্নের সঠিক উত্তরের পাশাপাশি বিস্তারিত ব্যাখ্যা এবং আপনার স্কোর অ্যানালাইসিস।',
              color: 'text-purple-500',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              link: '/performance'
            },
            {
              icon: <FileText size={32} />,
              title: 'প্রিমিয়াম পিডিএফ লাইব্রেরি',
              desc: 'গুরুত্বপূর্ণ ক্লাস নোট, লেকচার শিট এবং বইয়ের পিডিএফ কালেকশন।',
              color: 'text-accent-light',
              bg: 'bg-accent-light/10',
              link: '/resources'
            },
            {
              icon: <ShieldCheck size={32} />,
              title: 'শতভাগ নিরাপদ ও নির্ভরযোগ্য',
              desc: 'আপনার সকল তথ্য, পরীক্ষা এবং রেজাল্ট আমাদের ক্লাউড ডাটাবেসে সম্পূর্ণ সুরক্ষিত।',
              color: 'text-teal-500',
              bg: 'bg-teal-50 dark:bg-teal-900/20',
              link: '/exams'
            }
          ].map((feature, i) => (
            <Link to={feature.link} key={i}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group h-full cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-light text-white rounded-3xl p-10 md:p-16 text-center my-10 relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading mb-2">{toBengaliNumber(stats.users)}+</div>
            <div className="text-white/90 text-lg font-medium">নিবন্ধিত শিক্ষার্থী</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading mb-2">{toBengaliNumber(stats.exams)}+</div>
            <div className="text-white/90 text-lg font-medium">লাইভ এক্সাম</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading mb-2">{toBengaliNumber(stats.questions)}+</div>
            <div className="text-white/90 text-lg font-medium">মোট প্রশ্নব্যাংক</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading mb-2">{toBengaliNumber(stats.resources)}+</div>
            <div className="text-white/90 text-lg font-medium">স্টাডি ম্যাটেরিয়াল</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-10 mb-10">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">আজই আপনার প্রস্তুতি শুরু করুন</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          আর দেরি কেন? এখনই আপনার ফ্রি অ্যাকাউন্ট তৈরি করে যেকোনো একটি পরীক্ষায় অংশগ্রহণ করুন এবং নিজেকে যাচাই করুন।
        </p>
        <Link 
          to={user ? "/exams" : "/login"}
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent-light text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-500 transition-all hover:scale-105 shadow-md"
        >
          {user ? "সব পরীক্ষা দেখুন" : "একাউন্ট তৈরি করুন"} <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}
