import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<'about' | 'privacy' | 'terms' | 'refund' | null>(null);
  const [footerInfo, setFooterInfo] = useState({
    footerAddress: 'ধানমন্ডি ৩২, ঢাকা, বাংলাদেশ',
    footerPhone: '+880 1700-000000',
    footerEmail: 'support@porikkhaghor.com'
  });

  useEffect(() => {
    const fetchFooterInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'adminProfile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.footerAddress || data.footerPhone || data.footerEmail) {
            setFooterInfo(prev => ({
              ...prev,
              footerAddress: data.footerAddress || prev.footerAddress,
              footerPhone: data.footerPhone || prev.footerPhone,
              footerEmail: data.footerEmail || prev.footerEmail
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching footer info:", error);
      }
    };
    fetchFooterInfo();
  }, []);

  const policyContent = {
    about: { title: 'আমাদের সম্পর্কে', text: 'পরীক্ষাঘর হলো বাংলাদেশের অন্যতম সেরা অনলাইন এক্সাম প্ল্যাটফর্ম। এখানে শিক্ষার্থীরা রিয়েল-টাইম টাইমার ও নেগেটিভ মার্কিং সহ পরীক্ষা দিয়ে নিজেদের যাচাই করতে পারে। আমাদের মূল লক্ষ্য হলো সবার জন্য মানসম্মত শিক্ষা নিশ্চিত করা।' },
    privacy: { title: 'প্রাইভেসি পলিসি', text: 'আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় আমরা কঠোরভাবে প্রতিশ্রুতিবদ্ধ। আমরা আপনার নাম, ইমেইল এবং পরীক্ষার ফলাফল ছাড়া অন্য কোনো সংবেদনশীল তথ্য সংগ্রহ করি না এবং এই তথ্য কোনো থার্ড-পার্টির সাথে শেয়ার করি না।' },
    terms: { title: 'শর্তাবলী (Terms & Conditions)', text: 'আমাদের প্ল্যাটফর্ম ব্যবহারের জন্য কিছু সাধারণ নিয়ম রয়েছে। কোনো বেআইনি কাজ করা, অন্যের অ্যাকাউন্ট ব্যবহার করা বা সিস্টেমের ক্ষতি করার চেষ্টা করলে অ্যাকাউন্টটি সাসপেন্ড করা হতে পারে। কর্তৃপক্ষ যেকোনো সময় নিয়মাবলী পরিবর্তন করার অধিকার রাখে।' },
    refund: { title: 'রিফান্ড পলিসি', text: 'যেহেতু এটি একটি সম্পূর্ণ ডিজিটাল সেবা (পরীক্ষা এবং পিডিএফ), তাই একবার কোনো পেইড পরীক্ষা বা প্যাকেজ কিনে ফেললে সাধারণত তার কোনো রিফান্ড প্রযোজ্য হয় না। তবে টেকনিক্যাল কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করতে পারেন।' }
  };

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 text-primary-light dark:text-primary-dark font-heading font-bold text-2xl">
              <BookOpen size={28} className="text-accent-light dark:text-accent-dark" />
              <span>পরীক্ষাঘর</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              দেশের সেরা অনলাইন এক্সাম প্ল্যাটফর্ম। নিজেকে যাচাই করুন, ভুলগুলো শুধরে নিন এবং চূড়ান্ত প্রস্তুতির জন্য নিজেকে প্রস্তুত করুন।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">প্রয়োজনীয় লিংক</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/exams" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors">সকল পরীক্ষা</Link></li>
              <li><Link to="/resources" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors">পিডিএফ ও রিসোর্স</Link></li>
              <li><Link to="/mistakes" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors">ভুল উত্তরের ডায়েরি</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors">স্টুডেন্ট ড্যাশবোর্ড</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">সাপোর্ট ও পলিসি</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <li><span onClick={() => setActivePolicy('about')} className="hover:text-primary-light dark:hover:text-primary-dark transition-colors block">আমাদের সম্পর্কে</span></li>
              <li><span onClick={() => setActivePolicy('privacy')} className="hover:text-primary-light dark:hover:text-primary-dark transition-colors block">প্রাইভেসি পলিসি</span></li>
              <li><span onClick={() => setActivePolicy('terms')} className="hover:text-primary-light dark:hover:text-primary-dark transition-colors block">শর্তাবলী (Terms & Conditions)</span></li>
              <li><span onClick={() => setActivePolicy('refund')} className="hover:text-primary-light dark:hover:text-primary-dark transition-colors block">রিফান্ড পলিসি</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">যোগাযোগ</h3>
            <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-light dark:text-primary-dark mt-0.5 shrink-0" />
                <span>{footerInfo.footerAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary-light dark:text-primary-dark shrink-0" />
                <span>{footerInfo.footerPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary-light dark:text-primary-dark shrink-0" />
                <span>{footerInfo.footerEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} পরীক্ষাঘর (PorikkhaGhor)। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>Developed with ❤️ for Students</p>
        </div>
      </div>

      {/* Policy Modal */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePolicy(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden p-8 z-10 border border-gray-100 dark:border-gray-800"
            >
              <button 
                onClick={() => setActivePolicy(null)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-white mb-4">
                {policyContent[activePolicy].title}
              </h2>
              <div className="w-12 h-1 bg-primary-light rounded-full mb-6"></div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                {policyContent[activePolicy].text}
              </p>
              
              <button 
                onClick={() => setActivePolicy(null)}
                className="mt-8 w-full py-3 bg-primary-light/10 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark font-semibold rounded-xl hover:bg-primary-light hover:text-white transition-colors"
              >
                বুঝতে পেরেছি
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
