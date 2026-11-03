import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { BookPlus, List, Users, BarChart3, FileText, Settings, Package, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const { t, language } = useLanguage();

  if (loading) {
    return <div className="p-8 text-center">{t('loading')}</div>;
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
            {t('dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'bn' 
              ? `স্বাগতম, ${user.displayName || 'গেস্ট ইউজার'}! (${role === 'owner' ? 'শিক্ষক' : role === 'assistant' ? 'সহকারী' : 'শিক্ষার্থী'})` 
              : `Welcome, ${user.displayName || 'Guest User'}! (${role === 'owner' ? 'Teacher' : role === 'assistant' ? 'Assistant' : 'Student'})`}
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
            <h3 className="text-xl font-bold mb-2">{t('createExam')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'ম্যানুয়ালি প্রশ্ন টাইপ করে বা Excel/CSV ফাইলের মাধ্যমে একসাথে অনেক প্রশ্ন আপলোড করুন।' : 'Create questions manually or upload bulk questions using Excel/CSV.'}
            </p>
          </Link>

          <Link to="/manage-packages" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('managePackages')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'শিক্ষার্থীদের জন্য নতুন স্পেশাল ব্যাচ, কোর্স প্যাকেজ ও মূল্য নির্ধারণ করুন।' : 'Configure special batches, course packages, and pricing for students.'}
            </p>
          </Link>

          <Link to="/manage-resources" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary-light/10 text-primary-light dark:bg-primary-dark/10 dark:text-primary-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <List size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('manageResources')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'শিক্ষার্থীদের জন্য লেকচার শিট এবং বইয়ের লিংক (Google Drive বা Cloudinary) যোগ করুন।' : 'Upload lecture sheets, class notes, and book PDF links.'}
            </p>
          </Link>

          <Link to="/manage-students" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('manageStudents')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'শিক্ষার্থীদের ব্যক্তিগত প্রোফাইল, পরীক্ষার ফলাফল, খাতা এবং পেইড অ্যাক্সেস চেক করুন।' : 'View student profiles, exam results, submitted answer sheets, and grant access.'}
            </p>
          </Link>

          <Link to="/teacher-doubts" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('teacherDoubts')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'বিভিন্ন পরীক্ষায় শিক্ষার্থীদের করা সব ডাউট প্রশ্ন সিরিয়াল আকারে দেখুন এবং উত্তর দিন।' : 'Review and answer doubtful questions raised by students across all exams.'}
            </p>
          </Link>

          <Link to="/admin-settings" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('adminSettings')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'পেমেন্ট পপ-আপের জন্য আপনার নাম, WhatsApp এবং টেলিগ্রাম আপডেট করুন।' : 'Update your contact information, WhatsApp, and Telegram for payment guidance.'}
            </p>
          </Link>
        </div>
      ) : (
        // ================= STUDENT DASHBOARD =================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/my-exams" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary-light/10 text-primary-light dark:bg-primary-dark/10 dark:text-primary-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('myExams')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'আপনার দেওয়া পরীক্ষাগুলোর হিস্ট্রি এবং বিস্তারিত ফলাফল দেখুন।' : 'View your exam history, scores, and past attempt reviews.'}
            </p>
          </Link>

          <Link to="/mistakes" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookPlus size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('mistakeBank')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'পরীক্ষায় করা আপনার সব ভুল উত্তর এবং তাদের ব্যাখ্যা একসাথে দেখুন।' : 'Review all your incorrect answers along with explanations.'}
            </p>
          </Link>

          <Link to="/my-doubts" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('myDoubts')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'পরীক্ষায় আপনার জিজ্ঞেস করা সব ডাউট এবং শিক্ষকদের দেওয়া উত্তরগুলো দেখুন।' : 'Track all questions you asked and read replies from teachers.'}
            </p>
          </Link>

          <Link to="/performance" className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-accent-light/10 text-accent-light dark:bg-accent-dark/10 dark:text-accent-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('performance')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {language === 'bn' ? 'কোন বিষয়ে আপনি দুর্বল এবং কোনটিতে ভালো করছেন তার গ্রাফিক্যাল অ্যানালাইসিস।' : 'Graphical analytics of your strong and weak subject areas.'}
            </p>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
