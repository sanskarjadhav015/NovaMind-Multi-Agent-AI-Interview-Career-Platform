/**
 * @file App.jsx (Frontend)
 * @description Main application routing component for NovaMind AI Interview Platform.
 * Handles top-level authentication state verification, resumes fetching for authenticated users,
 * and declarative route protection.
 */

import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { getCurrentUser } from './api/user.api';
import Scorer from './pages/Scorer';
import { getResume } from './api/resume.api';
import { useDispatch } from 'react-redux';
import { setResume } from './redux/resumeSlice';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewStart from './pages/InterviewStart';
import InterviewPage from './pages/InterviewPage';
import InterviewReport from './pages/InterviewReport';
import Roadmap from './pages/Roadmap';
import Billing from './pages/Billing';

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
    return (
      <div className='fixed top-0 left-0 w-full z-9999'>
        <div className='h-1 bg-black animate-pulse w-full' />
      </div>
    );
  }

  return (
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
  );
}

export default App;