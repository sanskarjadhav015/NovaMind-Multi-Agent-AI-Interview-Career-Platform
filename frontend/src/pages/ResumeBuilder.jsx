import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiZap,
  FiCheck,
  FiRotateCcw,
  FiFileText,
  FiUploadCloud,
  FiColumns,
  FiDownload,
  FiLayers,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { LuCoins } from "react-icons/lu";
import ResumeForm from "../components/resume/ResumeForm";
import PreviewResume from "../components/resume/PreviewResume";
import ATSTemplate from "../components/resume/ATSTemplate";
import initialData, { sampleResumeData } from "../components/resume/initialData";

const STEPS = [
  {
    step: 1,
    title: "Personal Information",
    subtitle: "Your contact details, links, and location",
  },
  {
    step: 2,
    title: "Professional Summary",
    subtitle: "A strong 3-4 sentence introduction for recruiters",
  },
  {
    step: 3,
    title: "Skills & Core Competencies",
    subtitle: "Technical abilities, languages, and developer tools",
  },
  {
    step: 4,
    title: "Work Experience",
    subtitle: "Your past professional roles, internships, and achievements",
  },
  {
    step: 5,
    title: "Projects",
    subtitle: "Showcase your top software projects with links & tech stacks",
  },
  {
    step: 6,
    title: "Education",
    subtitle: "Your degree, university/college, and academic background",
  },
];

const TOTAL_STEPS = STEPS.length;

function ResumeBuilder({ user, setUser }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(() => {
    // Try restoring from localStorage if saved
    try {
      const saved = localStorage.getItem("novamind_resume_draft");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return initialData;
  });

  const [showPreview, setShowPreview] = useState(false);
  const [splitView, setSplitView] = useState(true);

  // Redux resume state (e.g. if parsed in /scorer)
  const { resume: scannedResume } = useSelector((state) => state.resume);

  // Auto-save draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("novamind_resume_draft", JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }, [data]);

  const progressPct = (currentStep / TOTAL_STEPS) * 100;
  const activeStepObj = STEPS.find((s) => s.step === currentStep) || STEPS[0];
  const isLastStep = currentStep === TOTAL_STEPS;

  const goPrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handleLoadSample = () => {
    if (window.confirm("Load sample resume data? This will overwrite your current draft.")) {
      setData(sampleResumeData);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset resume form? All fields will be cleared.")) {
      setData(initialData);
      setCurrentStep(1);
      localStorage.removeItem("novamind_resume_draft");
    }
  };

  // Import parsed data from Redux scanned resume
  const handleImportScanned = () => {
    if (!scannedResume) return;
    if (
      window.confirm(
        "Import details from your scanned resume? This will populate matching fields."
      )
    ) {
      setData((prev) => ({
        ...prev,
        name: scannedResume.name || prev.name,
        email: scannedResume.email || prev.email,
        phone: scannedResume.phone || prev.phone,
        summary: scannedResume.summary || prev.summary,
        skills: Array.isArray(scannedResume.skills)
          ? scannedResume.skills.join(", ")
          : scannedResume.skills || prev.skills,
        experience:
          Array.isArray(scannedResume.experience) && scannedResume.experience.length > 0
            ? scannedResume.experience
            : prev.experience,
        projects:
          Array.isArray(scannedResume.projects) && scannedResume.projects.length > 0
            ? scannedResume.projects
            : prev.projects,
        education:
          Array.isArray(scannedResume.education) && scannedResume.education.length > 0
            ? scannedResume.education
            : prev.education,
      }));
    }
  };

  if (showPreview) {
    return (
      <PreviewResume
        data={data}
        user={user}
        setUser={setUser}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30 border-b border-black/[0.08] bg-white/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Breadcrumb */}
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-85"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-950 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
              <FiZap className="text-white text-sm" />
            </div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900">
              NovaMind<span className="text-purple-600">AI</span>
            </span>
            <span className="text-neutral-300 font-light hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-500 hidden sm:inline">
              Resume Builder
            </span>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {scannedResume && (
              <button
                type="button"
                onClick={handleImportScanned}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                title="Import information from your analyzed ATS resume"
              >
                <FiUploadCloud size={13} />
                <span>Import from Scorer</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Load example data to test the resume builder"
            >
              <FiFileText size={13} />
              <span className="hidden sm:inline">Load Sample</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Clear all fields"
            >
              <FiRotateCcw size={13} />
              <span className="hidden sm:inline ml-1">Reset</span>
            </button>

            {/* Split View Toggle for Wide Screens */}
            <button
              type="button"
              onClick={() => setSplitView(!splitView)}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                splitView
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <FiColumns size={13} />
              <span>Live Preview</span>
            </button>

            {/* Coins Balance Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-800"
              title="Your Interview Coins"
            >
              <LuCoins size={14} className="text-yellow-500" />
              <span>{user?.interviewCoin ?? 0}</span>
            </div>

            {/* Full Preview Modal Button */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FiEye size={13} />
              <span>Preview & Download</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ----------------- MAIN LAYOUT ----------------- */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div
          className={`grid gap-6 items-start ${
            splitView ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-3xl mx-auto"
          }`}
        >
          {/* ----------------- LEFT: FORM WIZARD ----------------- */}
          <div
            className={`flex flex-col bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-5 sm:p-7 ${
              splitView ? "lg:col-span-7" : "w-full"
            }`}
          >
            {/* Top Stepper Indicator */}
            <div className="border-b border-neutral-100 pb-5 mb-5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-2">
                <span className="uppercase tracking-wider">
                  Step {currentStep} of {TOTAL_STEPS}
                </span>
                <span className="font-bold text-neutral-900">{Math.round(progressPct)}% Completed</span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden mb-5">
                <motion.div
                  className="h-full bg-linear-to-r from-purple-600 to-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step Navigation Pills */}
              <div className="grid grid-cols-6 gap-1.5">
                {STEPS.map((s) => {
                  const isCompleted = s.step < currentStep;
                  const isActive = s.step === currentStep;

                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-xs font-bold"
                          : isCompleted
                          ? "bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold"
                          : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
                      }`}
                      title={s.title}
                    >
                      <div className="flex items-center justify-center text-xs">
                        {isCompleted ? <FiCheck size={12} /> : <span>{s.step}</span>}
                      </div>
                      <span className="text-[10px] hidden sm:inline truncate max-w-full mt-0.5">
                        {s.title.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Heading */}
            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-950">
                {activeStepObj.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">{activeStepObj.subtitle}</p>
            </div>

            {/* Step Form Body with Transition */}
            <div className="min-h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <ResumeForm step={currentStep} data={data} setData={setData} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Wizard Controls */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-5 mt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <FiArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <FiEye size={14} />
                    <span>Review & Download</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <span>Next Step</span>
                    <FiArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ----------------- RIGHT: LIVE ATS PREVIEW (SPLIT VIEW) ----------------- */}
          {splitView && (
            <div className="hidden lg:flex flex-col lg:col-span-5 sticky top-20 max-h-[calc(100vh-6rem)]">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-t-2xl border border-b-0 border-neutral-200/90">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-neutral-900">Live ATS Preview</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  <FiEye size={13} />
                  <span>Full Screen</span>
                </button>
              </div>

              {/* Scrollable scaled document viewport */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-200/60 p-4 rounded-b-2xl border border-neutral-200/90 flex justify-center items-start shadow-inner">
                <div
                  className="origin-top my-2 shadow-xl rounded overflow-hidden pointer-events-none select-none"
                  style={{
                    transform: "scale(0.55)",
                    transformOrigin: "top center",
                    width: "800px",
                    marginBottom: "-40%",
                  }}
                >
                  <ATSTemplate data={data} themeColor="#111827" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeBuilder;
