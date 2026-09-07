import React, { useState } from 'react'
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiArrowLeft,
  FiBriefcase,
  FiFileText,
  FiCheck,
  FiZap,
  FiUploadCloud,
  FiAward,
  FiCpu,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiVolume2
} from 'react-icons/fi'
import { LuCoins, LuSparkles } from "react-icons/lu"
import { startInterview } from '../../api/interview.api'
import { useCoins } from '../../api/user.api'
import { setResume } from '../../redux/resumeSlice'
import api from '../../utils/axios'

const POPULAR_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "AI / ML Engineer",
  "DevOps Engineer",
  "Software Engineer",
  "Product Manager",
  "Data Scientist"
];

function Step1setup({ user, setUser }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { resume } = useSelector((state) => state.resume);

  const [role, setRole] = useState(resume?.suggestedRole || '');
  const [type, setType] = useState('technical');
  const [useResume, setUseResume] = useState(Boolean(resume));
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle inline PDF upload if user wants to upload fresh resume here
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setErrorMessage('');
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await api.post('/api/resume/upload', formData);

      if (res?.data?.data) {
        dispatch(setResume(res.data.data));
        setUseResume(true);
        if (!role && res.data.data.suggestedRole) {
          setRole(res.data.data.suggestedRole);
        }
      } else {
        setErrorMessage(res?.data?.message || 'Failed to parse resume PDF.');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      setErrorMessage(err?.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async () => {
    if (!role.trim()) {
      setErrorMessage('Please enter or select your target job role.');
      return;
    }

    const userCoins = Number(user?.interviewCoin ?? 0);
    if (userCoins < 50) {
      setErrorMessage(`Not enough Interview Coins (50 required, you have ${userCoins}). Please recharge in Billing.`);
      return;
    }

    try {
      setStarting(true);
      setErrorMessage('');

      // Deduct coins first
      const coinRes = await useCoins({ coins: 50, action: 'interview-start' });
      if (!coinRes?.success) {
        setErrorMessage(coinRes?.message || 'Coin transaction failed.');
        setStarting(false);
        return;
      }

      if (setUser) {
        setUser((prev) => ({
          ...prev,
          interviewCoin: coinRes.interviewCoin,
        }));
      }

      // Start interview backend session
      const interviewRes = await startInterview({
        role: role.trim(),
        type,
        useResume: Boolean(useResume && resume),
        resume: (useResume && resume) ? resume : {},
      });

      if (interviewRes?.success && interviewRes?.interviewId) {
        navigate(`/interview/${interviewRes.interviewId}`);
      } else {
        setErrorMessage(interviewRes?.message || 'Failed to initialize AI interview. Please try again.');
        setStarting(false);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-900">
      {/* Top Bar */}
      <header className="h-14 border-b border-black/[0.08] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-700">
            <LuCoins size={14} className="text-yellow-500" />
            <span>{user?.interviewCoin ?? 0} Coins</span>
          </div>

          <button
            onClick={() => navigate('/billing')}
            className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
          >
            + Get Coins
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Value Prop & Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold uppercase tracking-wider mb-3 shadow-2xs">
                <LuSparkles className="text-xs text-purple-600" />
                <span>AI Interview Simulator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                Simulate Your Next Dream Interview
              </h1>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Step into a live, interactive interview room powered by multi-agent AI. Experience real audio speech, speech-to-text transcription, a built-in code editor, and instant granular feedback.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-1">
              {[
                {
                  icon: <FiAward className="text-purple-600" />,
                  title: "Personalized Questions",
                  desc: "Adaptive questions constructed from your target role, difficulty progression, and uploaded resume."
                },
                {
                  icon: <FiVolume2 className="text-indigo-600" />,
                  title: "Real-time AI Voice & Subtitles",
                  desc: "Choose between female or male AI avatar voices with natural audio speech and live transcription."
                },
                {
                  icon: <FiClock className="text-amber-600" />,
                  title: "Realistic Pressure & Timer",
                  desc: "Dynamic time limits tailored to each question type with live countdown and warning notifications."
                },
                {
                  icon: <FiCheckCircle className="text-emerald-600" />,
                  title: "Granular Scoring & Report",
                  desc: "Receive immediate critique per answer and an in-depth scorecard with strengths and action items."
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:border-purple-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100 text-sm mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">{item.title}</h3>
                    <p className="text-[11px] text-neutral-500 leading-normal mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Session Cost Note */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <LuCoins size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950">Session Cost: 50 Coins</p>
                  <p className="text-[11px] text-amber-700">Includes full 6-question simulation & comprehensive report</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                50 pts
              </span>
            </div>
          </motion.div>

          {/* Right Column: Setup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xl shadow-neutral-200/40 space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-neutral-950">Configure Your Interview</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Customize your target job title, question format, and resume context.
              </p>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5"
              >
                <FiAlertCircle className="shrink-0 text-sm" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* 1. Target Role */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <FiBriefcase className="text-neutral-500" />
                <span>Target Job Role <span className="text-rose-500">*</span></span>
              </label>

              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, Frontend Developer..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-neutral-400"
              />

              {/* Popular Role Pills */}
              <div className="pt-1">
                <p className="text-[11px] font-medium text-neutral-400 mb-1.5">Quick select role:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        role === r
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Interview Track */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Interview Track & Focus
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setType('technical')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    type === 'technical'
                      ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm">
                      <FiCpu />
                    </div>
                    {type === 'technical' && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-xs">
                        <FiCheck />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 mt-2.5">Technical & Coding</h3>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                    Architecture, core system concepts, practical debugging, and live coding challenges.
                  </p>
                </div>

                <div
                  onClick={() => setType('hr')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    type === 'hr'
                      ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">
                      <FiUsers />
                    </div>
                    {type === 'hr' && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-xs">
                        <FiCheck />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 mt-2.5">HR & Behavioral</h3>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                    Leadership scenarios, STAR methodology, teamwork dynamics, and culture fit.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Resume Integration */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <FiFileText className="text-neutral-500" />
                    <span>Personalize with Resume</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    AI will frame questions directly around your actual projects and skills.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUseResume(!useResume)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    useResume ? 'bg-purple-600' : 'bg-neutral-300'
                  }`}
                >
                  <motion.div
                    layout
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform ${
                      useResume ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Resume Status Card */}
              {useResume && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 space-y-3"
                >
                  {resume ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                          <FiFileText size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">
                            {resume.name || 'Your Uploaded Resume'}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {resume.skills?.length || 0} skills detected &bull; ATS Score: {resume.score || 'N/A'}/100
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                        <FiCheck size={12} />
                        <span>Ready</span>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-600 font-medium">
                        No active resume found. Upload your PDF resume to unlock personalized questioning:
                      </p>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl p-4 bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                        <FiUploadCloud size={24} className="text-purple-600 mb-1" />
                        <span className="text-xs font-semibold text-neutral-800">
                          {uploading ? 'Analyzing Resume...' : 'Click to Upload Resume PDF'}
                        </span>
                        <span className="text-[10px] text-neutral-400">PDF up to 10MB</span>
                        <input
                          type="file"
                          accept=".pdf"
                          disabled={uploading}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Launch CTA */}
            <div className="pt-3">
              <motion.button
                whileHover={{ scale: starting ? 1 : 1.01 }}
                whileTap={{ scale: starting ? 1 : 0.98 }}
                onClick={handleStart}
                disabled={starting || uploading}
                className="w-full py-3.5 px-6 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-sm shadow-lg shadow-neutral-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Preparing AI Interview Session...</span>
                  </>
                ) : (
                  <>
                    <FiZap size={16} className="text-purple-400" />
                    <span>Start AI Interview Session (50 Coins)</span>
                  </>
                )}
              </motion.button>
              <p className="text-center text-[11px] text-neutral-400 mt-2.5">
                Make sure your microphone and camera permissions are enabled for the live interview room.
              </p>
            </div>

          </motion.div>

        </div>
      </main>
    </div>
  );
}

export default Step1setup;
