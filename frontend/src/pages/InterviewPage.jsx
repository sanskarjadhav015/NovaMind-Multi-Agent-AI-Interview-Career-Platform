import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Step2interview from '../components/interview/Step2interview';
import { getInterview } from '../api/interview.api';

function InterviewPage({ user, setUser }) {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchInterviewData = async () => {
      try {
        const response = await getInterview(id);
        if (!isMounted) return;

        if (response?.success && response?.interview) {
          const data = response.interview;
          if (data.status === 'completed' || data.status === 'Completed') {
            navigate(`/interview/${id}/report`, { replace: true });
            return;
          }
          setInterview(data);
        } else {
          setErrorMessage(response?.message || 'Interview session not found.');
        }
      } catch (err) {
        console.error('Error loading interview:', err);
        if (isMounted) setErrorMessage('Failed to load interview session.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInterviewData();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FBFBFC] text-neutral-900">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-700">Connecting to AI Interview Room...</p>
      </div>
    );
  }

  if (errorMessage || !interview) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FBFBFC] text-neutral-900 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-neutral-200 text-center shadow-lg">
          <h2 className="text-lg font-bold text-neutral-950 mb-2">Unable to Load Interview</h2>
          <p className="text-xs text-neutral-500 mb-6">{errorMessage || 'Interview session could not be found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <Step2interview
      interviewData={{
        interviewId: interview._id,
        currentQuestion: interview.currentQuestion ?? 0,
        totalQuestions: interview.questions?.length ?? 6,
        question: interview.questions?.[interview.currentQuestion ?? 0] ?? {},
        role: interview.role,
        type: interview.type,
      }}
      user={user}
      setUser={setUser}
    />
  );
}

export default InterviewPage;
