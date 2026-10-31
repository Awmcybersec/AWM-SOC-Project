import React, { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";
import { ShieldAlert, CheckCircle2, Cpu, Zap, Activity, Globe2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    { title: "Threat Intelligence Engine", icon: Globe2 },
    { title: "AI Decision Engine", icon: Cpu },
    { title: "Autonomous Response Engine", icon: Zap },
    { title: "SOC Monitoring Systems", icon: Activity },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 400);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1220] flex flex-col items-center justify-center p-6 text-slate-100 font-sans select-none overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Emblem Logo */}
        <div className="relative flex items-center justify-center w-56 h-40 shrink-0 transition-opacity duration-700 ease-in-out p-1 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-inner">
          <img
            src={logo}
            alt="AWM Cybersecurity Official Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(6,182,212,0.25)]"
            referrerPolicy="no-referrer"
          />
          <span className="absolute top-2 right-2 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AWM AI SOC <span className="text-cyan-400">SENIOR</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Enterprise Autonomous Security Operations Center
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Initializing AI Security Operations Center...
            </span>
            <span className="text-cyan-400 font-mono font-bold">
              {Math.min(Math.round(((currentStep + 1) / steps.length) * 100), 100)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Initialization Steps */}
        <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2 text-left text-xs">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                    : isDone
                    ? "text-slate-300"
                    : "text-slate-600 opacity-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isCurrent ? "text-cyan-400 animate-spin" : isDone ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className="font-semibold">{step.title}</span>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all"
        >
          Skip to Command Center →
        </button>
      </div>
    </div>
  );
};
