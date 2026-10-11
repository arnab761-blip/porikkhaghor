import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, PhoneCall, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [teacherInfo, setTeacherInfo] = useState({
    name: 'মো. আব্দুল্লাহ',
    whatsappNumber: '+8801XXXXXXXXX',
    whatsappLink: 'https://wa.me/8801XXXXXXXXX',
    telegramLink: 'https://t.me/porikkhaghor',
    phone: '+8801XXXXXXXXX'
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'adminProfile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTeacherInfo(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      }
    };
    if (isOpen) {
      fetchInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden z-10 border border-gray-100 dark:border-gray-800"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-light to-primary-dark p-6 text-white text-center relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold font-heading mb-1">প্রিমিয়াম আনলক করুন</h2>
            <p className="text-white/80 text-sm">এই কন্টেন্টটি দেখতে পেমেন্ট সম্পন্ন করুন</p>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6 leading-relaxed">
              পেইড পরীক্ষা বা পিডিএফগুলোর অ্যাক্সেস পেতে নিচের যেকোনো মাধ্যমে <strong>{teacherInfo.name}</strong> স্যারের সাথে যোগাযোগ করে পেমেন্ট সম্পন্ন করুন।
            </p>

            <div className="space-y-3">
              {/* WhatsApp Button */}
              <a 
                href={teacherInfo.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-2xl transition-colors border border-green-200 dark:border-green-800/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <MessageCircle size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">WhatsApp এ মেসেজ দিন</div>
                    <div className="text-xs opacity-80">{teacherInfo.whatsappNumber}</div>
                  </div>
                </div>
              </a>

              {/* Telegram Button */}
              <a 
                href={teacherInfo.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-2xl transition-colors border border-blue-200 dark:border-blue-800/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0088cc] text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 ml-[-2px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.18 3.44-.49.33-.93.5-1.33.49-.44-.01-1.28-.24-1.91-.44-.52-.17-.93-.25-.89-.54.02-.15.22-.3.62-.46 2.42-1.05 4.04-1.74 4.86-2.08 2.31-.96 2.79-1.13 3.1-1.14.07 0 .23.02.32.09.07.06.09.13.1.2z"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Telegram এ মেসেজ দিন</div>
                    <div className="text-xs opacity-80">@porikkhaghor</div>
                  </div>
                </div>
              </a>

              {/* Direct Call Button */}
              <a 
                href={`tel:${teacherInfo.phone}`}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl transition-colors border border-gray-200 dark:border-gray-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <PhoneCall size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">সরাসরি কল করুন</div>
                    <div className="text-xs opacity-80">{teacherInfo.phone}</div>
                  </div>
                </div>
              </a>
            </div>

            <p className="text-xs text-center text-gray-500 mt-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              💡 <strong>পেমেন্ট করার পর:</strong> আপনার ইমেইলটি স্যারকে জানাবেন। তিনি তার ড্যাশবোর্ড থেকে আপনার অ্যাকাউন্টটি প্রিমিয়াম করে দিবেন।
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
