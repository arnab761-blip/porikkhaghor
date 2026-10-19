import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, AlertCircle, UserPlus } from 'lucide-react';

export default function AdminSettings() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');

  // Add Admin States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<'assistant' | 'owner'>('assistant');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    whatsappLink: '',
    telegramLink: '',
    phone: '',
    footerAddress: 'ধানমন্ডি ৩২, ঢাকা, বাংলাদেশ',
    footerPhone: '+880 1700-000000',
    footerEmail: 'support@porikkhaghor.com'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'adminProfile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    
    try {
      await setDoc(doc(db, 'settings', 'adminProfile'), formData);
      setSuccess('সেটিংস সফলভাবে সেভ হয়েছে!');
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;
    setAdminLoading(true);
    setAdminMsg({ type: '', text: '' });

    try {
      const q = query(collection(db, 'users'), where('email', '==', adminEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setAdminMsg({ type: 'error', text: 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি! তাকে আগে একবার ওয়েবসাইটটিতে জিমেইল দিয়ে লগইন করতে বলুন।' });
      } else {
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), { role: adminRole });
        setAdminMsg({ type: 'success', text: `সফলভাবে ${adminRole === 'owner' ? 'Owner' : 'Assistant'} অ্যাক্সেস দেওয়া হয়েছে!` });
        setAdminEmail('');
      }
    } catch (error) {
      console.error(error);
      setAdminMsg({ type: 'error', text: 'অ্যাক্সেস দিতে সমস্যা হয়েছে।' });
    } finally {
      setAdminLoading(false);
    }
  };

  if (role !== 'owner' && role !== 'assistant') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">অ্যাক্সেস নেই</h2>
        <p className="text-gray-600 dark:text-gray-400">এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
        <Settings className="text-primary-light dark:text-primary-dark" size={32} /> অ্যাডমিন সেটিংস
      </h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          এখানে আপনার কন্টাক্ট ডিটেইলস আপডেট করুন। স্টুডেন্টরা যখন কোনো পেইড পরীক্ষা বা পিডিএফ আনলক করতে চাইবে, তখন তাদের পপ-আপে এই তথ্যগুলোই দেখানো হবে।
        </p>

        {fetching ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">লোড হচ্ছে...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">শিক্ষকের নাম</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="যেমন: মো. আব্দুল্লাহ"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">WhatsApp নম্বর (প্রদর্শনের জন্য)</label>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="যেমন: +8801700000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">WhatsApp লিংক (চ্যাটের জন্য)</label>
              <input
                type="url"
                name="whatsappLink"
                value={formData.whatsappLink}
                onChange={handleChange}
                placeholder="যেমন: https://wa.me/8801700000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Telegram লিংক</label>
              <input
                type="url"
                name="telegramLink"
                value={formData.telegramLink}
                onChange={handleChange}
                placeholder="যেমন: https://t.me/yourusername"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ফোন নম্বর (সরাসরি কলের জন্য)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="যেমন: +8801700000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                required
              />
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">ফুটার সেকশন (যোগাযোগ)</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ঠিকানা (Address)</label>
                  <input
                    type="text"
                    name="footerAddress"
                    value={formData.footerAddress}
                    onChange={handleChange}
                    placeholder="যেমন: ধানমন্ডি ৩২, ঢাকা, বাংলাদেশ"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">হেল্পলাইন নম্বর (Phone)</label>
                  <input
                    type="text"
                    name="footerPhone"
                    value={formData.footerPhone}
                    onChange={handleChange}
                    placeholder="যেমন: +880 1700-000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ইমেইল (Email)</label>
                  <input
                    type="email"
                    name="footerEmail"
                    value={formData.footerEmail}
                    onChange={handleChange}
                    placeholder="যেমন: support@porikkhaghor.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                  />
                </div>
              </div>
            </div>

            {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-light text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} /> {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          </form>
        )}
      </div>

      {role === 'owner' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <UserPlus className="text-primary-light dark:text-primary-dark" size={24} /> শিক্ষক/সহকারী যুক্ত করুন
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            যেকোনো নতুন শিক্ষক বা সহকারীকে ওয়েবসাইটের ড্যাশবোর্ডে অ্যাক্সেস দিতে তার জিমেইলটি নিচে দিন। (দ্রষ্টব্য: তাকে অবশ্যই আগে একবার ওয়েবসাইটে জিমেইল দিয়ে লগইন থাকতে হবে)।
          </p>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ইমেইল অ্যাড্রেস</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="teacher@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                  required
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">রোল (Role)</label>
                <select
                  value={adminRole}
                  onChange={e => setAdminRole(e.target.value as 'assistant' | 'owner')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                >
                  <option value="assistant">সহকারী (Assistant)</option>
                  <option value="owner">মালিক (Owner)</option>
                </select>
              </div>
            </div>

            {adminMsg.text && (
              <div className={`p-4 rounded-xl font-medium ${adminMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {adminMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full md:w-auto px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              {adminLoading ? 'যুক্ত হচ্ছে...' : 'অ্যাক্সেস দিন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
