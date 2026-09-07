import React, { useState } from 'react'
import { motion } from 'motion/react'
import { MdCancel } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { FiZap, FiShield, FiCheckCircle, FiStar } from "react-icons/fi";
import { TbBrandSupernova } from "react-icons/tb";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import api from '../utils/axios';

function LoginModel({ onClose, setUser }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleAuth = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await signInWithPopup(auth, provider);
            const token = await result.user.getIdToken();
            const response = await api.post("/api/auth/login", { token });

            if (response.data?.user) {
                setUser(response.data.user);
                onClose();
            } else {
                setError("Failed to authenticate session.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in with Google. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4'>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className='relative w-full max-w-md bg-[#0d0d10] border border-white/15 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white'
            >
                {/* Ambient Radial Gradient Glow */}
                <div className='absolute top-0 right-1/4 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none' />
                <div className='absolute bottom-0 left-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none' />

                <div className='relative p-7 sm:p-8'>
                    {/* Close Button */}
                    <button
                        type='button'
                        onClick={onClose}
                        className='absolute top-5 right-5 text-white/40 hover:text-white p-1 rounded-full transition-colors cursor-pointer'
                    >
                        <MdCancel size={22} />
                    </button>

                    {/* Logo & Header */}
                    <div className='flex flex-col items-center text-center mb-6'>
                        <div className='w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'>
                            <TbBrandSupernova size={26} className='text-white' />
                        </div>
                        <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight'>
                            Welcome to <span className='text-purple-400'>NovaMind</span>AI
                        </h2>
                        <p className='text-xs text-white/50 mt-1 max-w-xs'>
                            Master your tech interviews with real-time AI agents and instant radar feedback.
                        </p>
                    </div>

                    {/* Feature Highlights Pill */}
                    <div className='bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 mb-6 space-y-2 text-xs'>
                        <div className='flex items-center gap-2.5 text-white/80'>
                            <FiZap size={14} className='text-yellow-400 shrink-0' />
                            <span><strong>150 Free Interview Coins</strong> upon sign up</span>
                        </div>
                        <div className='flex items-center gap-2.5 text-white/80'>
                            <FiCheckCircle size={14} className='text-purple-400 shrink-0' />
                            <span>Real-time speech & live coding evaluation</span>
                        </div>
                        <div className='flex items-center gap-2.5 text-white/80'>
                            <FiStar size={14} className='text-emerald-400 shrink-0' />
                            <span>In-depth ATS Resume Scorer & Custom Roadmaps</span>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className='mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs'>
                            {error}
                        </div>
                    )}

                    {/* Google Auth Button */}
                    <motion.button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-[#0A0A0A] font-bold text-xs sm:text-sm hover:bg-neutral-100 shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all cursor-pointer disabled:opacity-75'
                    >
                        {loading ? (
                            <div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
                        ) : (
                            <>
                                <FcGoogle size={19} />
                                <span>Continue with Google</span>
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Footer Security Note */}
                <div className='relative border-t border-white/10 bg-black/40 px-6 py-3.5 text-center flex items-center justify-center gap-1.5 text-[11px] text-white/40'>
                    <FiShield size={13} className='text-emerald-400' />
                    <span>Secure authentication powered by Google Firebase</span>
                </div>
            </motion.div>
        </div>
    )
}

export default LoginModel