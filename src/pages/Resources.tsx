import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Download, Search, CheckCircle2 } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { isResourceUnlocked, type PackageAccessItem } from '../lib/accessControl';
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [packagesList, setPackagesList] = useState<PackageAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchResourcesAndPackages = async () => {
      try {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const res = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[];
        setResources(res);

        // Fetch packages to check includedResources
        try {
          const pkgSnap = await getDocs(collection(db, 'packages'));
          const pkgs = pkgSnap.docs.map(d => ({
            id: d.id,
            includedExams: d.data().includedExams || [],
            includedResources: d.data().includedResources || []
          })) as PackageAccessItem[];
          setPackagesList(pkgs);
        } catch (pe) {
          console.error("Error fetching packages in Resources:", pe);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResourcesAndPackages();
  }, []);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark">{t('pdfResourcesTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('pdfResourcesSubtitle')}</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder={t('search')} 
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
          <h2 className="text-xl font-medium text-gray-500 dark:text-gray-400">{t('noResourcesUploaded')}</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(res => {
            const isUnlocked = isResourceUnlocked(res, userData, packagesList);
            const isLocked = res.isPaid && !isUnlocked;

            return (
              <motion.div key={res.id} whileHover={{ y: -4 }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full">
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark rounded-md">
                      {res.category || (language === 'bn' ? 'সাধারণ' : 'General')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                        {res.type}
                      </span>
                      {res.isPaid ? (
                        isUnlocked ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-200/60 flex items-center gap-1">
                            <CheckCircle2 size={11} /> {t('unlocked')}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200/60 flex items-center gap-1">
                            <Lock size={11} /> {t('paid')}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-200/60">
                          {t('free')}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{res.title}</h3>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {isLocked ? (
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Lock size={18} /> {t('unlock')}
                    </button>
                  ) : (
                    <a 
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-accent-light text-white dark:text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors shadow-sm"
                    >
                      <Download size={18} /> {t('downloadViewBtn')}
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </motion.div>
  );
}
