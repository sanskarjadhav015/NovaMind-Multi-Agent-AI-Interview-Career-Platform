/**
 * @file App.jsx (Frontend)
 * @description Main application routing component for NovaMind AI Interview Platform.
 * Handles top-level authentication state verification, resumes fetching for authenticated users,
 * and declarative route protection.
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import { getCurrentUser } from './api/user.api';
import { getResume } from './api/resume.api';
import { useDispatch } from 'react-redux';
import { setResume } from './redux/resumeSlice';

// Lazy-loaded route components for optimized bundle splitting & faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scorer = lazy(() => import('./pages/Scorer'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const InterviewStart = lazy(() => import('./components/interview/Step1setup'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const InterviewReport = lazy(() => import('./pages/InterviewReport'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Billing = lazy(() => import('./pages/Billing'));

const PageLoader = () => (
  <div className='fixed top-0 left-0 w-full z-9999'>
    <div className='h-1 bg-black animate-pulse w-full' />
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  // Verify active session on initial application load
  useEffect(() => {
    const checkAuth = async () => {
      const data = await getCurrentUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch candidate resume only when user is authenticated
  useEffect(() => {
    const fetchResumeData = async () => {
      if (!user) return;
      const result = await getResume();
      if (result?.data) {
        dispatch(setResume(result.data));
      }
    };
    fetchResumeData();
  }, [user, dispatch]);

  // Global loading bar during initial session verification
  if (loading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing & Login */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home setUser={setUser} />} />

        {/* Authenticated Application Routes */}
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/scorer" element={user ? <Scorer user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/resume" element={user ? <ResumeBuilder user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/interview" element={user ? <InterviewStart user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/interview/:id" element={user ? <InterviewPage user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/interview/:id/report" element={user ? <InterviewReport user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/interview/:id/result" element={user ? <InterviewReport user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/roadmap" element={user ? <Roadmap user={user} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/billing" element={user ? <Billing user={user} setUser={setUser} /> : <Navigate to="/" replace />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;