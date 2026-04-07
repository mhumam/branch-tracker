'use client';

import React, { useState } from 'react';
import { GitBranch, Box, CheckCircle } from 'lucide-react';
import StepCredentials from './StepCredentials';
import StepTargetBranch from './StepTargetBranch';
import { useBitbucketConfig, useTargetBranches } from '@/app/hooks';

const SetupWizard = () => {
    const [step, setStep] = useState(1);
    const { markConfigured } = useBitbucketConfig();
    const { save: saveTargets } = useTargetBranches();

    const handleNextStep = () => {
        // Credentials sudah tersimpan di HttpOnly session cookie oleh StepCredentials.
        // Kita hanya set flag isConfigured di sini.
        markConfigured();
        setStep(2);
    };

    const handleComplete = (branches) => {
        saveTargets(branches);
        // Force reload so page.js uses the new isTargetConfigured state immediately
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <div className="w-full max-w-2xl relative">
                {/* Background Decor */}
                <div className="absolute top-0 -left-16 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 -right-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse delay-1000"></div>

                {/* Header Branding */}
                <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="bg-blue-600 p-4 rounded-3xl shadow-xl rotate-3">
                            <GitBranch className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">BranchTracker Setup</h1>
                    </div>
                    <p className="text-slate-400 font-medium">Welcome! Let&apos;s get you connected to your Bitbucket repository.</p>
                </div>

                {/* Wizard Container */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 border border-white/50 backdrop-blur-sm relative overflow-hidden">
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mb-10 px-2 justify-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-md ${step === 1 ? 'bg-blue-600 text-white scale-110 shadow-blue-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${step === 1 ? 'text-slate-800' : 'text-emerald-500'}`}>Connection</span>
                        </div>
                        <div className={`flex-1 h-[2px] mx-4 transition-colors duration-1000 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 border-2 ${step === 2 ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-xl shadow-blue-200' : 'bg-white border-slate-100 text-slate-300'}`}>
                                2
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${step === 2 ? 'text-slate-800' : 'text-slate-300'}`}>Targets</span>
                        </div>
                    </div>

                    {step === 1 ? (
                        <StepCredentials onNext={handleNextStep} />
                    ) : (
                        <StepTargetBranch onComplete={handleComplete} />
                    )}
                </div>

                {/* Footer Decor */}
                <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white shadow-sm border border-slate-100 rounded-full select-none">
                        <Box className="w-4 h-4 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch Tracker v3.0 • Premium Deployment Sync</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
