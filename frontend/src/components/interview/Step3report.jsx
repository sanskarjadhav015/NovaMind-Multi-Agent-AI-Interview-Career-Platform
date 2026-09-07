import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiPrinter,
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiCpu,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiFileText,
  FiCode,
  FiZap,
  FiMessageSquare,
  FiHelpCircle
} from 'react-icons/fi';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

/* -------------------------------------------------------------------------- */
/*                                SCORE RING                                  */
/* -------------------------------------------------------------------------- */
const ScoreRing = ({ score = 0 }) => {
  const validScore = Math.min(Math.max(Number(score) || 0, 0), 100);

  const getColor = (s) => {
    if (s >= 80) return "#7c3aed"; // Purple
    if (s >= 65) return "#10b981"; // Emerald
    if (s >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const color = getColor(validScore);
  const chartData = [{ name: "score", value: validScore, fill: color }];

  return (
    <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="94%"
          startAngle={90}
          endAngle={-270}
          data={chartData}
          barSize={12}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: "#f1f5f9" }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 leading-none">
          {validScore}
        </span>
        <span className="text-[10px] sm:text-xs font-bold text-neutral-400 mt-1 uppercase tracking-wider">
          / 100 Overall
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            MAIN STEP3 REPORT                               */
/* -------------------------------------------------------------------------- */
function Step3report({ interview, user, setUser }) {
  const navigate = useNavigate();
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  const questions = interview?.questions || [];
  const rawScore = Number(interview?.overallScore) || 0;

  // Compute average scores across individual questions
  const totalQ = questions.length || 1;
  const avgCorrectness = Math.round(
    questions.reduce((acc, q) => acc + (q.feedback?.correctness || q.feedback?.score || 0), 0) / totalQ
  );
  const avgClarity = Math.round(
    questions.reduce((acc, q) => acc + (q.feedback?.clarity || q.feedback?.score || 0), 0) / totalQ
  );
  const avgRelevance = Math.round(
    questions.reduce((acc, q) => acc + (q.feedback?.relevance || q.feedback?.score || 0), 0) / totalQ
  );
  const avgCommunication = Math.round(
    questions.reduce((acc, q) => acc + (q.feedback?.communication || q.feedback?.clarity || 0), 0) / totalQ
  );
  const avgProblemSolving = Math.round(
    questions.reduce((acc, q) => acc + (q.feedback?.problemSolving || q.feedback?.efficiency || 0), 0) / totalQ
  );

  const performanceTier =
    rawScore >= 80
      ? {
          title: "Interview Ready - Strong Match",
          textColor: "text-purple-700",
          bgColor: "bg-purple-50 border-purple-200",
          dotColor: "bg-purple-600",
          verdict: "Demonstrated advanced problem solving and deep clarity. Minor refinement will ensure top-percentile hiring outcomes."
        }
      : rawScore >= 65
      ? {
          title: "Promising - Good Foundation",
          textColor: "text-emerald-700",
          bgColor: "bg-emerald-50 border-emerald-200",
          dotColor: "bg-emerald-500",
          verdict: "Solid grasp of core requirements with good communication. Focus on implementation depth and edge-case handling."
        }
      : rawScore >= 50
      ? {
          title: "Developing - Needs Practice",
          textColor: "text-amber-700",
          bgColor: "bg-amber-50 border-amber-200",
          dotColor: "bg-amber-500",
          verdict: "Basic concepts covered, but several technical gaps and structure improvements are recommended before real interviews."
        }
      : {
          title: "Needs Foundational Review",
          textColor: "text-rose-700",
          bgColor: "bg-rose-50 border-rose-200",
          dotColor: "bg-rose-500",
          verdict: "Review fundamental architectural concepts and practice mock interviews to build clarity under time pressure."
        };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col font-sans pb-20">
      {/* Top Bar */}
      <header className="h-14 border-b border-black/[0.08] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shadow-xs transition-colors cursor-pointer"
          >
            <FiPrinter size={13} />
            <span className="hidden sm:inline">Print / Save PDF</span>
          </button>

          <button
            onClick={() => navigate('/interview')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FiRefreshCw size={13} />
            <span>Practice Another Role</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
              <FiAward size={15} />
              <span>AI Interview Evaluation Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
              {interview?.role || "Software Engineer"} Mock Assessment
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Track: <span className="font-semibold text-neutral-700 capitalize">{interview?.type || 'Technical'}</span> &bull; {questions.length} Questions Evaluated &bull; {new Date(interview?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${performanceTier.bgColor} ${performanceTier.textColor}`}>
              <span className={`w-2 h-2 rounded-full ${performanceTier.dotColor}`} />
              {performanceTier.title}
            </span>
          </div>
        </motion.div>

        {/* Hero Score Gauge Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-neutral-200/40"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <ScoreRing score={rawScore} />

            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-xl font-extrabold text-neutral-950">Overall Candidate Performance</h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {interview?.summary || performanceTier.verdict}
              </p>

              {/* Stat Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Correctness</p>
                  <p className="text-base font-bold text-neutral-900">{avgCorrectness}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Clarity</p>
                  <p className="text-base font-bold text-neutral-900">{avgClarity}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Problem Solving</p>
                  <p className="text-base font-bold text-purple-600">{avgProblemSolving}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Communication</p>
                  <p className="text-base font-bold text-emerald-600">{avgCommunication}%</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2-Column: Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Key Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FiCheckCircle size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Key Strengths</h3>
                  <p className="text-xs text-neutral-500">Standout qualities & positive signals</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {interview?.strengths?.length || 0}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {interview?.strengths && interview.strengths.length > 0 ? (
                interview.strengths.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs sm:text-sm text-neutral-800"
                  >
                    <FiCheck className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  Good overall performance.
                </p>
              )}
            </div>
          </motion.div>

          {/* Areas to Improve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col rounded-3xl border border-amber-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FiAlertCircle size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Areas for Growth</h3>
                  <p className="text-xs text-neutral-500">Skills to sharpen before real interviews</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {interview?.weaknesses?.length || 0}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {interview?.weaknesses && interview.weaknesses.length > 0 ? (
                interview.weaknesses.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/40 border border-amber-100 text-xs sm:text-sm text-neutral-800"
                  >
                    <FiAlertCircle className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  No critical blockers identified.
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Actionable Recommendations */}
        {interview?.recommendations && interview.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-purple-50">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FiTrendingUp size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Actionable Next Steps</h3>
                <p className="text-xs text-neutral-500">Targeted recommendations from the AI evaluation model</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interview.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs sm:text-sm text-neutral-800"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* QUESTION-BY-QUESTION DEEP DIVE ACCORDION                          */}
        {/* ================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
              <FiHelpCircle className="text-purple-600" />
              <span>Question-by-Question Deep Dive ({questions.length})</span>
            </h2>
            <span className="text-xs text-neutral-400">Click any question to inspect feedback & answer</span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestion === idx;
              const qScore = q.feedback?.score || 0;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs transition-all"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-2 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Difficulty: <span className="text-neutral-700">{q.difficulty || 'Easy'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                          qScore >= 80
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : qScore >= 60
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {qScore}/100
                      </span>

                      {isExpanded ? <FiChevronUp className="text-neutral-400" /> : <FiChevronDown className="text-neutral-400" />}
                    </div>
                  </div>

                  {/* Accordion Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 sm:p-5 pt-0 border-t border-neutral-100 space-y-4"
                      >
                        {/* Candidate's Answer */}
                        <div className="space-y-1.5 pt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Candidate's Submitted Answer:
                          </p>
                          <div className="p-3.5 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                            {q.userAnswer || "No answer recorded."}
                          </div>
                        </div>

                        {/* Interviewer Feedback */}
                        {q.feedback && (
                          <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs sm:text-sm text-neutral-800 leading-relaxed italic">
                              <span className="font-semibold text-purple-900 not-italic block mb-1">
                                Interviewer Critique:
                              </span>
                              "{q.feedback.feedback || 'Good attempt.'}"
                            </div>

                            {/* Sub-scores */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { name: 'Correctness', val: q.feedback.correctness },
                                { name: 'Clarity', val: q.feedback.clarity },
                                { name: 'Relevance', val: q.feedback.relevance },
                                { name: 'Problem Solving', val: q.feedback.problemSolving ?? q.feedback.efficiency }
                              ].map((item, i) => (
                                <div key={i} className="p-2 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center">
                                  <p className="text-[10px] uppercase font-bold text-neutral-400">{item.name}</p>
                                  <p className="text-xs font-bold text-neutral-800">{item.val ?? 0}%</p>
                                </div>
                              ))}
                            </div>

                            {/* Improvements */}
                            {q.feedback.improvements && q.feedback.improvements.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                  Actionable Improvements:
                                </p>
                                <div className="space-y-1">
                                  {q.feedback.improvements.map((imp, impIdx) => (
                                    <div
                                      key={impIdx}
                                      className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center">
                                        {impIdx + 1}
                                      </span>
                                      <span>{imp}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl bg-neutral-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
        >
          <div>
            <h3 className="text-lg font-bold">Ready to practice another role or question set?</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Regular simulation builds speed, structured responses, and live confidence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/interview')}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Start New Simulation
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

export default Step3report;
