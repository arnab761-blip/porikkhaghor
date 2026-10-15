import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  examId: string;
  questionIndex: number;
  read: boolean;
  replyText?: string;
  createdAt: any;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as NotificationItem[];

      // Sort client-side by date descending
      items.sort((a, b) => {
        const tA = a.createdAt?.toMillis() || 0;
        const tB = b.createdAt?.toMillis() || 0;
        return tB - tA;
      });

      setNotifications(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const ref = doc(db, 'notifications', id);
      await updateDoc(ref, { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
        title="নোটিফিকেশন"
        aria-label="নোটিফিকেশন"
      >
        <Bell size={20} />
        
        {/* Glowing Red Dot when there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-white dark:border-gray-900"></span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">নোটিফিকেশন</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}টি নতুন
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-light dark:text-primary-dark hover:underline flex items-center gap-1 font-medium"
                >
                  <Check size={14} /> সব পঠিত করুন
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  কোনো নতুন নোটিফিকেশন নেই
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      !item.read ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                        {item.title}
                      </h4>
                      <Link
                        to="/my-doubts"
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-0.5"
                      >
                        দেখুন <ExternalLink size={12} />
                      </Link>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {item.replyText && (
                      <div className="mt-2 text-xs bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                        <strong className="text-blue-600 dark:text-blue-400">শিক্ষক: </strong>
                        {item.replyText}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 text-center">
              <Link
                to="/my-doubts"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary-light dark:text-primary-dark hover:underline block"
              >
                আমার সকল ডাউট ও প্রশ্ন দেখুন →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
