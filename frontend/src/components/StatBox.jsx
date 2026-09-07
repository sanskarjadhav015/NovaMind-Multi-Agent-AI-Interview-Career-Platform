import React from 'react'
import { motion } from 'motion/react'
import { FiTrendingUp, FiCheckCircle, FiHelpCircle, FiAward } from 'react-icons/fi'

const ICONS = {
  interviews: <FiAward size={18} className="text-purple-400" />,
  questions: <FiHelpCircle size={18} className="text-blue-400" />,
  completed: <FiCheckCircle size={18} className="text-emerald-400" />,
  score: <FiTrendingUp size={18} className="text-yellow-400" />
};

function StatBox({ title, value, badge, subtitle, iconType = "interviews", delay = 0 }) {
  const icon = ICONS[iconType] || ICONS.interviews;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-gradient-to-br from-[#0e0e11] via-[#16161a] to-[#0e0e11] rounded-3xl p-5 md:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col justify-between group"
    >
      {/* Subtle Corner Ambient Glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/[0.03] rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-white/45 uppercase">
            {title}
          </p>
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        </div>

        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {value}
        </h3>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5 flex-wrap">
        {badge && (
          <span className="bg-white/10 text-white/80 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 border border-white/10">
            {badge}
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] text-white/40 font-medium truncate">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default StatBox

