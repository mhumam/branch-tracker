'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BranchList from './components/branch-list';

const queryClient = new QueryClient()

const BranchTracker = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <GitBranch className="w-8 h-8 text-blue-600" />
                                <h1 className="text-3xl font-bold text-gray-800">BranchTracker</h1>
                            </div>
                        </div>
                        <p className="text-gray-600">Track status merge branch ke staging, uat, testing operation and production environment</p>
                    </div>
                    <BranchList />
                </div>
            </div>
        </QueryClientProvider>
    );
};

export default BranchTracker;