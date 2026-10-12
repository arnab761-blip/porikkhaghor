import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll immediately
    window.scrollTo(0, 0);
    // Scroll again after a tiny delay to override Framer Motion's snap back
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, [pathname]);

  return null;
}
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/CreateExam';
import ExamList from './pages/ExamList';
import TakeExam from './pages/TakeExam';
import ExamResult from './pages/ExamResult';
import MistakeBank from './pages/MistakeBank';
import Resources from './pages/Resources';
import ManageResources from './pages/ManageResources';
import ManageStudents from './pages/ManageStudents';
import AdminSettings from './pages/AdminSettings';
import Performance from './pages/Performance';
import Packages from './pages/Packages';
import ManagePackages from './pages/ManagePackages';
import MyExams from './pages/MyExams';
import Leaderboard from './pages/Leaderboard';

// Wrapper for AnimatePresence to work with routes
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-exam" element={<CreateExam />} />
        <Route path="/exams" element={<ExamList />} />
        <Route path="/take-exam/:id" element={<TakeExam />} />
        <Route path="/result/:resultId" element={<ExamResult />} />
        <Route path="/leaderboard/:examId" element={<Leaderboard />} />
        <Route path="/mistakes" element={<MistakeBank />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/manage-resources" element={<ManageResources />} />
        <Route path="/manage-packages" element={<ManagePackages />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/courses" element={<Packages />} />
        <Route path="/my-exams" element={<MyExams />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <MainLayout>
          <AnimatedRoutes />
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
