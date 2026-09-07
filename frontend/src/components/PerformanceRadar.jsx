import React from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts'
import { motion } from 'motion/react'
import { FiCpu, FiUsers, FiAward } from 'react-icons/fi'

const DEFAULT_RADAR_DATA = [
  { skill: 'Correctness', score: 0 },
  { skill: 'Clarity', score: 0 },
  { skill: 'Relevance', score: 0 },
  { skill: 'Detail', score: 0 },
  { skill: 'Efficiency', score: 0 },
  { skill: 'Communication', score: 0 },
  { skill: 'Problem solving', score: 0 },
  { skill: 'Creativity', score: 0 }
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#0e0e12] border border-white/20 px-3.5 py-2 rounded-xl shadow-2xl text-xs backdrop-blur-md">
        <p className="text-white/60 font-semibold">{data.skill}</p>
        <p className="text-white font-extrabold text-sm flex items-baseline gap-1 mt-0.5">
          <span>{payload[0].value}</span>
          <span className="text-white/40 text-[10px]">/ 100</span>
        </p>
      </div>
    )
  }
  return null
}

function PerformanceRadar({ title, data, count = 0, delay = 0 }) {
  const isHR = title.toLowerCase().includes('hr')
  const themeColor = isHR ? '#10b981' : '#a855f7'
  const icon = isHR ? <FiUsers size={16} className="text-emerald-400" /> : <FiCpu size={16} className="text-purple-400" />

  // Ensure all 8 metrics exist in order
  const chartData = DEFAULT_RADAR_DATA.map((defaultItem) => {
    const found = data?.find(
      (d) => d.skill.toLowerCase().replace(/\s+/g, '') === defaultItem.skill.toLowerCase().replace(/\s+/g, '')
    )
    return {
      skill: defaultItem.skill,
      score: found ? Number(found.score) || 0 : 0
    }
  })

  const hasData = count > 0 || chartData.some((item) => item.score > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-gradient-to-br from-[#0c0c0f] via-[#141418] to-[#0c0c0f] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.25)] flex flex-col justify-between group"
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: themeColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              {count} {count === 1 ? 'Interview' : 'Interviews'} Completed
            </p>
          </div>
        </div>

        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{
            color: themeColor,
            borderColor: `${themeColor}33`,
            backgroundColor: `${themeColor}15`
          }}
        >
          {isHR ? 'Behavioral' : 'Technical'}
        </span>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-64 sm:h-72 flex items-center justify-center my-2 relative z-10">
        {!hasData ? (
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/30 flex items-center justify-center mx-auto mb-2 border border-white/5">
              <FiAward size={22} />
            </div>
            <p className="text-xs font-semibold text-white/50">No interview data yet</p>
            <p className="text-[10px] text-white/30 mt-0.5">Complete a session to unlock your skill radar</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
              <PolarGrid
                gridType="polygon"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="0"
              />
              <PolarAngleAxis
                dataKey="skill"
                tick={{
                  fill: 'rgba(255, 255, 255, 0.65)',
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                axisLine={false}
                tick={false}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke={themeColor}
                strokeWidth={2}
                fill={themeColor}
                fillOpacity={0.2}
                dot={{
                  r: 3,
                  fill: themeColor,
                  stroke: '#141418',
                  strokeWidth: 1.5
                }}
                activeDot={{
                  r: 5,
                  fill: '#ffffff',
                  stroke: themeColor,
                  strokeWidth: 2
                }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Breakdown Chips */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-white/50 relative z-10 flex-wrap gap-2">
        <span className="font-medium">8-Metric AI Analysis</span>
        <span className="text-white/40 text-[10px]">Adaptive Evaluation</span>
      </div>
    </motion.div>
  )
}

export default PerformanceRadar

