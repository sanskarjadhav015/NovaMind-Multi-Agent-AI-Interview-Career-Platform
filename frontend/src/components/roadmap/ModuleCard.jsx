import React from 'react'
import { motion } from 'motion/react'
import {
  FiClock,
  FiBookOpen,
  FiExternalLink,
  FiCheck,
  FiVideo
} from 'react-icons/fi'
import { FaYoutube } from 'react-icons/fa'

function ModuleCard({
  module,
  index,
  isCompleted = false,
  onToggleComplete,
  isLast = false
}) {
  const getDifficultyBadge = (diff) => {
    const d = (diff || 'Medium').toLowerCase()
    if (d === 'easy') {
      return {
        label: 'Easy',
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500'
      }
    }
    if (d === 'hard') {
      return {
        label: 'Hard',
        style: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500'
      }
    }
    return {
      label: 'Medium',
      style: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500'
    }
  }

  const diffInfo = getDifficultyBadge(module?.difficulty)
  const stepNumber = String(index + 1).padStart(2, '0')

  return (
    <div className="relative flex items-start gap-4 sm:gap-6 group">
      {/* Timeline Node & Connecting Line */}
      <div className="flex flex-col items-center shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggleComplete && onToggleComplete(index)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-sm cursor-pointer z-10 ${
            isCompleted
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-white text-neutral-900 border-2 border-neutral-300 hover:border-purple-600 hover:text-purple-600'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted ? <FiCheck size={16} strokeWidth={3} /> : stepNumber}
        </motion.button>

        {!isLast && (
          <div
            className={`w-0.5 h-full min-h-[70px] my-1 transition-colors ${
              isCompleted ? 'bg-emerald-500/60' : 'bg-neutral-200'
            }`}
          />
        )}
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className={`flex-1 rounded-3xl p-5 sm:p-6 mb-6 border transition-all ${
          isCompleted
            ? 'bg-emerald-50/20 border-emerald-200/60 shadow-xs'
            : 'bg-white border-neutral-200/90 shadow-sm hover:shadow-md hover:border-purple-200'
        }`}
      >
        {/* Header Badges & Title */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${diffInfo.style}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${diffInfo.dot}`} />
              {diffInfo.label}
            </span>

            {module?.duration && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                <FiClock size={12} className="text-neutral-500" />
                {module.duration}
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleComplete && onToggleComplete(index)}
            className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer ${
              isCompleted
                ? 'text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70'
                : 'text-neutral-500 bg-neutral-100 hover:text-neutral-900 hover:bg-neutral-200/70'
            }`}
          >
            {isCompleted ? 'Completed ✓' : 'Mark Done'}
          </button>
        </div>

        {/* Title */}
        <h3
          className={`text-base sm:text-lg font-bold tracking-tight mb-2 ${
            isCompleted ? 'text-neutral-800 line-through decoration-neutral-300' : 'text-neutral-950'
          }`}
        >
          {module?.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-4">
          {module?.description}
        </p>

        {/* Resource Links (YouTube & Article) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-neutral-100">
          {module?.youtube ? (
            <a
              href={module.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 text-xs font-semibold transition-colors cursor-pointer group/yt shadow-xs"
            >
              <FaYoutube className="text-rose-600 text-sm group-hover/yt:scale-110 transition-transform" />
              <span>Watch Video Tutorial</span>
              <FiExternalLink size={12} className="opacity-70" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 text-neutral-400 text-xs font-medium border border-neutral-200/60">
              <FiVideo size={13} />
              <span>Tutorial not linked</span>
            </span>
          )}

          {module?.article ? (
            <a
              href={module.article}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200/80 text-xs font-semibold transition-colors cursor-pointer group/doc shadow-xs"
            >
              <FiBookOpen className="text-purple-600 text-sm group-hover/doc:scale-110 transition-transform" />
              <span>Official Documentation</span>
              <FiExternalLink size={12} className="opacity-70" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 text-neutral-400 text-xs font-medium border border-neutral-200/60">
              <FiBookOpen size={13} />
              <span>Docs not linked</span>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ModuleCard
