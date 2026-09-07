import React, { useEffect, useState } from 'react'
import SideBar from '../components/SideBar'
import StatBox from '../components/StatBox'
import PerformanceRadar from '../components/PerformanceRadar'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import { motion } from 'motion/react'
import { FiSidebar, FiPlus, FiFileText, FiMap, FiStar, FiZap, FiArrowRight } from 'react-icons/fi'
import { LuCoins, LuSparkles } from 'react-icons/lu'
import { getAllInterviews } from '../api/interview.api'

function Dashboard({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInterviews: 0,
    totalQuestions: 0,
    completed: 0,
    averageScore: 0
  })

  const [technicalData, setTechnicalData] = useState([])
  const [hrData, setHrData] = useState([])
  const [technicalCount, setTechnicalCount] = useState(0)
  const [hrCount, setHrCount] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const fetchInterviews = async () => {
      try {
        setLoading(true)
        const response = await getAllInterviews()
        if (isMounted && response) {
          if (response.stats) {
            setStats({
              totalInterviews: response.stats.totalInterviews ?? 0,
              totalQuestions: response.stats.totalQuestions ?? 0,
              completed: response.stats.completed ?? response.stats.completedInterviews ?? 0,
              averageScore: response.stats.averageScore ?? 0
            })
          }
          if (response.technicalData) setTechnicalData(response.technicalData)
          if (response.hrData) setHrData(response.hrData)
          if (response.technicalCount !== undefined) setTechnicalCount(response.technicalCount)
          if (response.hrCount !== undefined) setHrCount(response.hrCount)
        }
      } catch (error) {
        console.error('Error fetching interviews:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchInterviews()
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      const response = await api('/api/auth/logout')
      if (response.data.success) {
        setUser(null)
        navigate('/')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'User'
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="bg-[#fafafa] min-h-screen text-[#0A0A0A] font-sans flex">
      <SideBar
        user={user}
        onNewInterview={() => navigate('/interview')}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <motion.main
        className={`flex-1 min-h-screen px-4 sm:px-6 md:px-10 py-8 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[72px]'
        }`}
      >
        {/* Top Header / Greeting Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-black/40 hover:text-[#0A0A0A] transition-colors cursor-pointer p-1 rounded-lg hover:bg-black/5"
            >
              <FiSidebar size={20} />
            </motion.button>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-black/40">
                  {todayDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-black/20" />
                <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.2 rounded-full border border-purple-100">
                  Active Session
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] tracking-tight">
                {greeting}, {firstName} 👋
              </h1>
            </motion.div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/interview')}
              className="px-4 py-2.5 rounded-xl bg-black text-white font-bold text-xs shadow-md hover:bg-neutral-900 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Start New Interview</span>
            </motion.button>
            <button
              onClick={() => navigate('/billing')}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-[#0A0A0A] font-bold text-xs shadow-xs hover:bg-black/[0.02] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LuCoins size={14} className="text-yellow-500" />
              <span>{user?.interviewCoin ?? 0} Coins</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-neutral-900/10 rounded-3xl p-6 h-36 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-8">
            <StatBox
              title="TOTAL INTERVIEWS"
              value={stats.totalInterviews}
              badge="All Time"
              subtitle="Interviews Created"
              iconType="interviews"
              delay={0.05}
            />
            <StatBox
              title="QUESTIONS SOLVED"
              value={stats.totalQuestions}
              badge="Answered"
              subtitle="Across All Sessions"
              iconType="questions"
              delay={0.1}
            />
            <StatBox
              title="COMPLETED SESSIONS"
              value={stats.completed}
              badge={`${stats.totalInterviews} Total`}
              subtitle="Full AI Reports"
              iconType="completed"
              delay={0.15}
            />
            <StatBox
              title="AVERAGE SCORE"
              value={`${stats.averageScore}/100`}
              badge="Completed Only"
              subtitle="Radar Performance"
              iconType="score"
              delay={0.2}
            />
          </div>
        )}

        {/* Quick Launch Studio Cards */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-black/40">
                Studio Modules
              </p>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0A0A0A]">
                Quick Actions
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/interview')}
              className="group cursor-pointer bg-white rounded-3xl p-5 border border-black/8 hover:border-black/20 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <FiZap size={18} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  50 Coins
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0A0A0A] mb-1 group-hover:text-purple-600 transition-colors">
                  AI Mock Interview
                </h3>
                <p className="text-xs text-black/50 leading-relaxed">
                  Practice speech & live code with adaptive follow-up questions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold text-black/60 group-hover:text-black">
                <span>Start Session</span>
                <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => navigate('/scorer')}
              className="group cursor-pointer bg-white rounded-3xl p-5 border border-black/8 hover:border-black/20 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FiStar size={18} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  10 Coins
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0A0A0A] mb-1 group-hover:text-blue-600 transition-colors">
                  ATS Resume Scorer
                </h3>
                <p className="text-xs text-black/50 leading-relaxed">
                  Upload PDF for instant ATS match, formatting critique, & rewrites.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold text-black/60 group-hover:text-black">
                <span>Scan Resume</span>
                <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => navigate('/roadmap')}
              className="group cursor-pointer bg-white rounded-3xl p-5 border border-black/8 hover:border-black/20 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FiMap size={18} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  20 Coins
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0A0A0A] mb-1 group-hover:text-emerald-600 transition-colors">
                  Career Roadmap
                </h3>
                <p className="text-xs text-black/50 leading-relaxed">
                  Personalized week-by-week curriculum with curated video lessons.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold text-black/60 group-hover:text-black">
                <span>Build Roadmap</span>
                <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Section Header */}
        <div className="mb-4">
          <p className="text-black/40 text-[11px] font-bold tracking-wider uppercase mb-1">
            Skill Analytics
          </p>
          <h2 className="text-lg md:text-xl font-extrabold text-[#0A0A0A]">
            Interview Performance Radars
          </h2>
        </div>

        {/* Performance Charts (Technical & HR) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            <div className="bg-neutral-900/10 rounded-3xl h-80 animate-pulse" />
            <div className="bg-neutral-900/10 rounded-3xl h-80 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            <PerformanceRadar
              title="Technical Interviews"
              data={technicalData}
              count={technicalCount}
              delay={0.25}
            />
            <PerformanceRadar
              title="HR Interviews"
              data={hrData}
              count={hrCount}
              delay={0.3}
            />
          </div>
        )}
      </motion.main>
    </div>
  )
}

export default Dashboard

