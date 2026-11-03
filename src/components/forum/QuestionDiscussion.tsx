import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathText } from '../MathText';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  text: string;
  createdAt: any;
}

export default function QuestionDiscussion({ 
  examId, 
  questionIndex,
  examTitle,
  questionText
}: { 
  examId: string;
  questionIndex: number;
  examTitle?: string;
  questionText?: string;
}) {
  const { user, role } = useAuth();
  const { t, toLangNumber, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'doubts'),
      where('examId', '==', examId),
      where('questionIndex', '==', questionIndex)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Sort in JS to avoid requiring a composite index in Firestore
      fetchedComments.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB;
      });
      
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [examId, questionIndex, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const isTeacher = role === 'owner' || role === 'assistant';

      await addDoc(collection(db, 'doubts'), {
        examId,
        questionIndex,
        examTitle: examTitle || (language === 'bn' ? 'পরীক্ষা' : 'Exam'),
        questionText: questionText || '',
        userId: user.uid,
        userName: user.displayName || (isTeacher ? t('teacherBadge') : t('studentBadge')),
        userRole: role || 'student',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // If teacher replies, send notification to students who asked doubts in this question
      if (isTeacher) {
        // Find unique student userIds who asked in this question
        const studentUserIds = Array.from(new Set(
          comments
            .filter(c => c.userId && c.userId !== user.uid && c.userRole !== 'owner' && c.userRole !== 'assistant')
            .map(c => c.userId)
        ));

        for (const targetUserId of studentUserIds) {
          await addDoc(collection(db, 'notifications'), {
            userId: targetUserId,
            title: language === 'bn' ? 'শিক্ষক আপনার প্রশ্নের উত্তর দিয়েছেন 🎓' : 'Teacher replied to your question 🎓',
            message: language === 'bn'
              ? `"${examTitle || 'পরীক্ষা'}"-এর ${toLangNumber(questionIndex + 1)} নম্বর প্রশ্নে শিক্ষক আপনার ডাউটের উত্তর দিয়েছেন।`
              : `Teacher answered your doubt on Question #${toLangNumber(questionIndex + 1)} in "${examTitle || 'Exam'}".`,
            examId,
            questionIndex,
            createdAt: serverTimestamp(),
            read: false,
            replyText: newComment.trim()
          });
        }
      } else {
        // If student asks doubt, send notification to teacher
        await addDoc(collection(db, 'notifications'), {
          forTeacher: true,
          title: language === 'bn' ? 'নতুন ডাউট প্রশ্ন ❓' : 'New Doubt Question ❓',
          message: language === 'bn'
            ? `${user.displayName || 'একজন শিক্ষার্থী'} "${examTitle || 'পরীক্ষা'}"-এর ${toLangNumber(questionIndex + 1)} নম্বর প্রশ্নে একটি নতুন ডাউট জিজ্ঞেস করেছে।`
            : `${user.displayName || 'A student'} asked a new doubt on Question #${toLangNumber(questionIndex + 1)} in "${examTitle || 'Exam'}".`,
          examId,
          questionIndex,
          createdAt: serverTimestamp(),
          read: false,
          replyText: newComment.trim()
        });
      }

      setNewComment('');
    } catch (error) {
      console.error(error);
      alert(t('commentPostError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
      >
        <MessageCircle size={18} />
        {isOpen ? t('toggleDiscussionClose') : `${t('toggleDiscussionOpen')} (${comments.length > 0 ? toLangNumber(comments.length) : (language === 'bn' ? 'নতুন' : 'New')})`}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('noCommentsYet')}</p>
              ) : (
                comments.map(c => {
                  const isTeacherComment = c.userRole === 'owner' || c.userRole === 'assistant';
                  return (
                    <div 
                      key={c.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        isTeacherComment 
                          ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-700' 
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-xs ${isTeacherComment ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-primary-light dark:text-primary-dark'}`}>
                          {c.userName}
                        </span>
                        {isTeacherComment && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                            {t('teacherBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <MathText text={c.text} />
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('newCommentPlaceholder')}
                className="flex-grow p-3 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-accent-light focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-2 top-2 p-1.5 text-accent-light dark:text-accent-dark hover:bg-accent-light/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
