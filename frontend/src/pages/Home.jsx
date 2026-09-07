import React, { useState } from 'react'
import { motion } from "motion/react"
import { TbBrandSupernova } from "react-icons/tb";
import {
  FiFileText,
  FiMap,
  FiStar,
  FiZap,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiCpu,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiLayers
} from "react-icons/fi";
import { LuCoins, LuSparkles } from "react-icons/lu";
import LoginModel from '../components/LoginModel';
import dashboard from "../assets/image.png";

function Home({ setUser }) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className='bg-[#fafafa] text-[#0A0A0A] font-sans min-h-screen overflow-x-hidden'>
      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className='fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 sm:px-10 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]'
      >
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-xl bg-[#0A0A0A] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)]'>
            <TbBrandSupernova size={18} className='text-white' />
          </div>
          <span className='font-black text-lg tracking-tight text-[#0A0A0A]'>
            NovaMind<span className='text-purple-600'>AI</span>
          </span>
        </div>

        <div className='flex items-center gap-3'>
          <motion.button
            onClick={() => setShowLogin(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='bg-[#0A0A0A] text-white font-bold rounded-xl px-4 py-2 text-xs cursor-pointer transition-all hover:bg-neutral-800 shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center gap-2'
          >
            <span>Get Started Free</span>
            <FiArrowRight size={13} />
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className='relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-white via-[#f4f4f7] to-[#fafafa]'>
        {/* Ambient Gradient Glow Orbs */}
        <div className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none' />
        <div className='absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[90px] pointer-events-none' />
        <div className='absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-yellow-500/10 blur-[90px] pointer-events-none' />

        <div className='max-w-5xl mx-auto px-6 text-center relative z-10'>
          {/* Top Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200/80 bg-purple-50 text-purple-700 text-xs font-bold mb-6 shadow-sm'
          >
            <LuSparkles size={14} className='text-purple-600' />
            <span>Multi-Agent AI Tech Interview Platform</span>
            <span className='px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold uppercase'>
              150 Free Coins
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className='text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-[#0A0A0A] mb-6'
          >
            Job Interviews <br />
            <span className='bg-gradient-to-r from-neutral-400 via-neutral-600 to-neutral-950 bg-clip-text text-transparent'>
              Don't Have To Be Terrifying.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className='text-black/60 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8'
          >
            Practice real-time speech and coding with adaptive AI interviewers. Receive comprehensive ATS resume reviews, skill gap radars, and personalized learning paths to land top tier tech offers.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14'
          >
            <motion.button
              onClick={() => setShowLogin(true)}
              whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
              whileTap={{ scale: 0.98 }}
              className='w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#000000] text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl hover:bg-neutral-900 transition-all flex items-center justify-center gap-2 cursor-pointer'
            >
              <span>Start Free AI Interview</span>
              <FiArrowRight size={16} />
            </motion.button>

            <button
              onClick={() => setShowLogin(true)}
              className='w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-black/10 text-[#0A0A0A] font-bold text-xs sm:text-sm hover:bg-black/[0.02] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2'
            >
              <FiFileText size={15} />
              <span>Score My Resume (ATS)</span>
            </button>
          </motion.div>

          {/* Dashboard Preview Frame */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className='relative rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/10 max-w-4xl mx-auto bg-neutral-950 p-2 sm:p-3'
          >
            <div className='flex items-center gap-2 px-3 py-2 bg-neutral-900 rounded-t-2xl border-b border-white/10 text-white/40 text-[11px] font-mono'>
              <div className='flex gap-1.5'>
                <div className='w-2.5 h-2.5 rounded-full bg-red-500/80' />
                <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/80' />
                <div className='w-2.5 h-2.5 rounded-full bg-green-500/80' />
              </div>
              <span className='ml-2 text-white/50'>novamind.ai/studio</span>
            </div>
            <img src={dashboard} alt='NovaMind Studio Dashboard' className='w-full h-auto rounded-b-xl object-cover block shadow-2xl' />
          </motion.div>
        </div>
      </section>

      {/* Stats Ticker */}
      <section className='py-10 border-y border-black/[0.06] bg-white'>
        <div className='max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center'>
          <div>
            <p className='text-3xl sm:text-4xl font-black text-[#0A0A0A]'>10,000+</p>
            <p className='text-xs font-medium text-black/50 mt-1 uppercase tracking-wider'>Mock Interviews Done</p>
          </div>
          <div>
            <p className='text-3xl sm:text-4xl font-black text-purple-600'>94.8%</p>
            <p className='text-xs font-medium text-black/50 mt-1 uppercase tracking-wider'>ATS Score Accuracy</p>
          </div>
          <div>
            <p className='text-3xl sm:text-4xl font-black text-emerald-600'>3.2x</p>
            <p className='text-xs font-medium text-black/50 mt-1 uppercase tracking-wider'>More Callback Rate</p>
          </div>
          <div>
            <p className='text-3xl sm:text-4xl font-black text-yellow-500'>150</p>
            <p className='text-xs font-medium text-black/50 mt-1 uppercase tracking-wider'>Free Coins On Signup</p>
          </div>
        </div>
      </section>

      {/* Agents Bento Grid Section */}
      <section className='py-20 bg-[#fafafa]'>
        <div className='max-w-6xl mx-auto px-6'>
          <div className='text-center mb-14 max-w-2xl mx-auto'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-black/70 text-xs font-bold mb-3'>
              <FiCpu size={13} />
              <span>Multi-Agent Neural Engine</span>
            </div>
            <h2 className='text-3xl sm:text-4xl font-black tracking-tight text-[#0A0A0A]'>
              Specialized AI Agents for Every Stage
            </h2>
            <p className='text-xs sm:text-sm text-black/55 mt-3 leading-relaxed'>
              NovaMind orchestrates specialized AI agents that seamlessly guide you from ATS resume optimization to adaptive mock interviews and structured skill roadmaps.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
            {[
              {
                icon: <FiFileText size={22} className='text-purple-400' />,
                title: "ATS Resume Agent",
                badge: "10 Coins",
                desc: "Analyzes formatting, impact metrics, and missing keywords with direct AI rewrite recommendations.",
                accent: "from-purple-900/20 to-transparent"
              },
              {
                icon: <FiZap size={22} className='text-yellow-400' />,
                title: "Live Interview Agent",
                badge: "50 Coins",
                desc: "Real-time speech synthesis and video avatar simulations for Technical, HR, and Behavioral rounds.",
                accent: "from-yellow-900/20 to-transparent"
              },
              {
                icon: <FiTrendingUp size={22} className='text-emerald-400' />,
                title: "Skill Radar Agent",
                badge: "Included",
                desc: "8-axis performance radar scoring correctness, clarity, detail, communication, and problem-solving.",
                accent: "from-emerald-900/20 to-transparent"
              },
              {
                icon: <FiMap size={22} className='text-blue-400' />,
                title: "Roadmap Agent",
                badge: "20 Coins",
                desc: "Generates custom multi-week milestone curricula complete with curated YouTube lessons.",
                accent: "from-blue-900/20 to-transparent"
              },
            ].map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className='group relative overflow-hidden bg-[#0a0a0d] border border-white/10 rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between'
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${agent.accent} pointer-events-none opacity-50`} />

                <div className='relative z-10'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner'>
                      {agent.icon}
                    </div>
                    <span className='text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10'>
                      {agent.badge}
                    </span>
                  </div>

                  <h3 className='text-white font-bold text-base mb-2'>
                    {agent.title}
                  </h3>
                  <p className='text-white/60 text-xs leading-relaxed'>
                    {agent.desc}
                  </p>
                </div>

                <div className='relative z-10 pt-6 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white/50 group-hover:text-white transition-colors'>
                  <span>Explore module</span>
                  <FiArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className='py-16 bg-white border-t border-black/[0.06]'>
        <div className='max-w-4xl mx-auto px-6'>
          <div className='bg-[#0A0A0A] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl'>
            <div className='absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none' />
            <div className='relative z-10 max-w-xl mx-auto'>
              <h2 className='text-2xl sm:text-4xl font-black tracking-tight mb-3 text-white'>
                Ready to Ace Your Next Tech Interview?
              </h2>
              <p className='text-xs sm:text-sm text-white/60 mb-8 leading-relaxed'>
                Sign up today with Google to receive 150 free interview coins and start preparing with your personal AI interview coach.
              </p>
              <motion.button
                onClick={() => setShowLogin(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className='px-8 py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-lg hover:bg-neutral-100 transition-all cursor-pointer inline-flex items-center gap-2'
              >
                <span>Get Started Now (150 Free Coins)</span>
                <FiArrowRight size={15} />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 bg-white border-t border-black/[0.06] text-center text-xs text-black/50'>
        <div className='max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <TbBrandSupernova size={16} className='text-black' />
            <span className='font-bold text-black'>NovaMind AI</span>
          </div>
          <p>© {new Date().getFullYear()} NovaMind AI. Crafted with ❤️ for ambitious engineers.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && <LoginModel onClose={() => setShowLogin(false)} setUser={setUser} />}
    </div>
  )
}

export default Home

