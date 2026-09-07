import React from 'react'
import { AnimatePresence, motion } from "motion/react"
import { TbBrandSupernova } from "react-icons/tb";
import {
  FiSidebar,
  FiPlus,
  FiFileText,
  FiMap,
  FiStar,
  FiCreditCard,
  FiGrid
} from "react-icons/fi";
import { useLocation, useNavigate } from 'react-router-dom';
import { LuCoins, LuSparkles } from "react-icons/lu";
import { AiFillPlusCircle } from "react-icons/ai";
import { IoLogOut } from "react-icons/io5";

const NAV_ITEMS = [
  {
    icon: <FiGrid size={16} />,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <FiFileText size={16} />,
    label: "Resume Builder",
    path: "/resume",
  },
  {
    icon: <FiStar size={16} />,
    label: "Resume Scorer",
    path: "/scorer",
  },
  {
    icon: <FiMap size={16} />,
    label: "Roadmap Builder",
    path: "/roadmap",
  },
  {
    icon: <FiCreditCard size={16} />,
    label: "Billing & Plans",
    path: "/billing",
  }
];

function SideBar({
  user,
  onNewInterview,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  mobileOpen,
  setMobileOpen
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const avatar = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const currentPath = location.pathname;

  const inner = (
    <div className='flex flex-col h-full bg-white select-none'>
      {/* Top Brand & Toggle */}
      <div className={`px-4 h-16 border-b border-black/[0.06] shrink-0 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
        {sidebarOpen && (
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#000000] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
              <TbBrandSupernova size={19} color='white' />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className='flex flex-col'
            >
              <span className='font-black text-sm tracking-tight text-[#0A0A0A] leading-tight'>
                NovaMind<span className='text-purple-600'>AI</span>
              </span>
              <span className='text-[9px] uppercase tracking-wider text-black/40 font-bold'>Studio</span>
            </motion.div>
          </div>
        )}

        <div className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden md:flex text-black/35 hover:text-[#0A0A0A] transition-colors shrink-0 cursor-pointer p-1.5 rounded-lg hover:bg-black/5"
          >
            <FiSidebar size={17} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-black/35 hover:text-[#0A0A0A] transition-colors shrink-0 cursor-pointer p-1.5 rounded-lg hover:bg-black/5"
          >
            <FiSidebar size={17} />
          </motion.button>
        </div>
      </div>

      {/* Primary Action Button: Create Interview */}
      <div className='px-3 pt-4 pb-2 shrink-0'>
        <motion.button
          onClick={onNewInterview}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.98 }}
          title={!sidebarOpen ? "Create Interview" : undefined}
          className={`w-full flex items-center gap-2 bg-[#000000] text-white font-bold rounded-xl py-2.5 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:bg-[#1a1a1a] cursor-pointer ${
            sidebarOpen ? "px-3.5" : "justify-center px-0"
          }`}
        >
          <FiPlus size={15} className='shrink-0' />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.13 }}
                className='text-xs whitespace-nowrap'
              >
                Create Interview
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Navigation Section Header */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.13 }}
            className='px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-black/35'
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* Nav Items with Active Highlight */}
      <nav className="flex flex-col gap-1 px-2.5 flex-1 py-1">
        {NAV_ITEMS.map((nav, i) => {
          const isActive = currentPath === nav.path || (nav.path === '/interview' && currentPath.startsWith('/interview'));

          return (
            <motion.button
              key={i}
              onClick={() => {
                navigate(nav.path);
                setMobileOpen(false);
              }}
              whileHover={{ x: sidebarOpen ? 3 : 0 }}
              transition={{ duration: 0.13 }}
              title={!sidebarOpen ? nav.label : undefined}
              className={`relative flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-all ${
                sidebarOpen ? "px-3" : "justify-center px-0"
              } ${
                isActive
                  ? "text-black bg-black/[0.05] shadow-xs font-bold"
                  : "text-black/50 hover:text-black hover:bg-black/[0.02]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 w-1 h-5 rounded-r-full bg-black"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <span className={`shrink-0 ${isActive ? "text-black" : "text-black/50"}`}>
                {nav.icon}
              </span>

              {sidebarOpen && (
                <span className="whitespace-nowrap">
                  {nav.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section: Wallet Coins & Profile */}
      <div className='border-t border-black/[0.06] p-3 shrink-0 bg-white'>
        {/* Coin Balance Banner */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate("/billing")}
              className='group flex cursor-pointer items-center justify-between gap-2.5 rounded-2xl border border-black/10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-3 py-2.5 mb-3 transition-all hover:border-black/20 shadow-[0_4px_18px_rgba(0,0,0,0.18)]'
            >
              <div className='flex items-center gap-2'>
                <div className='w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/20'>
                  <LuCoins size={14} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[9px] uppercase tracking-wider text-white/50 font-bold leading-none'>
                    Interview Coins
                  </span>
                  <span className='text-xs font-black text-white mt-0.5'>
                    {user?.interviewCoin ?? 0}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform'>
                <AiFillPlusCircle size={17} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Avatar & Logout */}
        <div className={`flex items-center gap-2.5 ${sidebarOpen ? "" : "justify-center"}`}>
          <div className='w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-purple-100'>
            <span className='text-white font-extrabold text-[11px]'>
              {avatar}
            </span>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.13 }}
                className='flex items-center justify-between flex-1 min-w-0'
              >
                <div className='min-w-0'>
                  <p className='text-[#0A0A0A] text-xs font-bold truncate leading-tight'>
                    {user?.name ?? "User"}
                  </p>
                  <p className='text-black/45 text-[10px] truncate leading-tight mt-0.5'>
                    {user?.email ?? "user@novamind.ai"}
                  </p>
                </div>

                <motion.button
                  onClick={onLogout}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  title="Log out"
                  className='text-black/35 hover:text-red-600 transition-colors ml-auto cursor-pointer p-1.5 rounded-lg hover:bg-red-50'
                >
                  <IoLogOut size={16} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className='hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-black/[0.06] flex-col z-40 overflow-hidden shadow-[2px_0_12px_rgba(0,0,0,0.02)]'
      >
        {inner}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className='fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm'
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className='fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-white border-r border-black/[0.06] flex-col z-50 md:hidden overflow-hidden shadow-2xl'
          >
            {inner}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default SideBar;

