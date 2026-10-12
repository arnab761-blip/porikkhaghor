import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, updateDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  ListChecks, 
  Sparkles, 
  Image as ImageIcon, 
  Edit3, 
  X, 
  Eye 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { formatImageUrl } from '../lib/imageUtils';

interface CoursePackage {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  imageUrl?: string;
}

export default function ManagePackages() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currentFeature, setCurrentFeature] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'অধ্যায়ভিত্তিক ও পূর্ণাঙ্গ মডেল টেস্ট',
    'প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও ব্যাখ্যা',
    'ভুল উত্তরের ডায়েরি ও রিভিশন সুবিধা'
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'owner' && role !== 'assistant') {
      navigate('/dashboard');
      return;
    }
    fetchPackages();
  }, [role, navigate]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
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

  const handleStartEdit = (pkg: CoursePackage) => {
    setEditingId(pkg.id);
    setTitle(pkg.title);
    setDescription(pkg.description || '');
    setPrice(pkg.price);
    setImageUrl(pkg.imageUrl || '');
    setFeatures(pkg.features || [
      'অধ্যায়ভিত্তিক ও পূর্ণাঙ্গ মডেল টেস্ট',
      'প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও ব্যাখ্যা',
      'ভুল উত্তরের ডায়েরি ও রিভিশন সুবিধা'
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setPrice('');
    setFeatures([
      'অধ্যায়ভিত্তিক ও পূর্ণাঙ্গ মডেল টেস্ট',
      'প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও ব্যাখ্যা',
      'ভুল উত্তরের ডায়েরি ও রিভিশন সুবিধা'
    ]);
  };

  const handleAddFeature = () => {
    if (!currentFeature.trim()) return;
    setFeatures([...features, currentFeature.trim()]);
    setCurrentFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleQuickAddFeature = (text: string) => {
    if (!features.includes(text)) {
      setFeatures([...features, text]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || price === '' || features.length === 0) {
      alert('অনুগ্রহ করে প্যাকেজের নাম, মূল্য এবং অন্তত একটি সুবিধা লিখুন।');
      return;
    }

    try {
      setIsSaving(true);
      const pkgData: any = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        imageUrl: imageUrl.trim(),
        features,
      };

      if (editingId) {
        pkgData.updatedAt = serverTimestamp();
        await updateDoc(doc(db, 'packages', editingId), pkgData);
        alert('প্যাকেজটি সফলভাবে আপডেট ও ছবি সংরক্ষণ করা হয়েছে!');
      } else {
        pkgData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'packages'), pkgData);
        alert('প্যাকেজ সফলভাবে তৈরি হয়েছে! শিক্ষার্থীরা এখন প্যাকেজ পেজে এটি দেখতে পাবে।');
      }

      handleCancelEdit();
      fetchPackages();
    } catch (error) {
      console.error(error);
      alert('প্যাকেজ সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, pkgTitle: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${pkgTitle}" প্যাকেজটি ডিলিট করতে চান?`)) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
      if (editingId === id) {
        handleCancelEdit();
      }
      fetchPackages();
    } catch (error) {
      console.error(error);
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const toBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
  };

  const sampleSuggestions = [
    'অধ্যায়ভিত্তিক ও পূর্ণাঙ্গ মডেল টেস্ট',
    'প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও ব্যাখ্যা',
    'ভুল উত্তরের ডায়েরি ও রিভিশন সুবিধা',
    'লাইভ মেধা তালিকা ও র‍্যাঙ্কিং',
    'পিডিএফ লেকচার শিট ও রিসোর্স',
    'আনলিমিটেড প্র্যাকটিস টেস্ট',
    'স্পেশাল ডাউট সলভিং সাপোর্ট',
    'বিগত বছরের প্রশ্ন সমাধান'
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-16 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package size={32} className="text-primary-light dark:text-primary-dark" />
            প্যাকেজ ও কোর্স ম্যানেজমেন্ট
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            শিক্ষার্থীদের জন্য পেইড প্যাকেজ বা মডেল টেস্ট ব্যাচ তৈরি, ছবি যোগ ও পরিচালনা করুন।
          </p>
        </div>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium self-start sm:self-auto"
        >
          <Eye size={16} /> শিক্ষার্থীদের প্যাকেজ পেজ দেখুন
        </Link>
      </div>

      {/* CREATE / EDIT PACKAGE FORM */}
      <div className={`bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border ${
        editingId ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200 dark:border-gray-800'
      } mb-10 transition-all`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 className="text-amber-500" size={22} /> 
                প্যাকেজ সম্পাদনা ও ছবি পরিবর্তন করুন
              </>
            ) : (
              <>
                <Plus className="text-primary-light dark:text-primary-dark" size={22} /> 
                নতুন প্যাকেজ তৈরি করুন
              </>
            )}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <X size={14} /> এডিট বাতিল
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">প্যাকেজের নাম *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="যেমন: textile engineering special"
                className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                <DollarSign size={16} /> প্যাকেজের মূল্য (টাকায়) *
              </label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="যেমন: 199"
                min="0"
                className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="প্যাকেজটি কাদের জন্য বা কী কী অন্তর্ভুক্ত রয়েছে তার সংক্ষিপ্ত বিবরণ দিন..."
              className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light text-sm"
            />
          </div>

          {/* PACKAGE IMAGE URL INPUT WITH LIVE PREVIEW */}
          <div className="bg-primary-light/5 dark:bg-primary-dark/5 p-4 rounded-2xl border border-primary-light/10">
            <label className="block text-sm font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                <ImageIcon size={18} className="text-primary-light dark:text-primary-dark" /> 
                প্যাকেজের আকর্ষণীয় কভার বা ব্যানার ছবি (ঐচ্ছিক)
              </span>
              <span className="text-xs text-primary-light dark:text-primary-dark font-normal">
                Google Drive, Cloudinary বা সরাসরি লিংক
              </span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="যেমন: https://drive.google.com/file/d/1A2B... অথবা https://res.cloudinary.com/..."
              className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-light text-sm bg-white"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1">
              <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>ড্রাইভ লিংক টিপস:</strong> গুগল ড্রাইভে ছবির উপর রাইট ক্লিক করে <em>Share &gt; Anyone with the link</em> সিলেক্ট করে লিংক কপি করে এখানে পেস্ট করুন। স্বয়ংক্রিয়ভাবে সরাসরি কার্ডের উপরে ছবি লোড হবে।
              </span>
            </p>

            {/* Live Image Preview */}
            {imageUrl.trim() && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-green-600" /> ছবির প্রিভিউ (Live Preview):
                </span>
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-44 sm:h-52 w-full flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
                  <img
                    src={formatImageUrl(imageUrl)}
                    alt="ব্যানার প্রিভিউ"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-preview-error')) {
                        const err = document.createElement('div');
                        err.className = 'img-preview-error text-xs text-red-500 p-4 text-center font-medium';
                        err.innerText = '⚠️ ছবিটি লোড হতে পারছে না। গুগল ড্রাইভের লিংক হলে ফাইলটি "Anyone with the link can view" পারমিশন দেওয়া আছে কিনা চেক করুন।';
                        parent.appendChild(err);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Features Builder */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <ListChecks size={18} /> প্যাকেজের সুবিধাসমূহ (Features) *
            </label>
            
            {/* Input to add feature */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentFeature}
                onChange={e => setCurrentFeature(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="একটি সুবিধা লিখুন (যেমন: ২০টি পেপার ফাইনাল এক্সাম)"
                className="flex-1 p-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-sm transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> যোগ করুন
              </button>
            </div>

            {/* Quick add suggestion chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Sparkles size={13} className="text-amber-500" /> সাজেস্টেড:
              </span>
              {sampleSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickAddFeature(sug)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-primary-light/5 hover:bg-primary-light/10 dark:bg-primary-dark/15 dark:hover:bg-primary-dark/25 text-primary-light dark:text-primary-dark border border-primary-light/20 dark:border-primary-dark/30 transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>

            {/* Current Feature List */}
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              {features.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">কোনো সুবিধা যোগ করা হয়নি। উপরে লিখে যোগ করুন।</p>
              ) : (
                features.map((feat, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <span>{feat}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                বাতিল করুন
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-3 ${
                editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
              } text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md`}
            >
              <Package size={20} />
              {isSaving ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট সংরক্ষণ করুন' : 'প্যাকেজটি প্রকাশ করুন'}
            </button>
          </div>
        </form>
      </div>

      {/* EXISTING PACKAGES LIST */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center justify-between">
          <span>বিদ্যমান প্যাকেজসমূহ ({packages.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-gray-500">প্যাকেজ লোড হচ্ছে...</div>
        ) : packages.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">এখনো কোনো প্যাকেজ তৈরি করা হয়নি। উপরের ফর্ম পূরণ করে আপনার প্রথম প্যাকেজটি তৈরি করুন!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Image / Placeholder */}
                  {pkg.imageUrl ? (
                    <div className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={formatImageUrl(pkg.imageUrl)}
                        alt={pkg.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                        <ImageIcon size={12} className="text-green-400" /> কভার ছবি যুক্ত
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-28 bg-gradient-to-br from-primary-light/90 to-primary-dark p-4 flex items-center justify-between overflow-hidden">
                      <span className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-300" /> ছবি নেই (ডিফল্ট ব্যানার)
                      </span>
                      <Package size={40} className="text-white/20 absolute -right-1 -bottom-1 rotate-12" />
                    </div>
                  )}

                  <div className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{pkg.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(pkg)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                          title="প্যাকেজ সম্পাদনা ও ছবি পরিবর্তন করুন"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.title)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="প্যাকেজটি মুছে ফেলুন"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{pkg.description}</p>
                    )}

                    <div className="mb-4">
                      <span className="text-3xl font-black text-primary-light dark:text-primary-dark">
                        ৳{toBengaliNumber(pkg.price)}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                      {pkg.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> লাইভ প্রকাশিত
                  </span>
                  <button
                    onClick={() => handleStartEdit(pkg)}
                    className="text-primary-light dark:text-primary-dark hover:underline font-bold flex items-center gap-1"
                  >
                    <Edit3 size={13} /> ছবি/তথ্য এডিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
