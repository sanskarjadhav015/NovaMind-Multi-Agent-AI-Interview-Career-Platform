import React, { useState, useEffect, useRef } from "react";
import {
  FiArrowLeft,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiLayout,
  FiDroplet,
} from "react-icons/fi";
import DownloadBtn from "./DownloadBtn";
import ATSTemplate from "./ATSTemplate";
import ModernTemplate from "./ModernTemplate";
import TechTemplate from "./TechTemplate";
import { LuCoins } from "react-icons/lu";

const TEMPLATES = [
  { id: "ats", label: "Classic ATS", component: ATSTemplate },
  { id: "modern", label: "Modern Clean", component: ModernTemplate },
  { id: "tech", label: "Tech Engineer", component: TechTemplate },
];

const THEME_COLORS = [
  { id: "slate", label: "Slate Black", hex: "#111827" },
  { id: "navy", label: "Royal Navy", hex: "#1e3a8a" },
  { id: "purple", label: "Nova Violet", hex: "#6b21a8" },
  { id: "emerald", label: "Emerald", hex: "#065f46" },
  { id: "crimson", label: "Crimson", hex: "#991b1b" },
];

function PreviewResume({ data, onBack, user, setUser }) {
  const resumeRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");
  const [themeColor, setThemeColor] = useState("#111827");
  const [scale, setScale] = useState(0.85);

  // Responsive scale estimation on mount and window resize
  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScale(0.42);
      } else if (width < 768) {
        setScale(0.58);
      } else if (width < 1024) {
        setScale(0.72);
      } else if (width < 1280) {
        setScale(0.82);
      } else {
        setScale(0.9);
      }
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 1.4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.35));
  const handleResetZoom = () => {
    const width = window.innerWidth;
    setScale(width < 768 ? 0.55 : 0.85);
  };

  const activeTemplateObj =
    TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
  const ActiveComponent = activeTemplateObj.component;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
            >
              <FiArrowLeft size={14} />
              <span>Back to Edit</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-950 flex items-center gap-2">
                Resume Preview
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  ATS Verified
                </span>
              </h2>
            </div>
          </div>

          {/* Center & Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <FiLayout size={13} className="text-neutral-500 ml-1.5" />
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedTemplate === tmpl.id
                      ? "bg-white text-neutral-950 font-bold shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950"
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            {/* Accent Color Picker */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <FiDroplet size={13} className="text-neutral-500 ml-1.5 mr-0.5" />
              {THEME_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setThemeColor(color.hex)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                    themeColor === color.hex
                      ? "scale-115 ring-2 ring-purple-600 ring-offset-1 border-white"
                      : "opacity-75 hover:opacity-100 border-black/10"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:text-neutral-950 cursor-pointer"
                title="Zoom Out"
              >
                <FiZoomOut size={14} />
              </button>
              <span className="w-12 text-center text-[11px] font-semibold text-neutral-700">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:text-neutral-950 cursor-pointer"
                title="Zoom In"
              >
                <FiZoomIn size={14} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 hover:text-neutral-950 cursor-pointer ml-1"
                title="Fit to Width"
              >
                <FiMaximize2 size={13} />
              </button>
            </div>

            {/* Coins Balance Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-800"
              title="Your current Interview Coins balance"
            >
              <LuCoins size={14} className="text-yellow-500" />
              <span>{user?.interviewCoin ?? 0}</span>
            </div>

            {/* PDF Download Button */}
            <DownloadBtn
              resumeRef={resumeRef}
              candidateName={data?.name}
              user={user}
              setUser={setUser}
              cost={10}
            />
          </div>
        </div>
      </header>

      {/* ----------------- RESUME CANVAS / PREVIEW AREA ----------------- */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          className="transition-transform duration-150 ease-out origin-top my-4"
          style={{
            transform: `scale(${scale})`,
            width: "800px",
          }}
        >
          {/* Printable Container */}
          <div ref={resumeRef} className="rounded-sm overflow-hidden bg-white shadow-2xl">
            <ActiveComponent data={data} themeColor={themeColor} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default PreviewResume;
