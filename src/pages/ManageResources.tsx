import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Save, Trash2, Link as LinkIcon, FileText, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Resource {
  id: string;
  title: string;
  category: string;
  url: string;
  isPaid: boolean;
  type: string;
}

export default function ManageResources() {
  const { role } = useAuth();
  const navigate = useNavigate();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('PDF');
  const [isPaid, setIsPaid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role !== 'owner' && role !== 'assistant') {
      navigate('/dashboard');
      return;
    }
    fetchResources();
  }, [role, navigate]);

  const fetchResources = async () => {
    try {
      const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const res = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[];
      setResources(res);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    try {
      setIsSaving(true);
      await addDoc(collection(db, 'resources'), {
        title,
        category,
        url,
        type,
        isPaid,
        createdAt: serverTimestamp()
      });
      
      setTitle('');
      setCategory('');
      setUrl('');
      setIsPaid(false);
      fetchResources();
      alert('রিসোর্স সফলভাবে যোগ করা হয়েছে!');
    } catch (error) {
      console.error(error);
      alert('রিসোর্স সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই রিসোর্সটি ডিলিট করতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      fetchResources();
    } catch (error) {
      console.error(error);
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-light dark:text-primary-dark">রিসোর্স ও পিডিএফ ম্যানেজমেন্ট</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">শিক্ষার্থীদের জন্য লেকচার শিট, বইয়ের পিডিএফ বা ড্রাইভ লিংক আপলোড করুন।</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText /> নতুন রিসোর্স যোগ করুন</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">রিসোর্সের নাম *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" placeholder="যেমন: Physics Chapter 1 PDF" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ক্যাটাগরি</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" placeholder="যেমন: Physics" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">লিংক (Google Drive / Cloudinary) * <LinkIcon size={14} /></label>
            <input type="url" required value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" placeholder="https://drive.google.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ধরন</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700">
              <option value="PDF">PDF Sheet</option>
              <option value="Video">Video Class</option>
              <option value="Note">Hand Note</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="isPaidResource" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-5 h-5 accent-accent-light" />
            <label htmlFor="isPaidResource" className="font-medium">এটি একটি পেইড রিসোর্স (লক করা থাকবে)</label>
          </div>
          
          <div className="md:col-span-2 mt-4">
            <button type="submit" disabled={isSaving} className="w-full md:w-auto px-8 py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
              <Save size={20} /> {isSaving ? 'সেভ হচ্ছে...' : 'রিসোর্স সেভ করুন'}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-xl font-bold mb-6">আপলোড করা রিসোর্সসমূহ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(res => (
          <div key={res.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{res.type}</span>
                {res.isPaid && <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex items-center gap-1"><Lock size={12} /> পেইড</span>}
              </div>
              <h3 className="font-bold text-lg mb-1">{res.title}</h3>
              <p className="text-sm text-gray-500 mb-3">ক্যাটাগরি: {res.category || 'N/A'}</p>
              <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <LinkIcon size={14} /> ওপেন লিংক
              </a>
            </div>
            <button onClick={() => handleDelete(res.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
