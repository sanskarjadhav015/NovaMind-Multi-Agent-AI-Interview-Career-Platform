/**
 * @file Step2interview.jsx (Frontend Component)
 * @description Core interactive interview simulator featuring real-time AI avatars,
 * speech recognition (Web Speech API) transcription, countdown timer, webcam feed,
 * live code editor integration, and real-time per-question feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiCode,
  FiClock,
  FiVolume2,
  FiVolumeX,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiRotateCcw,
  FiZap,
  FiX,
  FiTrendingUp,
  FiAward,
  FiCornerDownLeft
} from 'react-icons/fi';
import maleVideo from '../../assets/male-ai.mp4';
import femaleVideo from '../../assets/female-ai.mp4';
import CodeEditor from './CodeEditor';
import { submitAnswer } from '../../api/interview.api';

function Step2interview({ interviewData, user, setUser }) {
  const navigate = useNavigate();

  // --- Interview Progress State ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(interviewData.currentQuestion ?? 0);
  const [totalQuestions, setTotalQuestions] = useState(interviewData.totalQuestions ?? 6);
  const [questionData, setQuestionData] = useState(interviewData.question ?? {});
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [finalReportData, setFinalReportData] = useState(null);

  // --- Timer State ---
  const [timeLeft, setTimeLeft] = useState(interviewData.question?.timer || 90);
  const [timerRunning, setTimerRunning] = useState(false);

  // --- Hardware & Media Controls ---
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraStream, setCameraStream] = useState(null);
  const [codeOpen, setCodeOpen] = useState(false);

  // --- AI Avatar & Voice State ---
  const [voiceGender, setVoiceGender] = useState('female');
  const [aiMuted, setAiMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [micError, setMicError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // --- Refs ---
  const aiVideoRef = useRef(null);
  const userVideoRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const activeUtteranceRef = useRef(null);
  const speechSafetyTimerRef = useRef(null);
  const recognitionInstanceRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const liveInterimRef = useRef('');

  // Mutable refs to avoid stale closures in recognition callbacks
  const micOnRef = useRef(true);
  const feedbackRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { liveInterimRef.current = liveInterim; }, [liveInterim]);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
      setMicError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge for voice interviews, or type your answer.');
    }
  }, []);

  // 1. Initialize Webcam Stream
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (cameraOn && navigator.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false
          });
          setCameraStream(stream);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Webcam permission error or camera not found:', err);
        setCameraOn(false);
      }
    };

    if (cameraOn) {
      startCamera();
    } else if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraOn]);

  // Keep webcam video element attached to stream
  useEffect(() => {
    if (userVideoRef.current && cameraStream) {
      userVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, feedback]);

  // Explicit mic permission request
  const requestMicPermission = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicError('');
        return true;
      }
    } catch (err) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone access was blocked. Please click the lock or camera icon in your browser address bar to allow mic access.');
      } else {
        setMicError('Could not access microphone hardware. Please check your audio input device.');
      }
      return false;
    }
    return true;
  };

  // Stop speech recognition cleanly
  const stopRecognition = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.onend = null;
        recognitionInstanceRef.current.onerror = null;
        recognitionInstanceRef.current.stop();
      } catch (e) {}
      recognitionInstanceRef.current = null;
    }
    // Commit any remaining unfinalized interim speech
    if (liveInterimRef.current.trim()) {
      setAnswer((prev) => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + liveInterimRef.current.trim();
      });
      setLiveInterim('');
    }
    setIsListening(false);
  };

  // Start speech recognition cleanly with safe lifecycle
  const startRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    if (!micOnRef.current || feedbackRef.current) return;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Clean up previous instance before starting fresh
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.onend = null;
        recognitionInstanceRef.current.onerror = null;
        recognitionInstanceRef.current.abort();
      } catch (e) {}
      recognitionInstanceRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError('');
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        setLiveInterim(interimText);

        if (finalText.trim()) {
          setLiveInterim('');
          setAnswer((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + finalText.trim();
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'no-speech') {
          // Normal pause when candidate is thinking; onend will smoothly restart
          return;
        }
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicError('Microphone blocked. Please grant microphone access in your browser.');
          setIsListening(false);
        } else if (e.error === 'network') {
          setMicError('Speech recognition network timeout. Reconnecting...');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Commit any unfinalized words
        if (liveInterimRef.current.trim()) {
          setAnswer((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + liveInterimRef.current.trim();
          });
          setLiveInterim('');
        }

        // Safe delayed restart so Chrome doesn't throw InvalidStateError
        if (micOnRef.current && !feedbackRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (micOnRef.current && !feedbackRef.current) {
              startRecognition();
            }
          }, 300);
        }
      };

      recognition.start();
      recognitionInstanceRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition start failed, retrying in 400ms:', err);
      if (micOnRef.current && !feedbackRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (micOnRef.current && !feedbackRef.current) {
            startRecognition();
          }
        }, 400);
      }
    }
  };

  // Mic toggle handler
  const handleToggleMic = async () => {
    if (micOn) {
      setMicOn(false);
      stopRecognition();
    } else {
      setMicOn(true);
      const granted = await requestMicPermission();
      if (granted) {
        startRecognition();
      }
    }
  };

  // Initialize Speech Recognition on mount
  useEffect(() => {
    requestMicPermission().then((granted) => {
      if (granted && micOnRef.current && !feedbackRef.current) {
        startRecognition();
      }
    });

    return () => {
      stopRecognition();
    };
  }, []);

  // Manage start/stop based on micOn or feedback changes
  useEffect(() => {
    if (micOn && !feedback) {
      startRecognition();
    } else {
      stopRecognition();
    }
  }, [micOn, feedback]);

  // 3. AI Text-to-Speech (TTS) Narrator
  const speakText = (textToSpeak) => {
    if (!synthRef.current || aiMuted || !textToSpeak) {
      setTimerRunning(true);
      return;
    }

    synthRef.current.cancel();
    if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Slightly slower rate = much clearer articulation with neural voices
      utterance.rate = 0.95;
      // Keep pitch neutral — neural voices already have natural inflection built in
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        // Only consider English voices
        const enVoices = voices.filter((v) => v.lang.startsWith('en'));
        // Neural / cloud voices (not local robot TTS) — the clear ones
        const neuralVoices = enVoices.filter((v) =>
          !v.localService || v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural')
        );

        let match = null;

        if (voiceGender === 'female') {
          match =
            // 1. Microsoft Neural (Windows 10/11 — by far the clearest)
            neuralVoices.find((v) => /Aria/i.test(v.name)) ||
            neuralVoices.find((v) => /Jenny/i.test(v.name)) ||
            neuralVoices.find((v) => /Sonia/i.test(v.name)) ||
            neuralVoices.find((v) => /Zira/i.test(v.name)) ||
            // 2. Google Neural / WaveNet (Chrome on any OS)
            neuralVoices.find((v) => /Google.*English.*Female/i.test(v.name)) ||
            enVoices.find((v) => v.name === 'Google US English') ||
            // 3. macOS natural voices
            enVoices.find((v) => /Samantha|Allison|Ava/i.test(v.name)) ||
            // 4. Any non-local English voice (cloud = better quality)
            neuralVoices[0] ||
            enVoices[0];
        } else {
          match =
            // 1. Microsoft Neural (Windows 10/11)
            neuralVoices.find((v) => /Guy/i.test(v.name)) ||
            neuralVoices.find((v) => /Ryan/i.test(v.name)) ||
            neuralVoices.find((v) => /Davis/i.test(v.name)) ||
            neuralVoices.find((v) => /David/i.test(v.name)) ||
            // 2. Google Neural / WaveNet (Chrome)
            neuralVoices.find((v) => /Google.*English.*Male/i.test(v.name)) ||
            enVoices.find((v) => v.name === 'Google UK English Male') ||
            // 3. macOS natural voices
            enVoices.find((v) => /Alex|Daniel|Tom/i.test(v.name)) ||
            // 4. Any non-local English voice
            neuralVoices[0] ||
            enVoices[0];
        }

        if (match) utterance.voice = match;
      }

      // Keep strong reference so V8 GC doesn't kill utterance mid-speech
      activeUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        window.__speechUtterance = utterance;
      }

      utterance.onstart = () => {
        setIsAISpeaking(true);
        setSubtitle(textToSpeak);
        setTimerRunning(false);
        if (aiVideoRef.current) {
          aiVideoRef.current.currentTime = 0;
          aiVideoRef.current.play().catch(() => {});
        }
      };

      utterance.onend = () => {
        if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);
        setIsAISpeaking(false);
        setTimerRunning(true);
        activeUtteranceRef.current = null;
        if (aiVideoRef.current) {
          aiVideoRef.current.pause();
        }
      };

      utterance.onerror = () => {
        if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);
        setIsAISpeaking(false);
        setTimerRunning(true);
        activeUtteranceRef.current = null;
      };

      // Safety timeout: calculate based on text length to prevent isAISpeaking from ever hanging
      const maxDuration = Math.max(6000, Math.min(25000, textToSpeak.split(' ').length * 600));
      speechSafetyTimerRef.current = setTimeout(() => {
        setIsAISpeaking(false);
        setTimerRunning(true);
        activeUtteranceRef.current = null;
        if (aiVideoRef.current) aiVideoRef.current.pause();
      }, maxDuration);

      synthRef.current.speak(utterance);
    };

    // Voices may not be loaded on first call — retry after a short delay if needed
    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = () => {
        synthRef.current.onvoiceschanged = null;
        doSpeak();
      };
      // Fallback timeout in case onvoiceschanged never fires
      setTimeout(doSpeak, 200);
    } else {
      doSpeak();
    }
  };

  // Speak new question whenever question changes
  useEffect(() => {
    if (questionData?.question) {
      const timerVal = questionData.timer || 90;
      setTimeLeft(timerVal);
      setAnswer('');
      setFeedback(null);
      speakText(questionData.question);
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);
    };
  }, [questionData, voiceGender]);

  // 4. Timer Countdown
  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0 && !feedback && !submitting) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft, feedback, submitting]);

  // Handle auto-submit on timeout
  const handleAutoSubmit = () => {
    if (!submitting && !feedback) {
      handleSubmitAnswer();
    }
  };

  // 5. Submit Answer Handler
  const handleSubmitAnswer = async () => {
    if (submitting) return;

    if (synthRef.current) synthRef.current.cancel();
    if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);
    setIsAISpeaking(false);
    setTimerRunning(false);

    // Commit any live unfinalized words immediately into the answer
    let fullText = answer.trim();
    if (liveInterim.trim()) {
      const sep = fullText ? ' ' : '';
      fullText += sep + liveInterim.trim();
      setAnswer(fullText);
      setLiveInterim('');
    }

    const submissionText = fullText || "No answer provided within the allotted time.";

    try {
      setSubmitting(true);

      const res = await submitAnswer({
        interviewId: interviewData.interviewId,
        answer: submissionText
      });

      if (res?.success) {
        if (res.completed || res.coompleted) {
          setInterviewCompleted(true);
          setFinalReportData(res.interview);
        } else {
          setFeedback(res.feedback || {});
          if (res.question) {
            setQuestionData(res.question);
          }
          if (typeof res.currentQuestion === 'number') {
            setCurrentQuestionIndex(res.currentQuestion);
          }
        }
      } else {
        alert(res?.message || 'Failed to evaluate answer. Please try again.');
        setTimerRunning(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred while submitting your answer.');
      setTimerRunning(true);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Proceed to Next Question after reviewing feedback
  const handleNextQuestion = () => {
    setFeedback(null);
    setAnswer('');
    speakText(questionData?.question);
  };

  const handleFinishAndOpenReport = () => {
    navigate(`/interview/${interviewData.interviewId}/report`);
  };

  // Helper formatting for timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const difficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'hard': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1015] text-neutral-100 flex flex-col font-sans select-none">
      {/* Code Editor Modal */}
      <AnimatePresence>
        {codeOpen && (
          <CodeEditor
            onClose={() => setCodeOpen(false)}
            onInsertCode={(insertedCode) => setAnswer((prev) => prev + insertedCode)}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="h-14 bg-[#141820]/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to exit? Your progress is saved.")) {
                navigate('/dashboard');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            <FiX size={14} />
            <span className="hidden sm:inline">Exit Session</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
              {interviewData.role || 'Software Engineer'}
            </span>
            <span className="text-xs text-neutral-500 hidden md:inline">
              ({interviewData.type === 'hr' ? 'HR & Behavioral' : 'Technical Track'})
            </span>
          </div>
        </div>

        {/* Center: Question Progress */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
            <span>Question</span>
            <span className="text-purple-400">{currentQuestionIndex + 1}</span>
            <span className="text-neutral-500">/</span>
            <span>{totalQuestions}</span>
          </div>

          <div className="w-20 sm:w-28 bg-neutral-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-linear-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Timer & Voice Switch */}
        <div className="flex items-center gap-3">
          {/* Avatar Voice Selector */}
          <div className="flex items-center bg-neutral-800/80 p-0.5 rounded-xl border border-neutral-700/60 text-xs">
            <button
              onClick={() => setVoiceGender('female')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                voiceGender === 'female' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Female AI
            </button>
            <button
              onClick={() => setVoiceGender('male')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                voiceGender === 'male' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Male AI
            </button>
          </div>

          {/* Question Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              timeLeft <= 15
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-neutral-800/90 text-neutral-200 border-neutral-700'
            }`}
          >
            <FiClock size={14} className={timeLeft <= 15 ? 'text-rose-400' : 'text-purple-400'} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Left Interviewer & Right Candidate Answer */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: AI Avatar Video & Current Question Card (5 cols)     */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto">
          
          {/* AI Avatar Video Player */}
          <div className="relative aspect-video sm:aspect-4/3 w-full bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center group">
            <video
              ref={aiVideoRef}
              src={voiceGender === 'female' ? femaleVideo : maleVideo}
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* AI Audio State Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${
                  isAISpeaking
                    ? 'bg-purple-600/80 text-white border-purple-400/40 animate-pulse'
                    : 'bg-black/60 text-neutral-300 border-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAISpeaking ? 'bg-white' : 'bg-emerald-400'}`} />
                <span>{isAISpeaking ? 'AI Interviewer Speaking...' : 'AI Interviewer Listening'}</span>
              </span>
            </div>

            {/* Floating User Webcam Picture-in-Picture */}
            <div className="absolute bottom-3 right-3 w-28 sm:w-36 aspect-video bg-black/80 rounded-2xl overflow-hidden border border-white/20 shadow-xl z-10">
              {cameraOn ? (
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-[10px]">
                  <FiVideoOff size={14} className="mb-1" />
                  <span>Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white/80 bg-black/60 px-1 rounded">
                You
              </span>
            </div>

            {/* Audio narration buttons */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
              <button
                onClick={() => speakText(questionData?.question)}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer text-xs flex items-center gap-1"
                title="Replay question audio"
              >
                <FiRotateCcw size={13} />
                <span className="text-[10px] font-semibold">Replay</span>
              </button>

              <button
                onClick={() => {
                  setAiMuted(!aiMuted);
                  if (!aiMuted && synthRef.current) synthRef.current.cancel();
                }}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                title={aiMuted ? "Unmute AI" : "Mute AI"}
              >
                {aiMuted ? <FiVolumeX size={13} className="text-rose-400" /> : <FiVolume2 size={13} />}
              </button>
            </div>
          </div>

          {/* Current Question Display Card */}
          <div className="flex-1 bg-[#141820] rounded-3xl border border-neutral-800/90 p-5 sm:p-6 flex flex-col justify-between shadow-xl space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                  Question {currentQuestionIndex + 1}
                </span>

                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${difficultyColor(
                    questionData?.difficulty
                  )}`}
                >
                  {questionData?.difficulty || 'Easy'}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-neutral-100 leading-snug">
                {questionData?.question || 'Loading question...'}
              </h2>
            </div>

            {/* Live Subtitle caption banner */}
            {isAISpeaking && (
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 italic leading-relaxed flex items-start gap-2">
                <FiVolume2 className="shrink-0 text-purple-400 mt-0.5" />
                <span>"{subtitle}"</span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Candidate Live Answer Box & Controls (7 cols)       */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 flex flex-col bg-[#141820] rounded-3xl border border-neutral-800/90 p-4 sm:p-6 shadow-2xl overflow-hidden relative">
          
          {/* Header Controls Bar */}
          <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-neutral-800/80 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Your Answer & Solution
              </span>
              {isListening ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Voice Transcribing
                </span>
              ) : micOn ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Connecting Mic...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
                  <FiMicOff size={10} />
                  Mic Muted
                </span>
              )}
            </div>

            {/* Media & Tool Toggles */}
            <div className="flex items-center gap-1.5">
              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  micOn && isListening
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-xs shadow-emerald-500/20'
                    : micOn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                }`}
                title={micOn ? (isListening ? "Microphone Active (Click to mute)" : "Connecting Mic (Click to toggle)") : "Microphone Muted (Click to enable)"}
              >
                {micOn ? (
                  <FiMic size={14} className={isListening ? "text-emerald-400" : "text-amber-400 animate-pulse"} />
                ) : (
                  <FiMicOff size={14} />
                )}
                <span className="hidden sm:inline">
                  {micOn ? (isListening ? 'Mic Live' : 'Connecting') : 'Mic Off'}
                </span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  cameraOn
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                }`}
                title={cameraOn ? "Camera ON" : "Camera OFF"}
              >
                {cameraOn ? <FiVideo size={14} /> : <FiVideoOff size={14} />}
                <span className="hidden sm:inline">{cameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Coding Pad Toggle */}
              <button
                onClick={() => setCodeOpen(true)}
                className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Open Coding Environment"
              >
                <FiCode size={14} />
                <span>Coding Pad</span>
              </button>
            </div>
          </div>

          {/* Microphone Permission Warning / Error Banner */}
          {micError && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FiAlertCircle size={16} className="text-amber-400 shrink-0" />
                <span>{micError}</span>
              </div>
              <button
                onClick={async () => {
                  const granted = await requestMicPermission();
                  if (granted) {
                    setMicOn(true);
                    startRecognition();
                  }
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Grant / Retry Mic
              </button>
            </div>
          )}

          {/* Answer Textarea */}
          <div className="flex-1 relative flex flex-col min-h-[220px]">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak aloud into your microphone or type your response here... Click 'Coding Pad' above to write and insert structured code."
              className={`w-full flex-1 p-4 bg-[#0d1117] text-neutral-100 rounded-2xl border text-sm sm:text-base leading-relaxed resize-none focus:outline-none focus:ring-2 placeholder:text-neutral-600 font-sans selection:bg-purple-600/40 transition-colors ${
                isListening
                  ? 'border-emerald-600/60 focus:ring-emerald-600/30 focus:border-emerald-600'
                  : 'border-neutral-800/90 focus:ring-purple-600/40 focus:border-purple-600'
              }`}
            />
            {/* Live interim preview — shows what's being heard right now */}
            {liveInterim && (
              <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300/80 italic flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{liveInterim}</span>
              </div>
            )}
          </div>


          {/* Bottom Action Footer */}
          <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-neutral-500 flex items-center gap-2">
              <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>&bull;</span>
              <span>{answer.length} characters</span>
            </div>

            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              onClick={handleSubmitAnswer}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Answer with AI...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <FiArrowRight size={15} />
                </>
              )}
            </motion.button>
          </div>

          {/* =============================================================== */}
          {/* INTERMEDIATE INSTANT FEEDBACK OVERLAY DRAWER                    */}
          {/* =============================================================== */}
          <AnimatePresence>
            {feedback && !interviewCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 bg-[#12161f]/98 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto rounded-3xl border border-purple-500/30"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        <FiAward />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Question {currentQuestionIndex} Evaluation</h3>
                        <p className="text-[11px] text-neutral-400">Real-time breakdown from interviewer</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-extrabold text-sm">
                      <span>{feedback.score || 0}</span>
                      <span className="text-[10px] text-purple-400">/ 100</span>
                    </div>
                  </div>

                  {/* Feedback Critique */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                    <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed italic">
                      "{feedback.feedback || 'Good effort. Keep your explanation structured and focused.'}"
                    </p>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Correctness', val: feedback.correctness },
                      { label: 'Clarity', val: feedback.clarity },
                      { label: 'Relevance', val: feedback.relevance },
                      { label: 'Problem Solving', val: feedback.problemSolving ?? feedback.efficiency }
                    ].map((m, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">{m.label}</p>
                        <p className="text-sm font-bold text-purple-300">{m.val ?? 0}%</p>
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  {feedback.improvements && feedback.improvements.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Top Actionable Improvements:
                      </p>
                      <div className="space-y-1">
                        {feedback.improvements.map((imp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200"
                          >
                            <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Next Question</span>
                    <FiArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =============================================================== */}
          {/* FINAL COMPLETION MODAL                                          */}
          {/* =============================================================== */}
          <AnimatePresence>
            {interviewCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-[#0E1015]/98 backdrop-blur-xl z-40 p-6 flex flex-col items-center justify-center text-center rounded-3xl border border-purple-500/40"
              >
                <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-purple-600/30 mb-4 animate-bounce">
                  <FiCheckCircle />
                </div>

                <h2 className="text-2xl font-extrabold text-white">Interview Complete!</h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mt-2 leading-relaxed">
                  Congratulations! You have completed all {totalQuestions} questions. Your full performance analysis and scorecard report is ready.
                </p>

                <div className="my-6 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 w-full max-w-xs">
                  <p className="text-[10px] font-semibold uppercase text-neutral-400 tracking-wider">
                    Overall Performance Score
                  </p>
                  <p className="text-4xl font-extrabold text-purple-400 mt-1">
                    {finalReportData?.overallScore ?? 80}
                    <span className="text-xs text-neutral-500"> / 100</span>
                  </p>
                </div>

                <button
                  onClick={handleFinishAndOpenReport}
                  className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                >
                  <FiZap size={16} />
                  <span>View Comprehensive Performance Report</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}

export default Step2interview;
