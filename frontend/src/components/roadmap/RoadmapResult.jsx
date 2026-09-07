import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  FiBriefcase,
  FiClock,
  FiLayers,
  FiPrinter,
  FiRefreshCw,
  FiAward,
  FiZap,
  FiTrendingUp,
  FiCheckCircle,
  FiList
} from 'react-icons/fi'
import ModuleCard from './ModuleCard'

function RoadmapResult({ roadmap, onReset, onOpenHistory }) {
  const [completedModules, setCompletedModules] = useState(() => {
    try {
      const saved = localStorage.getItem(`roadmap_completed_${roadmap?._id}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (roadmap?._id) {
      try {
        const saved = localStorage.getItem(`roadmap_completed_${roadmap._id}`)
        setCompletedModules(saved ? JSON.parse(saved) : [])
      } catch {
        setCompletedModules([])
      }
    }
  }, [roadmap?._id])

  const toggleModuleCompletion = (index) => {
    setCompletedModules((prev) => {
      const updated = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
      if (roadmap?._id) {
        try {
          localStorage.setItem(`roadmap_completed_${roadmap._id}`, JSON.stringify(updated))
        } catch (e) {
          console.error(e)
        }
      }
      return updated
    })
  }

  const modules = roadmap?.modules || []
  const totalModules = modules.length
  const completedCount = completedModules.length
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  const getLevelBadge = (level) => {
    const l = (level || 'Intermediate').toLowerCase()
    if (l === 'beginner') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
    if (l === 'advanced') return 'bg-purple-50 text-purple-700 border-purple-200/80'
    return 'bg-blue-50 text-blue-700 border-blue-200/80'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Action Bar */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <FiZap className="text-sm" />
            <span>AI Guided Career Roadmap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
            {roadmap?.title || 'Learning Roadmap'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Step-by-step milestones curated for high-tier compensation and technical mastery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors cursor-pointer"
            >
              <FiList size={14} />
              <span>History</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors cursor-pointer"
          >
            <FiPrinter size={14} />
            <span>Print</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <FiRefreshCw size={13} />
            <span>New Roadmap</span>
          </button>
        </div>
      </motion.div>

      {/* Hero Overview Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-neutral-200/50"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                <FiTrendingUp size={13} />
                Target: {roadmap?.targetPackage || 'Target Package'}
              </span>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getLevelBadge(roadmap?.level)}`}>
                <FiLayers size={13} />
                {roadmap?.level || 'Intermediate'} Level
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                <FiClock size={13} />
                {roadmap?.duration || 'Duration'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 bg-neutral-50 border border-neutral-200/80 px-3 py-1.5 rounded-xl">
              <FiCheckCircle className="text-emerald-600" />
              <span>
                {completedCount} / {totalModules} Completed ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-linear-to-r from-purple-600 to-emerald-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
              <span>Foundation</span>
              <span>Advanced Mastery & Package Goals</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modules Timeline Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
              Roadmap Milestones ({totalModules})
            </h2>
            <p className="text-xs text-neutral-500">
              Follow each step sequentially. Click on tutorial and documentation links to study.
            </p>
          </div>
        </div>

        <div className="relative">
          {modules.map((module, idx) => (
            <ModuleCard
              key={idx}
              index={idx}
              module={module}
              isCompleted={completedModules.includes(idx)}
              onToggleComplete={toggleModuleCompletion}
              isLast={idx === modules.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoadmapResult
