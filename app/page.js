'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BranchList from './components/branch-list';
import SetupWizard from './components/setup-wizard';
import { useBitbucketConfig, useTargetBranches } from './hooks';

const queryClient = new QueryClient()

const BranchTracker = () => {
    const { isConfigured } = useBitbucketConfig();
    const { isTargetConfigured } = useTargetBranches();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const needsSetup = !isConfigured || !isTargetConfigured;

    if (!mounted) return null;

    return (
        <QueryClientProvider client={queryClient}>
            {needsSetup ? (
                <SetupWizard />
            ) : (
                <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                        {/* Header */}
                        <div className="mb-8 sm:mb-12">
                            <div className="flex items-center gap-3 sm:gap-4 mb-3">
                                <div className="bg-blue-600 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500 flex-shrink-0">
                                    <GitBranch className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Branch<span className="text-blue-600">Tracker</span>.</h1>
                            </div>
                            <p className="text-sm sm:text-base font-medium text-slate-400 max-w-xl leading-relaxed pl-1">
                                Monitor your feature merge status across environments in real-time.
                            </p>
                        </div>
                        <BranchList />
                    </div>
                    
                    <div className="mt-16 text-center pb-6">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-slate-100 select-none">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch Tracker v3.0 • Bitbucket Sync</span>
                        </div>
                    </div>
                </div>
            )}
        </QueryClientProvider>
    );
};

export default BranchTracker;