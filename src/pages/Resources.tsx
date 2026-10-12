import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Download, Search } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

interface Resource {
  id: string;
  title: string;
  category: string;
  url: string;
  isPaid: boolean;
  type: string;
}

export default function Resources() {
  const { userData } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const res = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[];
        setResources(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">রিসোর্স লোড হচ্ছে...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark">পিডিএফ ও রিসোর্স</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">ক্লাস নোট, লেকচার শিট এবং প্রয়োজনীয় বইয়ের পিডিএফ সংগ্রহ করুন</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="সার্চ করুন..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h2 className="text-xl font-medium text-gray-500 dark:text-gray-400">এখনো কোনো রিসোর্স আপলোড করা হয়নি</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(res => (
            <motion.div key={res.id} whileHover={{ y: -4 }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark rounded-md">
                    {res.category || 'সাধারণ'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                    {res.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{res.title}</h3>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                {!userData?.hasPaidAccess && res.isPaid ? (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Lock size={18} /> আনলক করুন
                  </button>
                ) : (
                  <a 
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-accent-light text-white dark:text-gray-900 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors shadow-sm"
                  >
                    <Download size={18} /> দেখুন / ডাউনলোড করুন
                  </a>
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
