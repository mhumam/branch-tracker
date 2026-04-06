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

    // Determine setup state
    const needsSetup = !isConfigured || !isTargetConfigured;

    if (!mounted) return null;

    return (
        <QueryClientProvider client={queryClient}>
            {needsSetup ? (
                <SetupWizard />
            ) : (
                <div className="min-h-screen bg-slate-50 p-4 md:p-8 selection:bg-blue-100 selection:text-blue-900">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <GitBranch className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Branch<span className="text-blue-600">Tracker</span>.</h1>
                                </div>
                                <p className="text-lg font-bold text-slate-400 max-w-xl leading-relaxed">
                                    Monitor your feature merge status across environments in real-time.
                                </p>
                            </div>
                        </div>
                        <BranchList />
                    </div>
                    
                    <div className="mt-24 text-center pb-8 sticky bottom-0 pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/50 backdrop-blur-md rounded-full shadow-lg border border-white/20 select-none">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Branch Tracker v3.0 • Build and Sync with Bitbucket</span>
                        </div>
                    </div>
                </div>
            )}
        </QueryClientProvider>
    );
};

export default BranchTracker;