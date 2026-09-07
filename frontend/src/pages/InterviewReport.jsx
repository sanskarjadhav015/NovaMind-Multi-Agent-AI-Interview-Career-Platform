import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Step3report from '../components/interview/Step3report';
import { getInterview } from '../api/interview.api';

function InterviewReport({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        const res = await getInterview(id);
        if (!isMounted) return;

        if (res?.success && res?.interview) {
          setInterview(res.interview);
        } else {
          setErrorMessage(res?.message || 'Interview report not found.');
        }
      } catch (err) {
        console.error('Error fetching interview report:', err);
        if (isMounted) setErrorMessage('Failed to load interview report.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FBFBFC] text-neutral-900">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-700">Compiling Comprehensive Interview Analytics...</p>
      </div>
    );
  }

  if (errorMessage || !interview) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FBFBFC] text-neutral-900 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-neutral-200 text-center shadow-lg">
          <h2 className="text-lg font-bold text-neutral-950 mb-2">Report Not Found</h2>
          <p className="text-xs text-neutral-500 mb-6">{errorMessage || 'Unable to load performance report.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Step3report interview={interview} user={user} setUser={setUser} />;
}

export default InterviewReport;
