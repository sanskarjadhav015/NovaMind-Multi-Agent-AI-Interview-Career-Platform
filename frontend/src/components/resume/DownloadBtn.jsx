import React, { useState } from "react";
import { FiDownload, FiCheck, FiLoader, FiAlertCircle, FiX } from "react-icons/fi";
import { LuCoins } from "react-icons/lu";
import { useReactToPrint } from "react-to-print";
import { useCoins } from "../../api/user.api";

function DownloadBtn({
  resumeRef,
  candidateName = "Resume",
  user,
  setUser,
  cost = 10,
  className = "",
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const cleanFileName = candidateName
    ? `${candidateName.trim().replace(/[^a-zA-Z0-9]/g, "_")}_Resume`
    : "Resume_NovaMindAI";

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: cleanFileName,
    pageStyle: `
      @page {
        size: A4;
        margin: 8mm 10mm;
      }
      @media print {
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    onBeforePrint: async () => {
      setIsProcessing(true);
    },
    onAfterPrint: () => {
      setIsProcessing(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    },
    onPrintError: () => {
      setIsProcessing(false);
    },
  });

  const handleDownload = async () => {
    // 1. Fast local check if user has fewer coins than required
    if (user && typeof user.interviewCoin === "number" && user.interviewCoin < cost) {
      setErrorMessage(`You have ${user.interviewCoin} coins, but ${cost} coins are required.`);
      setShowInsufficientModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");

      // 2. Call backend to deduct coins
      const coinResponse = await useCoins({
        coins: cost,
        action: "resume-download",
      });

      if (coinResponse?.success) {
        // 3. Update React user state with new coin balance
        if (setUser) {
          setUser((prev) => ({
            ...prev,
            interviewCoin: coinResponse.interviewCoin,
          }));
        }

        // 4. Trigger print/download dialog
        handlePrint();
      } else {
        setErrorMessage(
          coinResponse?.message || `Not enough coins. ${cost} coins are required.`
        );
        setShowInsufficientModal(true);
      }
    } catch (error) {
      console.error("Coin deduction error:", error);
      setErrorMessage("Failed to process interview coins. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isProcessing}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer ${downloadSuccess
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-neutral-950 text-white hover:bg-neutral-800"
          } disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        title={`Download PDF (${cost} interview coins)`}
      >
        {isProcessing ? (
          <>
            <FiLoader className="animate-spin text-sm" />
            <span>Processing...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <FiCheck className="text-sm text-white" />
            <span>Downloaded (-{cost} Coins)</span>
          </>
        ) : (
          <>
            <FiDownload className="text-sm" />
            <span>Download PDF</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] font-bold">
              <LuCoins className="text-yellow-400 text-xs" />
              <span>{cost}</span>
            </span>
          </>
        )}
      </button>

      {/* Insufficient Coins Modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <button
              onClick={() => setShowInsufficientModal(false)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                <LuCoins size={24} />
              </div>

              <h3 className="text-base font-bold text-neutral-900">
                Insufficient Interview Coins
              </h3>

              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Downloading your resume PDF costs <span className="font-bold text-neutral-900">{cost} coins</span>.
              </p>

              <div className="w-full my-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Your current balance:</span>
                <span className="font-bold text-neutral-900 flex items-center gap-1">
                  <LuCoins className="text-yellow-500" />
                  {user?.interviewCoin ?? 0} coins
                </span>
              </div>

              {errorMessage && (
                <div className="w-full mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 text-left">
                  <FiAlertCircle className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={() => setShowInsufficientModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DownloadBtn;