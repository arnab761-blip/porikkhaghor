import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { BookPlus, List, Users, BarChart3, FileText, Settings, Package, MessageSquare } from 'lucide-react';
export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">লোড হচ্ছে...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isTeacher = role === 'owner' || role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-light dark:text-primary-dark">
            ড্যাশবোর্ড
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            স্বাগতম, {user.displayName || 'গেস্ট ইউজার'}! ({role === 'owner' ? 'শিক্ষক' : role === 'assistant' ? 'সহকারী' : 'শিক্ষার্থী'})
          </p>
        </div>

      </div>

      {isTeacher ? (
        // ================= TEACHER DASHBOARD =================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/create-exam" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-accent-light/10 text-accent-light dark:bg-accent-dark/10 dark:text-accent-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookPlus size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">নতুন পরীক্ষা তৈরি করুন</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">ম্যানুয়ালি প্রশ্ন টাইপ করে বা Excel/CSV ফাইলের মাধ্যমে একসাথে অনেক প্রশ্ন আপলোড করুন।</p>
          </Link>

          <Link to="/manage-packages" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">প্যাকেজ ও কোর্স পরিচালনা</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">শিক্ষার্থীদের জন্য নতুন স্পেশাল ব্যাচ, কোর্স প্যাকেজ ও মূল্য নির্ধারণ করুন।</p>
          </Link>

          <Link to="/manage-resources" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary-light/10 text-primary-light dark:bg-primary-dark/10 dark:text-primary-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <List size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">রিসোর্স ও পিডিএফ আপলোড</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">শিক্ষার্থীদের জন্য লেকচার শিট এবং বইয়ের লিংক (Google Drive বা Cloudinary) যোগ করুন।</p>
          </Link>

          <Link to="/manage-students" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">শিক্ষার্থী ও ফলাফল ম্যানেজমেন্ট</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">শিক্ষার্থীদের ব্যক্তিগত প্রোফাইল, পরীক্ষার ফলাফল, খাতা এবং পেইড অ্যাক্সেস চেক করুন।</p>
          </Link>

          <Link to="/admin-settings" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">অ্যাডমিন সেটিংস</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">পেমেন্ট পপ-আপের জন্য আপনার নাম, WhatsApp এবং টেলিগ্রাম আপডেট করুন।</p>
          </Link>
        </div>
      ) : (
        // ================= STUDENT DASHBOARD =================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/my-exams" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary-light/10 text-primary-light dark:bg-primary-dark/10 dark:text-primary-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">আমার পরীক্ষাগুলো</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">আপনার দেওয়া পরীক্ষাগুলোর হিস্ট্রি এবং বিস্তারিত ফলাফল দেখুন।</p>
          </Link>

          <Link to="/mistakes" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookPlus size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">ভুল উত্তরের ডায়েরি</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">পরীক্ষায় করা আপনার সব ভুল উত্তর এবং তাদের ব্যাখ্যা একসাথে দেখুন।</p>
          </Link>

          <Link to="/my-doubts" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">আমার প্রশ্ন ও ডাউটসমূহ</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">পরীক্ষায় আপনার জিজ্ঞেস করা সব ডাউট এবং শিক্ষকদের দেওয়া উত্তরগুলো দেখুন।</p>
          </Link>

          <Link to="/performance" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-accent-light/10 text-accent-light dark:bg-accent-dark/10 dark:text-accent-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">পারফরম্যান্স</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">কোন বিষয়ে আপনি দুর্বল এবং কোনটিতে ভালো করছেন তার গ্রাফিক্যাল অ্যানালাইসিস।</p>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
