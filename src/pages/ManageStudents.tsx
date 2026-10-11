import { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Search, UserCheck, UserX, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ManageStudents() {
  const { role } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFoundUser(null);

    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('এই ইমেইল দিয়ে কোনো স্টুডেন্ট পাওয়া যায়নি।');
      } else {
        const userDoc = snap.docs[0];
        setFoundUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (err) {
      console.error(err);
      setError('স্টুডেন্ট খোঁজার সময় একটি সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const togglePremiumAccess = async () => {
    if (!foundUser) return;
    setLoading(true);
    
    try {
      const newStatus = !foundUser.hasPaidAccess;
      const userRef = doc(db, 'users', foundUser.id);
      await updateDoc(userRef, { hasPaidAccess: newStatus });
      
      setFoundUser({ ...foundUser, hasPaidAccess: newStatus });
      setSuccess(`সফলভাবে ${newStatus ? 'পেইড অ্যাক্সেস দেওয়া হয়েছে' : 'পেইড অ্যাক্সেস বাতিল করা হয়েছে'}!`);
    } catch (err) {
      console.error(err);
      setError('অ্যাক্সেস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'owner' && role !== 'assistant') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">অ্যাক্সেস নেই</h2>
        <p className="text-gray-600">এই পেজটি শুধুমাত্র শিক্ষকদের জন্য।</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
        <ShieldCheck className="text-primary-light" size={32} /> শিক্ষার্থী ও পেমেন্ট ম্যানেজমেন্ট
      </h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          যেসকল স্টুডেন্ট পেমেন্ট করেছে, তাদের ইমেইল লিখে খুঁজুন এবং পেইড পরীক্ষা ও রিসোর্সের অ্যাক্সেস দিন।
        </p>

        <form onSubmit={searchStudent} className="flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="স্টুডেন্টের ইমেইল লিখুন..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-primary-light text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            {loading ? 'খুঁজছে...' : 'খুঁজুন'}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
        {success && <p className="text-green-500 mt-4 font-medium">{success}</p>}
      </div>

      {foundUser && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-light/10 text-primary-light rounded-full flex items-center justify-center font-bold text-2xl">
                {foundUser.name ? foundUser.name.charAt(0).toUpperCase() : foundUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{foundUser.name || 'নাম নেই'}</h3>
                <p className="text-gray-500">{foundUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800">
                  স্ট্যাটাস: 
                  <span className={foundUser.hasPaidAccess ? "text-green-500" : "text-gray-500"}>
                    {foundUser.hasPaidAccess ? 'পেইড ইউজার (Premium)' : 'ফ্রি ইউজার (Free)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={togglePremiumAccess}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-70 ${
                foundUser.hasPaidAccess 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {foundUser.hasPaidAccess ? (
                <><UserX size={20} /> অ্যাক্সেস বাতিল করুন</>
              ) : (
                <><UserCheck size={20} /> পেইড অ্যাক্সেস দিন</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
