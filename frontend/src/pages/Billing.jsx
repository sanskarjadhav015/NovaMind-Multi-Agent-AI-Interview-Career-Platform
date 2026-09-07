import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  FiSidebar,
  FiCheck,
  FiZap,
  FiShield,
  FiClock,
  FiHelpCircle,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiCreditCard,
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiDownload,
  FiLayers,
  FiArrowRight
} from 'react-icons/fi'
import { LuCoins, LuSparkles } from 'react-icons/lu'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'
import SideBar from '../components/SideBar'
import { createBillingOrder, getBillingHistory, getPlans, verifyPayment } from '../api/billing.api'
import { getCurrentUser } from '../api/user.api'
import api from '../utils/axios'

// Helper to dynamically load external scripts like Razorpay
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const FAQS = [
  {
    q: 'How do Interview Coins work?',
    a: 'Interview Coins are the platform currency used to access AI-powered mock interviews, resume ATS scans, and customized roadmaps. An AI mock interview session costs 50 coins, an in-depth Resume ATS score costs 10 coins, and a career roadmap costs 20 coins.'
  },
  {
    q: 'Do purchased coins expire?',
    a: 'No! All purchased coins remain in your NovaMind account with lifetime validity so you can practice at your own pace without pressure.'
  },
  {
    q: 'Which payment methods are supported?',
    a: 'We support all major payment modes via Razorpay including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay, Amex), Net Banking, and Wallets.'
  },
  {
    q: 'What happens if a transaction fails?',
    a: 'If money was deducted during a failed transaction, Razorpay automatically initiates an instant reversal to your source bank account within 3-5 working days. You can also reach out to our support at any time.'
  }
]

const DEFAULT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    amount: 199,
    interviewCoins: 300,
    interviewsCount: 6,
    scansCount: 30,
    description: 'Great for getting started and preparing for your initial rounds.',
    features: [
      '300 Interview Coins',
      '6 Full Mock AI Interviews (50 coins each)',
      '30 Resume ATS Scans (10 coins each)',
      'Detailed AI Performance Reports',
      'Instant Feedback & Speech Analysis',
      'Lifetime Validity'
    ],
    badge: 'Essential',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    amount: 499,
    interviewCoins: 900,
    interviewsCount: 18,
    scansCount: 90,
    description: 'Best value for active job seekers targeting top tech companies.',
    features: [
      '900 Interview Coins (+150 Bonus Coins included)',
      '18 Full Mock AI Interviews',
      '90 Resume ATS Scans & Analyses',
      'Advanced Code Evaluation & Deep Feedback',
      'Custom Role & Tech-Stack Targeting',
      'Priority AI Model Processing Speed',
      'Lifetime Validity'
    ],
    badge: 'Most Popular',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Mastery Pack',
    amount: 999,
    interviewCoins: 2500,
    interviewsCount: 50,
    scansCount: 250,
    description: 'Comprehensive preparation package for mastering both Technical and HR rounds.',
    features: [
      '2500 Interview Coins (Huge 40% Savings)',
      '50 Full Mock AI Interviews',
      'Unlimited Resume ATS Optimizations',
      'Complete Skill Radar & Performance Analytics',
      'Custom Technical & Behavioral Tracks',
      'Lifetime Validity & Uncapped Storage',
      '24/7 Priority Support'
    ],
    badge: 'Maximum Value',
    popular: false
  }
]

function Billing({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [plans, setPlans] = useState(DEFAULT_PLANS)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState('pro')
  const [processingPlanId, setProcessingPlanId] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)
  const [paymentSuccessData, setPaymentSuccessData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const navigate = useNavigate()
  const pricingRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Fetch plans
        const plansRes = await getPlans()
        if (isMounted && plansRes?.success && plansRes?.plans?.length > 0) {
          setPlans(plansRes.plans)
        }

        // 2. Fetch transaction history
        const historyRes = await getBillingHistory()
        if (isMounted && historyRes?.success) {
          setHistory(historyRes.history || [])
        }
      } catch (err) {
        console.error('Error loading billing data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    // Preload Razorpay checkout SDK
    loadRazorpayScript()

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
      console.error(error)
    }
  }

  const refreshUserData = async () => {
    try {
      const meRes = await getCurrentUser()
      if (meRes?.user) {
        setUser(meRes.user)
      }
      const historyRes = await getBillingHistory()
      if (historyRes?.success) {
        setHistory(historyRes.history || [])
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    }
  }

  const handlePurchase = async (plan) => {
    try {
      setErrorMessage('')
      setStatusMessage('')
      setProcessingPlanId(plan.id)

      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        setErrorMessage('Failed to load Razorpay payment gateway. Please check your internet connection.')
        setProcessingPlanId(null)
        return
      }

      // Step 1: Create Order in Backend
      const orderRes = await createBillingOrder(plan.id)
      if (!orderRes?.success || !orderRes?.order) {
        setErrorMessage(orderRes?.message || 'Failed to initiate order. Please try again.')
        setProcessingPlanId(null)
        return
      }

      const { order, key_id } = orderRes
      const razorpayKey = key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TXw80c7m09yle5'

      // Step 2: Configure Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'NovaMind AI',
        description: `${plan.name} (${plan.interviewCoins} Interview Coins)`,
        image: '/logo.png',
        order_id: order.id,
        handler: async (response) => {
          try {
            setStatusMessage('Verifying payment and adding coins...')
            // Step 3: Verify Payment Signature in Backend
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            })

            if (verifyRes?.success) {
              // Step 4: Add coins to session / user
              try {
                await api.post('/api/auth/add-coins', {
                  coins: plan.interviewCoins
                })
              } catch (coinErr) {
                console.warn('Direct add-coins fallback error:', coinErr)
              }

              // Step 5: Refresh user and history state
              await refreshUserData()

              setPaymentSuccessData({
                planName: plan.name,
                coins: plan.interviewCoins,
                amount: plan.amount,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              })
              setStatusMessage('')
            } else {
              setErrorMessage(verifyRes?.message || 'Payment verification failed.')
            }
          } catch (verErr) {
            console.error('Verification error:', verErr)
            setErrorMessage('Payment verification encountered an issue. If coins were not credited, contact support.')
          } finally {
            setProcessingPlanId(null)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        notes: {
          planId: plan.id,
          coins: plan.interviewCoins
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null)
            setStatusMessage('')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp.error)
        setErrorMessage(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`)
        setProcessingPlanId(null)
      })
      rzp.open()
    } catch (err) {
      console.error('Purchase initiation error:', err)
      setErrorMessage(err.message || 'Something went wrong while initiating checkout.')
      setProcessingPlanId(null)
    }
  }

  const currentCoins = Number(user?.interviewCoin ?? 0)
  const interviewsAvailable = Math.floor(currentCoins / 50)
  const resumeScansAvailable = Math.floor(currentCoins / 10)

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
        {/* Mobile Header Menu Trigger */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-black/40 hover:text-[#0A0A0A] transition-colors cursor-pointer"
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
                  Account & Billing
                </span>
                <span className="w-1 h-1 rounded-full bg-black/30" />
                <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Razorpay Secured
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
                Interview Coins & Plans
              </h1>
            </motion.div>
          </div>

          <button
            onClick={refreshUserData}
            title="Refresh balance"
            className="flex items-center gap-1.5 text-xs font-semibold text-black/50 hover:text-black bg-white px-3 py-2 rounded-xl border border-black/10 shadow-sm transition-all hover:shadow cursor-pointer"
          >
            <FiRefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Global Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <FiAlertCircle size={18} className="shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-xs font-bold text-red-600 hover:text-red-900 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3 shadow-sm"
            >
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section: Current Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09090b] via-[#18181b] to-[#09090b] text-white p-6 sm:p-8 mb-10 shadow-2xl border border-white/10"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase text-yellow-400 border border-white/10 flex items-center gap-1.5">
                  <LuCoins size={14} className="text-yellow-400" />
                  Your Wallet
                </div>
                <span className="text-xs text-white/50">Real-time sync</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                  {currentCoins}
                </span>
                <span className="text-lg sm:text-xl font-bold text-white/60">
                  Interview Coins
                </span>
              </div>

              <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-xl leading-relaxed">
                Use your coins seamlessly across AI Mock Interviews, Resume ATS Scoring, and Personalized Skill Roadmaps.
              </p>
            </div>

            {/* Quick Metrics & CTA */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                  <FiZap size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-white/40">Mock Interviews</p>
                  <p className="text-sm font-bold text-white">{interviewsAvailable} remaining</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <FiLayers size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-white/40">Resume ATS Scans</p>
                  <p className="text-sm font-bold text-white">{resumeScansAvailable} scans</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-black font-bold text-xs tracking-wide shadow-lg hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Recharge Coins</span>
                <FiArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* How Coins Work Infographic */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                Transparent Pricing
              </p>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0A0A0A]">
                How Coins Are Utilized
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-sm flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold border border-purple-100">
                <FiZap size={20} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#0A0A0A]">AI Mock Interview</h3>
                  <span className="text-xs font-extrabold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                    50 Coins
                  </span>
                </div>
                <p className="text-xs text-black/60 leading-relaxed">
                  Real-time interactive speech & coding interview with adaptive follow-ups, radar performance, and full feedback reports.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-sm flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold border border-blue-100">
                <FiLayers size={20} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#0A0A0A]">ATS Resume Scorer</h3>
                  <span className="text-xs font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                    10 Coins
                  </span>
                </div>
                <p className="text-xs text-black/60 leading-relaxed">
                  Instant ATS compatibility score, deep formatting critique, impact evaluation, and bullet-point rewrites.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-sm flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold border border-emerald-100">
                <FiAward size={20} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#0A0A0A]">Career Roadmap</h3>
                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                    20 Coins
                  </span>
                </div>
                <p className="text-xs text-black/60 leading-relaxed">
                  Personalized week-by-week curriculum, recommended curated resources, and role-specific mastery checklists.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div ref={pricingRef} className="mb-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2 border border-purple-200">
              <LuSparkles size={13} />
              <span>Instant Coin Top-Ups</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] tracking-tight">
              Choose the Best Plan for Your Prep
            </h2>
            <p className="text-xs sm:text-sm text-black/55 mt-2">
              All plans include lifetime coin validity, instant credit, and full access to all AI models.
            </p>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan, index) => {
              const isPopular = plan.popular || plan.id === 'pro'
              const isProcessing = processingPlanId === plan.id

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer ${
                    isPopular
                      ? 'bg-[#000000] text-white shadow-2xl ring-2 ring-purple-500/50 shadow-purple-500/10'
                      : 'bg-white text-[#0A0A0A] border border-black/10 shadow-lg hover:shadow-xl hover:border-black/20'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1">
                      <LuSparkles size={12} />
                      {plan.badge || 'Most Popular'}
                    </div>
                  )}

                  {!isPopular && plan.badge && (
                    <div className="absolute top-6 right-6 px-2.5 py-0.5 rounded-full bg-black/5 text-black/70 text-[10px] font-bold uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold ${isPopular ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs mt-1 leading-relaxed ${isPopular ? 'text-white/60' : 'text-black/50'}`}>
                        {plan.description}
                      </p>
                    </div>

                    {/* Price and Coins */}
                    <div className="my-6 pb-6 border-b border-black/8 dark:border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight">
                          ₹{plan.amount}
                        </span>
                        <span className={`text-xs font-semibold ${isPopular ? 'text-white/50' : 'text-black/40'}`}>
                          / one-time
                        </span>
                      </div>

                      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs ${
                        isPopular ? 'bg-white/10 text-yellow-400 border border-white/10' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}>
                        <LuCoins size={15} />
                        <span>{plan.interviewCoins} Interview Coins</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features?.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2.5 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPopular ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            <FiCheck size={11} strokeWidth={3} />
                          </div>
                          <span className={isPopular ? 'text-white/80' : 'text-black/70'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePurchase(plan)
                      }}
                      className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        isPopular
                          ? 'bg-white text-black hover:bg-neutral-100'
                          : 'bg-[#000000] text-white hover:bg-[#1a1a1a]'
                      } ${isProcessing ? 'opacity-80 cursor-wait' : ''}`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Processing Checkout...</span>
                        </>
                      ) : (
                        <>
                          <FiCreditCard size={14} />
                          <span>Buy Now (₹{plan.amount})</span>
                        </>
                      )}
                    </motion.button>

                    <p className={`text-[10px] text-center mt-2.5 flex items-center justify-center gap-1 ${
                      isPopular ? 'text-white/40' : 'text-black/40'
                    }`}>
                      <IoShieldCheckmarkOutline size={12} />
                      <span>Razorpay Verified • Instant Delivery</span>
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Security & Guarantees bar */}
          <div className="mt-8 p-4 rounded-2xl bg-white border border-black/8 flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-black/60 shadow-sm">
            <div className="flex items-center gap-2">
              <FiShield className="text-emerald-600" size={16} />
              <span>256-bit SSL Razorpay Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <FiZap className="text-yellow-600" size={16} />
              <span>Instant Wallet Credit</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-purple-600" size={16} />
              <span>Lifetime Coin Validity</span>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                Records
              </p>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0A0A0A]">
                Transaction & Recharge History
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-black/8 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-black/40 text-xs animate-pulse">
                Loading transaction history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/5 text-black/30 flex items-center justify-center mx-auto mb-3">
                  <LuCoins size={22} />
                </div>
                <h4 className="font-bold text-sm text-[#0A0A0A] mb-1">No transactions yet</h4>
                <p className="text-xs text-black/50 max-w-sm mx-auto">
                  When you recharge coins or buy packages, your order details, receipts, and payment status will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/8 bg-black/[0.02] text-[11px] font-bold uppercase tracking-wider text-black/45">
                      <th className="py-3.5 px-5">Date & Time</th>
                      <th className="py-3.5 px-5">Order ID</th>
                      <th className="py-3.5 px-5">Payment ID</th>
                      <th className="py-3.5 px-5">Coins</th>
                      <th className="py-3.5 px-5">Amount</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-xs">
                    {history.map((tx) => {
                      const dateStr = tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'

                      const isPaid = tx.status === 'paid'
                      const isFailed = tx.status === 'failed'

                      return (
                        <tr key={tx._id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3.5 px-5 font-medium text-black/80 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-black/60 whitespace-nowrap">
                            {tx.razorpayOrderId || '—'}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-black/60 whitespace-nowrap">
                            {tx.razorpayPaymentId || '—'}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-yellow-600">
                            +{tx.interviewCoins} Coins
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#0A0A0A]">
                            ₹{tx.amount}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFailed
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {isPaid ? (
                                <FiCheckCircle size={10} />
                              ) : isFailed ? (
                                <FiXCircle size={10} />
                              ) : (
                                <FiClock size={10} />
                              )}
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="max-w-3xl mb-12">
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
              Assistance
            </p>
            <h2 className="text-lg md:text-xl font-extrabold text-[#0A0A0A]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx
              return (
                <div
                  key={fIdx}
                  className="bg-white rounded-2xl border border-black/8 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                    className="w-full py-4 px-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#0A0A0A] hover:bg-black/[0.01] cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FiHelpCircle className="text-purple-600 shrink-0" size={16} />
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <FiChevronUp size={16} className="text-black/40" />
                    ) : (
                      <FiChevronDown size={16} className="text-black/40" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-1 text-xs text-black/65 border-t border-black/5 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Success Modal */}
        <AnimatePresence>
          {paymentSuccessData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border border-black/10 relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                  <FiCheckCircle size={32} />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 text-xs font-extrabold mb-3 border border-yellow-200">
                  <LuCoins size={14} className="text-yellow-600" />
                  +{paymentSuccessData.coins} Coins Credited!
                </div>

                <h3 className="text-xl font-extrabold text-[#0A0A0A] mb-1">
                  Payment Successful!
                </h3>
                <p className="text-xs text-black/60 mb-6 leading-relaxed">
                  Thank you for subscribing to the{' '}
                  <strong className="text-black">{paymentSuccessData.planName}</strong>. Your wallet has been immediately updated.
                </p>

                <div className="bg-black/[0.03] rounded-2xl p-4 text-left space-y-2 mb-6 text-xs border border-black/5">
                  <div className="flex justify-between">
                    <span className="text-black/50">Amount Paid</span>
                    <span className="font-bold text-[#0A0A0A]">₹{paymentSuccessData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">Payment ID</span>
                    <span className="font-mono text-[10px] text-black/70">
                      {paymentSuccessData.paymentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">New Wallet Balance</span>
                    <span className="font-extrabold text-purple-700">
                      {user?.interviewCoin} Coins
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      setPaymentSuccessData(null)
                      navigate('/interview')
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-bold text-xs hover:bg-[#1a1a1a] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Start Mock Interview</span>
                    <FiArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setPaymentSuccessData(null)}
                    className="py-3 px-4 rounded-xl bg-black/5 text-black/70 font-semibold text-xs hover:bg-black/10 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  )
}

export default Billing

