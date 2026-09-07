import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from "motion/react"
import {
  FiUploadCloud,
  FiFileText,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiAward,
  FiTarget,
  FiZap,
  FiCheck,
  FiLayers,
  FiPrinter,
  FiTrash2,
  FiCpu,
  FiCode,
  FiBookOpen,
  FiX,
  FiPlusCircle
} from 'react-icons/fi'
import api from '../utils/axios.js'
import { useDispatch, useSelector } from 'react-redux'
import { setResume } from '../redux/resumeSlice.js'
import { getResume } from '../api/resume.api.js'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts"
import { useCoins } from '../api/user.api.js'

import { LuCoins } from "react-icons/lu"

/* -------------------------------------------------------------------------- */
/*                                NAVBAR COMPONENT                            */
/* -------------------------------------------------------------------------- */
const Navbar = ({ label, user }) => {
  const navigate = useNavigate()

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-30 border-b border-black/[0.08] bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-85"
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-950 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
            <FiZap className="text-white text-sm" />
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900">
            NovaMind<span className="text-purple-600">AI</span>
          </span>
          <span className="text-neutral-300 font-light hidden sm:inline">/</span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-500 hidden sm:inline">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-700">
            <LuCoins size={14} className="text-yellow-500" />
            <span>{user?.interviewCoin ?? 0} Coins</span>
          </div>

          <button
            onClick={() => navigate("/billing")}
            className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer hidden sm:inline"
          >
            + Get Coins
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

/* -------------------------------------------------------------------------- */
/*                             SCORE RING COMPONENT                           */
/* -------------------------------------------------------------------------- */
const ScoreRing = ({ score = 0 }) => {
  const validScore = Math.min(Math.max(Number(score) || 0, 0), 100)

  const getColor = (s) => {
    if (s >= 75) return "#7c3aed" // Purple/Indigo
    if (s >= 50) return "#f59e0b" // Amber
    return "#ef4444" // Red/Rose
  }

  const color = getColor(validScore)
  const chartData = [{ name: "score", value: validScore, fill: color }]

  return (
    <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="68%"
          outerRadius="92%"
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
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 leading-none">
          {validScore}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">
          / 100 ATS
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                TAG COMPONENT                               */
/* -------------------------------------------------------------------------- */
const Tag = ({ text, color = "purple", icon: Icon }) => {
  const styles = {
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/70",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
    yellow: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70",
    red: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70",
    blue: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200/80 hover:bg-neutral-200/60",
  }

  return (
    <motion.div
      whileHover={{ y: -1, scale: 1.01 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs transition-all duration-150 ${
        styles[color] || styles.neutral
      }`}
    >
      {Icon && <Icon className="text-xs shrink-0 opacity-80" />}
      <span className="leading-snug">{text}</span>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               SCORER MAIN COMPONENT                        */
/* -------------------------------------------------------------------------- */
function Scorer({ user, setUser }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false)
  const [reuploadFile, setReuploadFile] = useState(null)
  const [reuploadDragging, setReuploadDragging] = useState(false)

  const dispatch = useDispatch()
  const { resume } = useSelector((state) => state.resume)

  // Fetch cached or existing resume on mount if not already present
  useEffect(() => {
    if (!resume) {
      const loadResume = async () => {
        try {
          const res = await getResume()
          if (res?.data) {
            dispatch(setResume(res.data))
          }
        } catch (err) {
          // No prior resume found, user can upload
        }
      }
      loadResume()
    }
  }, [resume, dispatch])

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")) {
        setFile(droppedFile)
        setErrorMessage("")
      } else {
        setErrorMessage("Please select a valid PDF file.")
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")) {
        setFile(selectedFile)
        setErrorMessage("")
      } else {
        setErrorMessage("Please select a valid PDF file.")
      }
    }
  }

  // Upload handler for initial or re-upload
  const uploadResume = async (fileToUpload = file) => {
    if (!fileToUpload) {
      setErrorMessage("Please select a PDF file first.")
      return
    }
    try {
      setLoading(true)
      const coinResponse = await useCoins({ coins: 10, action: "resume-scorer" })

      if (!coinResponse?.success) {
        setErrorMessage(coinResponse?.message || "Not enough interview coins to analyze resume (10 coins required)")
        setLoading(false)
        return
      }

      if (setUser) {
        setUser((prev) => ({
          ...prev,
          interviewCoin: coinResponse.interviewCoin,
        }))
      }
      setErrorMessage("")
      const formData = new FormData()
      formData.append("resume", fileToUpload)

      const response = await api.post("/api/resume/upload", formData)

      if (response?.data?.data) {
        dispatch(setResume(response.data.data))
        setIsReuploadModalOpen(false)
        setReuploadFile(null)
        setFile(null)
      } else {
        setErrorMessage(response?.data?.message || "Failed to analyze resume.")
      }
      setLoading(false)
    } catch (error) {
      console.error("Resume analysis error:", error)
      setErrorMessage(
        error?.response?.data?.message || "Upload failed. Please check your backend connection."
      )
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  /* ------------------------------------------------------------------------ */
  /*                      SCORER SECTION (ANALYSIS RESULTS)                   */
  /* ------------------------------------------------------------------------ */
  if (resume) {
    const rawScore = Number(resume?.score) || 0
    const scoreStatus =
      rawScore >= 75
        ? {
            status: "Strong Match",
            textColor: "text-emerald-700",
            bgColor: "bg-emerald-50 border-emerald-200",
            dotColor: "bg-emerald-500",
            summary: "Your resume demonstrates high ATS keyword alignment and structured achievements.",
          }
        : rawScore >= 50
        ? {
            status: "Average Match",
            textColor: "text-amber-700",
            bgColor: "bg-amber-50 border-amber-200",
            dotColor: "bg-amber-500",
            summary: "Good baseline, but adding target keywords and quantifiable metrics will significantly improve ranking.",
          }
        : {
            status: "Needs Work",
            textColor: "text-rose-700",
            bgColor: "bg-rose-50 border-rose-200",
            dotColor: "bg-rose-500",
            summary: "Low ATS keyword match. We recommend restructuring role descriptions and adding missing technical skills.",
          }

    const recommendationsList = Array.isArray(resume?.recommendations)
      ? resume.recommendations
      : Array.isArray(resume?.recommendation)
      ? resume.recommendation
      : []

    return (
      <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <Navbar label="Resume Analysis Report" user={user} />

        <main className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Action Bar */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                <FiAward className="text-sm" />
                <span>ATS Performance Scorecard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                {resume?.name || "Candidate Resume"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-neutral-500">
                {resume?.email && (
                  <span className="flex items-center gap-1.5">
                    <FiMail className="text-neutral-400 shrink-0" />
                    {resume.email}
                  </span>
                )}
                {resume?.phone && (
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="text-neutral-400 shrink-0" />
                    {resume.phone}
                  </span>
                )}
                {resume?.suggestedRole && (
                  <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <FiBriefcase className="text-purple-600 shrink-0" />
                    Target: {resume.suggestedRole}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors cursor-pointer"
              >
                <FiPrinter size={14} />
                <span>Print</span>
              </button>

              <button
                onClick={() => setIsReuploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <FiUploadCloud size={14} />
                <span>Upload New Resume</span>
              </button>
            </div>
          </motion.div>

          {/* Hero Score Banner */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-neutral-200/50"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center md:items-stretch gap-6 sm:gap-8">
              {/* Left Score Gauge */}
              <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                <ScoreRing score={rawScore} />
              </div>

              {/* Middle Breakdown */}
              <div className="flex-1 flex flex-col justify-center text-center md:text-left space-y-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${scoreStatus.bgColor} ${scoreStatus.textColor}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${scoreStatus.dotColor}`} />
                    {scoreStatus.status}
                  </span>

                  {resume?.suggestedRole && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                      <FiBriefcase className="text-neutral-500" />
                      {resume.suggestedRole}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                  Overall ATS Compatibility
                </h2>
                <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
                  {scoreStatus.summary}
                </p>

                {/* Stat pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-neutral-400">Strengths</p>
                    <p className="text-base font-bold text-emerald-600">
                      {resume?.strengths?.length || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-neutral-400">Weaknesses</p>
                    <p className="text-base font-bold text-amber-600">
                      {resume?.weaknesses?.length || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-neutral-400">Skill Gaps</p>
                    <p className="text-base font-bold text-rose-600">
                      {resume?.missingSkills?.length || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center">
                    <p className="text-[10px] font-semibold uppercase text-neutral-400">Actions</p>
                    <p className="text-base font-bold text-purple-600">
                      {recommendationsList.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Summary Card (if available) */}
          {resume?.summary && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                <FiFileText className="text-neutral-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed italic border-l-2 border-purple-500 pl-4 py-0.5">
                "{resume.summary}"
              </p>
            </motion.div>
          )}

          {/* Detailed Analysis 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Key Strengths</h3>
                    <p className="text-xs text-neutral-500">Positive ATS evaluation signals</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {resume?.strengths?.length || 0}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2.5">
                {resume?.strengths && resume.strengths.length > 0 ? (
                  resume.strengths.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/80 text-xs sm:text-sm text-neutral-800"
                    >
                      <FiCheck className="text-emerald-600 mt-0.5 shrink-0" size={14} />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">
                    No explicit strengths identified.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Weaknesses Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-col rounded-3xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <FiAlertCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Areas to Improve</h3>
                    <p className="text-xs text-neutral-500">Flags that may lower your ranking</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {resume?.weaknesses?.length || 0}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2.5">
                {resume?.weaknesses && resume.weaknesses.length > 0 ? (
                  resume.weaknesses.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/40 border border-amber-100/80 text-xs sm:text-sm text-neutral-800"
                    >
                      <FiAlertCircle className="text-amber-600 mt-0.5 shrink-0" size={14} />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">
                    No critical weaknesses detected.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Missing Skills Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col rounded-3xl border border-rose-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-rose-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <FiXCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Missing ATS Keywords</h3>
                    <p className="text-xs text-neutral-500">Skills expected for your targeted role</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {resume?.missingSkills?.length || 0}
                </span>
              </div>

              <div className="flex-1">
                {resume?.missingSkills && resume.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resume.missingSkills.map((skill, idx) => (
                      <Tag key={idx} text={skill} color="red" icon={FiTarget} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">
                    All core keywords are present!
                  </p>
                )}
              </div>
            </motion.div>

            {/* Recommendations Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="flex flex-col rounded-3xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <FiTrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Actionable Suggestions</h3>
                    <p className="text-xs text-neutral-500">Steps to boost interview callbacks</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  {recommendationsList.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2.5">
                {recommendationsList.length > 0 ? (
                  recommendationsList.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/40 border border-purple-100/80 text-xs sm:text-sm text-neutral-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">
                    No recommendations needed.
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recognized Technical Skills (if available) */}
          {resume?.skills && resume.skills.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <FiCode className="text-purple-600" />
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Detected Technical Skills & Stack ({resume.skills.length})
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, idx) => (
                  <Tag key={idx} text={skill} color="blue" icon={FiCpu} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom Re-upload Banner / Callout */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="relative overflow-hidden rounded-3xl border border-purple-200/80 bg-linear-to-r from-purple-900 via-indigo-900 to-neutral-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10"
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-purple-200 border border-white/15">
                  <FiRefreshCw className="animate-spin-slow text-xs" />
                  <span>Resume Iteration</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Updated your resume with these fixes?
                </h3>
                <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
                  Re-upload your updated PDF to re-score your resume against ATS benchmarks and
                  track your score improvements.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsReuploadModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102 cursor-pointer"
                >
                  <FiUploadCloud size={16} className="text-purple-600" />
                  <span>Re-upload Updated Resume</span>
                </button>
              </div>
            </div>
          </motion.div>
        </main>

        {/* ------------------------------------------------------------------ */}
        {/*                         RE-UPLOAD MODAL DIALOG                     */}
        {/* ------------------------------------------------------------------ */}
        <AnimatePresence>
          {isReuploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!loading) {
                    setIsReuploadModalOpen(false)
                    setReuploadFile(null)
                  }
                }}
                className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <FiUploadCloud size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">Re-upload Resume</h3>
                      <p className="text-xs text-neutral-500">Test an updated or alternative PDF</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!loading) {
                        setIsReuploadModalOpen(false)
                        setReuploadFile(null)
                      }
                    }}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <FiAlertCircle className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Dropzone inside modal */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setReuploadDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setReuploadDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setReuploadDragging(false)
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const dropped = e.dataTransfer.files[0]
                      if (dropped.type === "application/pdf" || dropped.name.endsWith(".pdf")) {
                        setReuploadFile(dropped)
                        setErrorMessage("")
                      } else {
                        setErrorMessage("Please select a valid PDF file.")
                      }
                    }
                  }}
                >
                  {reuploadFile ? (
                    <div className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-purple-600 bg-purple-50/30">
                      <div className="p-3 rounded-xl bg-white shadow-xs border border-purple-100 mb-2">
                        <FiFileText className="text-2xl text-purple-700" />
                      </div>
                      <p className="text-xs font-bold text-neutral-900 truncate max-w-xs">
                        {reuploadFile.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {formatFileSize(reuploadFile.size)}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <label className="text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 cursor-pointer transition-colors">
                          Change PDF
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setReuploadFile(e.target.files[0])
                                setErrorMessage("")
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={() => setReuploadFile(null)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        reuploadDragging
                          ? "border-purple-600 bg-purple-50"
                          : "border-neutral-300 bg-neutral-50/60 hover:border-purple-400 hover:bg-neutral-50"
                      }`}
                    >
                      <FiUploadCloud
                        className={`text-2xl mb-2 ${
                          reuploadDragging ? "text-purple-600" : "text-neutral-400"
                        }`}
                      />
                      <p className="text-xs font-semibold text-neutral-800">
                        {reuploadDragging ? "Drop your PDF here" : "Click to browse or drag & drop"}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">PDF format • Max 20MB</p>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReuploadFile(e.target.files[0])
                            setErrorMessage("")
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setIsReuploadModalOpen(false)
                      setReuploadFile(null)
                    }}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => uploadResume(reuploadFile)}
                    disabled={!reuploadFile || loading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
                      !reuploadFile || loading
                        ? "bg-neutral-300 cursor-not-allowed text-neutral-500"
                        : "bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-purple-600/20"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Re-analyzing ATS Score...</span>
                      </>
                    ) : (
                      <>
                        <span>Re-analyze Resume</span>
                        <FiArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /*                          UPLOAD SECTION (INITIAL VIEW)                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 pt-24 pb-16 px-4 flex flex-col items-center justify-center">
      <Navbar label="Resume Scorer" user={user} />

      <section className="w-full max-w-xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-xl shadow-neutral-200/40"
        >
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              <span>Step 1 of 2</span>
              <span>Upload PDF</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full w-1/2 transition-all duration-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 mb-3">
              <FiZap className="text-xs" />
              <span>AI ATS Evaluation Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
              Analyze Your Resume
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              Upload your resume in PDF format to receive instant ATS scoring, keyword gap
              analysis, and tailored improvement recommendations.
            </p>
          </div>

          {/* Error alert if any */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
            >
              <FiAlertCircle className="shrink-0 text-sm" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative"
          >
            {file ? (
              <div className="relative flex flex-col items-center justify-center w-full p-6 rounded-2xl border-2 border-neutral-900 bg-neutral-50/90 transition-all">
                <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-neutral-200 mb-3">
                  <FiFileText className="text-3xl text-neutral-900" />
                </div>
                <p className="text-sm font-bold text-neutral-900 text-center truncate max-w-xs sm:max-w-sm">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{formatFileSize(file.size)}</p>

                <div className="flex items-center gap-2 mt-4">
                  <label className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 cursor-pointer transition-colors">
                    Change PDF
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`relative flex flex-col items-center justify-center w-full h-48 sm:h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-purple-600 bg-purple-50/50 scale-[1.01]"
                    : "border-neutral-300 bg-neutral-50/60 hover:border-neutral-400 hover:bg-neutral-50"
                }`}
              >
                <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-neutral-100 mb-3 group-hover:scale-105 transition-transform">
                  <FiUploadCloud
                    className={`text-3xl transition-colors ${
                      isDragging ? "text-purple-600" : "text-neutral-400"
                    }`}
                  />
                </div>

                <p className="text-sm font-semibold text-neutral-800 text-center px-4">
                  {isDragging ? "Drop your PDF here" : "Click to browse or drag & drop"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">PDF only • Maximum size 20MB</p>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={!file || loading ? {} : { scale: 1.01 }}
            whileTap={!file || loading ? {} : { scale: 0.98 }}
            onClick={() => uploadResume(file)}
            disabled={!file || loading}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${
              !file || loading
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-neutral-950 text-white hover:bg-neutral-800 shadow-neutral-900/15 cursor-pointer"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Evaluating ATS Score with AI...</span>
              </span>
            ) : (
              <>
                <span>Analyze Resume Now</span>
                <FiArrowRight className="text-base" />
              </>
            )}
          </motion.button>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-8 pt-6 border-t border-neutral-100">
            <div className="text-center">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-1.5 text-xs font-bold">
                <FiCheckCircle size={14} />
              </div>
              <p className="text-[11px] font-bold text-neutral-800">ATS Parsing</p>
              <p className="text-[10px] text-neutral-400">Readability check</p>
            </div>
            <div className="text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1.5 text-xs font-bold">
                <FiTarget size={14} />
              </div>
              <p className="text-[11px] font-bold text-neutral-800">Skill Gaps</p>
              <p className="text-[10px] text-neutral-400">Missing keywords</p>
            </div>
            <div className="text-center">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-1.5 text-xs font-bold">
                <FiTrendingUp size={14} />
              </div>
              <p className="text-[11px] font-bold text-neutral-800">Action Plan</p>
              <p className="text-[10px] text-neutral-400">Role guidance</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default Scorer