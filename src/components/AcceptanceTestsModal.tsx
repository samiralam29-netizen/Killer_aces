import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { runAllAcceptanceTests, TestResult } from '../game/acceptanceTests';

interface AcceptanceTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcceptanceTestsModal: React.FC<AcceptanceTestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState<TestResult[]>(() => runAllAcceptanceTests());
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllAcceptanceTests();
      setTestResults(res);
      setIsRunning(false);
    }, 150);
  };

  const passCount = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;
  const allPassed = passCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-3xl text-amber-50 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-serif">
                  Automated Acceptance Tests
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    allPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
                >
                  {passCount} / {totalCount} Passed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authoritative verification of all 19 rules from Section 10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Rerun Tests</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Test List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                t.passed
                  ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/60'
                  : 'bg-red-950/30 border-red-500/50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="text-slate-400 font-mono">#{t.id}</span>
                    <span>{t.name}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed font-sans">
                    {t.details}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  t.passed
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-950 text-red-400 border border-red-500/40'
                }`}
              >
                {t.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
