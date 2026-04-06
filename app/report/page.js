'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, ChevronLeft, Download, Copy, RefreshCw, BarChart4, CheckCircle, Package } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { useBitbucketConfig, useTargetBranches } from '../hooks';
import ReportSummary from '../components/report-summary';
import ReportFilters from '../components/report-filters';
import ReportTable from '../components/report-table';

const queryClient = new QueryClient();

const ReportPageContent = () => {
    const router = useRouter();
    const { config, isConfigured, getHeaders } = useBitbucketConfig();
    const { targetBranches, primaryBranch, isTargetConfigured } = useTargetBranches();
    const [mounted, setMounted] = useState(false);

    // Ensure we are client-side before rendering or guarding
    useEffect(() => {
        setMounted(true);
        if (!isConfigured || !isTargetConfigured) {
            router.push('/');
        }
    }, [isConfigured, isTargetConfigured, router]);

    const [filters, setFilters] = useState({
        merged: 'all',
        branchType: 'all',
        name: ''
    });

    const { data: report, isLoading, isError, refetch } = useQuery({
        queryKey: ['reportData', filters, primaryBranch, config],
        queryFn: async () => {
            const params = {
                primaryBranch: primaryBranch,
                merged: filters.merged === 'all' ? undefined : filters.merged,
                branchType: filters.branchType === 'all' ? undefined : filters.branchType,
                name: filters.name || undefined
            };

            const res = await axios.get('/api/report', { 
                params,
                headers: getHeaders()
            });
            return res.data;
        },
        enabled: isConfigured && isTargetConfigured,
        refetchOnWindowFocus: false,
        retry: 1
    });

    const { data: branchTypeList } = useQuery({
        queryKey: ['branchTypeList', config],
        queryFn: () => axios.get('/api/branches/constant/getBranchType', { headers: getHeaders() }).then((res) => res.data),
        enabled: isConfigured,
        refetchOnWindowFocus: false
    });

    const handleExportCSV = () => {
        if (!report?.data) return;
        
        const headers = ['Branch Name', 'Branch Type', 'Author', 'Last Commit', `${primaryBranch} Status`];

        const csvRows = [headers.join(',')];

        report.data.forEach(branch => {
            const row = [
                `"${branch.name}"`,
                `"${branch.branchType || ''}"`,
                `"${branch.authorName || ''}"`,
                `"${branch.lastCommitDate ? new Date(branch.lastCommitDate).toISOString().split('T')[0] : ''}"`
            ];

            targetBranches.forEach(target => {
                row.push(branch.primaryMergeStatus ? 'Merged' : 'Not Merged');
            });

            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `branch-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyMarkdown = () => {
        if (!report?.data) return;
        
        let md = `## Branch Merge Report — ${primaryBranch} — ${new Date().toLocaleDateString()}\n\n`;
        md += `**Summary:** ${report.summary.merged} Merged / ${report.summary.notMerged} Not Merged out of ${report.summary.total} total branches\n\n`;
        
        const headerRow = `| Branch | Author | Last Commit | ${primaryBranch} Status |`;
        const separatorRow = `|:---|:---|:---|:---:|`;
        
        md += headerRow + '\n' + separatorRow + '\n';

        report.data.slice(0, 100).forEach(branch => {
            const statusIcon = branch.primaryMergeStatus ? '✅' : '❌';
            md += `| ${branch.name} | ${branch.authorName || 'N/A'} | ${branch.lastCommitDate ? branch.lastCommitDate.split('T')[0] : 'N/A'} | ${statusIcon} |\n`;
        });

        if (report.data.length > 100) md += `\n*...and ${report.data.length - 100} more branches*`;

        navigator.clipboard.writeText(md).then(() => {
            alert('Report copied to clipboard in Markdown format!');
        });
    };

    if (!mounted || !isConfigured || !isTargetConfigured) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 selection:bg-blue-100 selection:text-blue-900">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
                    <div className="space-y-6">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-6">
                            <div className="bg-indigo-600 p-5 rounded-[32px] shadow-2xl shadow-indigo-200 -rotate-2 hover:rotate-0 transition-all duration-500">
                                <BarChart4 className="w-10 h-10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Merge<span className="text-indigo-600">Report</span>.</h1>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-white border border-slate-100 rounded-full flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Bitbucket Snapshot</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleExportCSV}
                            disabled={isLoading || !report}
                            className="bg-white px-8 py-5 rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-100 font-black text-slate-700 uppercase text-[10px] tracking-[0.15em] flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-5 h-5 text-blue-600" />
                            Export Data CSV
                        </button>
                        <button 
                            onClick={handleCopyMarkdown}
                            disabled={isLoading || !report}
                            className="bg-slate-900 px-8 py-5 rounded-[28px] shadow-2xl shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-1 font-black text-white uppercase text-[10px] tracking-[0.15em] flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Copy className="w-5 h-5 text-indigo-400" />
                            Copy Markdown
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-48 gap-8 bg-white/50 rounded-[60px] border border-white backdrop-blur-sm">
                        <div className="relative">
                            <RefreshCw className="w-20 h-20 text-indigo-600 animate-spin" />
                            <div className="absolute inset-0 bg-indigo-600/20 blur-3xl animate-pulse"></div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 animate-pulse">Analysing Repository...</h3>
                            <p className="text-slate-400 font-medium">Fetching merge status for all branches, please wait.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <ReportFilters 
                            filters={filters} 
                            onFilterChange={setFilters} 
                            targetBranches={targetBranches} 
                            primaryBranch={primaryBranch}
                            branchTypes={branchTypeList?.data}
                        />

                        <ReportSummary 
                            summary={report?.summary} 
                            targetBranch={primaryBranch} 
                        />

                        <ReportTable 
                            data={report?.data} 
                            targetBranches={targetBranches} 
                            primaryBranch={primaryBranch}
                        />
                    </>
                )}

                {/* Footer Style */}
                <div className="pt-24 pb-12 text-center select-none opacity-40">
                    <div className="inline-flex items-center gap-3">
                        <div className="bg-slate-200 w-12 h-[1px]"></div>
                        <Package className="w-5 h-5 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Premium Report Sync v3.0</span>
                        <div className="bg-slate-200 w-12 h-[1px]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportPage = () => (
    <QueryClientProvider client={queryClient}>
        <ReportPageContent />
    </QueryClientProvider>
);

export default ReportPage;
