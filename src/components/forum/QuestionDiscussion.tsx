import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathText } from '../MathText';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export default function QuestionDiscussion({ examId, questionIndex }: { examId: string, questionIndex: number }) {
  const { user } = useAuth();
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
      await addDoc(collection(db, 'doubts'), {
        examId,
        questionIndex,
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('কমেন্ট পোস্ট করতে সমস্যা হয়েছে।');
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
        {isOpen ? 'আলোচনা বন্ধ করুন' : `ডাউট ক্লিয়ারিং / আলোচনা (${comments.length > 0 ? comments.length : 'নতুন'})`}
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
                <p className="text-sm text-gray-400 italic">এখনো কোনো প্রশ্ন বা আলোচনা নেই। প্রথম কমেন্টটি আপনি করুন!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-xs text-primary-light dark:text-primary-dark">{c.userName}</span>
                    <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                      <MathText text={c.text} />
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="আপনার ডাউট বা প্রশ্ন লিখুন..."
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
