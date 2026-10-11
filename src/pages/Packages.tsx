import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Package, Lock, CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

interface CoursePackage {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
}

export default function Packages() {
  const { userData, role } = useAuth();
  const isTeacher = role === 'owner' || role === 'assistant';
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const q = query(collection(db, 'packages'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const res = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CoursePackage[];
        setPackages(res);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12 px-4 pt-8">
      {/* Teacher Control Banner */}
      {isTeacher && (
        <div className="mb-8 p-4 bg-primary-light/10 dark:bg-primary-dark/10 rounded-2xl border border-primary-light/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary-light text-white rounded-xl">
              <Package size={20} />
            </span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">শিক্ষক কন্ট্রোল প্যানেল</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">আপনি এখান থেকে সরাসরি শিক্ষার্থীদের জন্য নতুন প্যাকেজ তৈরি বা ডিলিট করতে পারেন।</p>
            </div>
          </div>
          <Link
            to="/manage-packages"
            className="px-4 py-2 bg-primary-light text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> নতুন প্যাকেজ যোগ করুন
          </Link>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white">স্পেশাল প্যাকেজ সমূহ</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
          আপনার প্রস্তুতিকে আরও শাণিত করতে আমাদের স্পেশাল প্যাকেজগুলো থেকে আপনার পছন্দেরটি বেছে নিন। প্রতিটি প্যাকেজ অভিজ্ঞ শিক্ষকদের দ্বারা সাজানো।
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto">
          <Package size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">নতুন প্যাকেজ আসছে!</h2>
          <p className="text-gray-500 dark:text-gray-400">
            বর্তমানে কোনো প্যাকেজ এভেইলেবল নেই। খুব শীঘ্রই নতুন প্যাকেজ যোগ করা হবে, আমাদের সাথেই থাকুন।
          </p>
          {isTeacher && (
            <Link 
              to="/manage-packages"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-light text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md"
            >
              <Plus size={18} /> আপনার প্রথম প্যাকেজটি যোগ করুন
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map(pkg => (
            <motion.div 
              key={pkg.id} 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pkg.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{pkg.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-primary-light dark:text-primary-dark">
                    ৳{toBengaliNumber(pkg.price)}
                  </span>
                </div>
                <ul className="space-y-4">
                  {pkg.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0 mt-auto">
                {userData?.hasPaidAccess ? (
                  <button 
                    disabled
                    className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle2 size={20} /> প্যাকেজটি আপনার কেনা আছে
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3 bg-primary-light text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <Lock size={20} /> আনলক করুন
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </motion.div>
  );
}
