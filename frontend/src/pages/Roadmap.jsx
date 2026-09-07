import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiZap,
  FiArrowLeft,
  FiBriefcase,
  FiTrendingUp,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiLayers,
  FiList,
  FiX,
  FiChevronRight,
  FiAward
} from 'react-icons/fi'
import { LuCoins, LuSparkles } from 'react-icons/lu'
import { generateRoadmap, getAllRoadmaps, getRoadmapById } from '../api/roadmap.api'
import { useCoins } from '../api/user.api'
import RoadmapResult from '../components/roadmap/RoadmapResult'

const POPULAR_ROLES = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'AI / ML Engineer',
  'DevOps Engineer',
  'Software Engineer',
  'Data Scientist',
  'Cloud Solutions Architect'
]

const PACKAGE_OPTIONS = ['10 LPA', '15 LPA', '20 LPA', '30 LPA', '40 LPA', '50+ LPA']

function Roadmap({ user, setUser }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { resume } = useSelector((state) => state.resume)

  const [roadmap, setRoadmap] = useState(null)
  const [role, setRole] = useState(resume?.suggestedRole || '')
  const [targetPackage, setTargetPackage] = useState(PACKAGE_OPTIONS[2]) // Default "20 LPA"
  const [useResume, setUseResume] = useState(Boolean(resume))
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState('')

  // History Drawer State
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        const res = await getAllRoadmaps()
        if (res?.data && Array.isArray(res.data)) {
          setHistory(res.data)
        }
      } catch (err) {
        console.error('Error fetching roadmap history:', err)
      } finally {
        setHistoryLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // Auto-sync resume suggestion
  useEffect(() => {
    if (!role && resume?.suggestedRole) {
      setRole(resume.suggestedRole)
    }
    if (resume) {
      setUseResume(true)
    }
  }, [resume])

  // Animated loading messages
  useEffect(() => {
    let interval
    if (loading) {
      setLoadingStage(0)
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev < 2 ? prev + 1 : prev))
      }, 2500)
    }
    return () => clearInterval(interval)
  }, [loading])

  const LOADING_MESSAGES = [
    'Analyzing target role requirements & package expectations...',
    'Synthesizing personalized curriculum with learning milestones...',
    'Curating official documentation & video tutorial resources...'
  ]

  const handleGenerate = async () => {
    if (!role.trim()) {
      setError('Please enter or select your target job role.')
      return
    }

    const currentCoins = Number(user?.interviewCoin ?? 0)
    if (currentCoins < 20) {
      setError(`Not enough Interview Coins (20 required, you have ${currentCoins}).`)
      return
    }

    try {
      setLoading(true)
      setError('')

      // 1. Deduct 20 coins
      const coinRes = await useCoins({ coins: 20, action: 'roadmap-generation' })
      if (!coinRes?.success) {
        setError(coinRes?.message || 'Coin transaction failed.')
        setLoading(false)
        return
      }

      if (setUser) {
        setUser((prev) => ({
          ...prev,
          interviewCoin: coinRes.interviewCoin
        }))
      }

      // 2. Call backend roadmap generation graph
      const res = await generateRoadmap({
        role: role.trim(),
        targetPackage,
        useResume: Boolean(useResume && resume),
        resume: useResume && resume ? resume : {}
      })

      if (res?.success && res?.data) {
        setRoadmap(res.data)
        setHistory((prev) => [res.data, ...prev])
      } else {
        setError(res?.message || 'Failed to generate career roadmap. Please try again.')
      }
    } catch (err) {
      console.error('Roadmap generate error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHistoryItem = (item) => {
    setRoadmap(item)
    setHistoryOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed inset-x-0 top-0 z-30 border-b border-black/[0.08] bg-white/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div
            onClick={() => navigate('/dashboard')}
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
              Roadmap Builder
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Coins Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-700">
              <LuCoins size={14} className="text-yellow-500" />
              <span>{user?.interviewCoin ?? 0} Coins</span>
            </div>

            {/* History Button */}
            <button
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <FiList size={14} />
              <span>History</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-bold">
                  {history.length}
                </span>
              )}
            </button>

            {/* Dashboard Link */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-20 pb-16">
        {roadmap ? (
          <RoadmapResult
            roadmap={roadmap}
            onReset={() => setRoadmap(null)}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-4 sm:pt-6">
            {/* Left Column: Info & Value Prop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5 space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold uppercase tracking-wider mb-3">
                  <LuSparkles className="text-xs" />
                  <span>AI Learning Architecture</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                  Design Your Dream Career Blueprint
                </h1>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Generate a structured, milestone-driven learning roadmap customized to your target role, salary package goals, and existing skill background.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3.5 pt-1">
                {[
                  {
                    icon: <FiTrendingUp className="text-purple-600" />,
                    title: 'Target Package Optimization',
                    desc: 'Prioritizes technologies and system design topics valued in high-compensation brackets.'
                  },
                  {
                    icon: <FiLayers className="text-indigo-600" />,
                    title: 'Sequential Milestones',
                    desc: 'Logically ordered from foundational architecture to production-grade implementation.'
                  },
                  {
                    icon: <FiFileText className="text-emerald-600" />,
                    title: 'Resume Gap Analysis',
                    desc: 'Bypasses topics you already know to focus directly on missing competencies.'
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs"
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

              {/* Coin Cost Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LuCoins size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-950">Usage Cost: 20 Coins</p>
                    <p className="text-[11px] text-amber-700">Generates full curriculum with curated docs & videos</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-lg">
                  20 pts
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
                <h2 className="text-xl font-bold text-neutral-950">Configure Your Career Roadmap</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Specify your desired title, salary tier, and experience context.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5"
                >
                  <FiAlertCircle className="shrink-0 text-sm" />
                  <span>{error}</span>
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
                  placeholder="e.g. Senior Full Stack Engineer, AI/ML Engineer..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-neutral-400"
                />

                {/* Popular Role Quick Select */}
                <div className="pt-1">
                  <p className="text-[11px] font-medium text-neutral-400 mb-1.5">Popular roles:</p>
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

              {/* 2. Target Package */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <FiTrendingUp className="text-neutral-500" />
                  <span>Target Compensation Package</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PACKAGE_OPTIONS.map((pkg) => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => setTargetPackage(pkg)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        targetPackage === pkg
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Resume Integration Toggle */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                      <FiFileText className="text-neutral-500" />
                      <span>Personalize with Resume</span>
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Tailors roadmap around your projects & fills missing skills directly.
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

                {useResume && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4"
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
                              {resume.skills?.length || 0} skills detected &bull; Target: {resume.suggestedRole || 'Developer'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                          <FiCheck size={12} />
                          <span>Connected</span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500">
                        <span>No resume found on file. You can upload one in the </span>
                        <span
                          onClick={() => navigate('/scorer')}
                          className="text-purple-600 font-semibold cursor-pointer underline"
                        >
                          Resume Scorer
                        </span>
                        <span> or generate without resume context.</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Generate CTA Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-sm shadow-lg shadow-neutral-950/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2.5 py-1">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{LOADING_MESSAGES[loadingStage]}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FiZap size={16} className="text-purple-400" />
                      <span>Generate Career Roadmap (20 Coins)</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* History Slide-over Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-neutral-200 z-10 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <FiList size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Roadmap History</h3>
                    <p className="text-[11px] text-neutral-500">Your previously generated learning tracks</p>
                  </div>
                </div>

                <button
                  onClick={() => setHistoryOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-neutral-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  history.map((item) => (
                    <motion.div
                      key={item._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSelectHistoryItem(item)}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1 pr-2">
                        <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                          <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                            {item.targetPackage}
                          </span>
                          <span>&bull;</span>
                          <span>{item.duration || '6 Months'}</span>
                          <span>&bull;</span>
                          <span>{item.modules?.length || 0} Modules</span>
                        </div>
                      </div>
                      <FiChevronRight className="text-neutral-400 shrink-0" size={16} />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-400 text-xs">
                    <FiList size={28} className="mx-auto mb-2 opacity-50" />
                    <p>No roadmaps generated yet.</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Roadmap
