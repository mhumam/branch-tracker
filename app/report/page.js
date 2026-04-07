'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, ChevronLeft, Download, Copy, RefreshCw, BarChart4, CheckCircle, Package, XCircle } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { useBitbucketConfig, useTargetBranches } from '../hooks';
import ReportSummary from '../components/report-summary';
import ReportFilters from '../components/report-filters';
import ReportTable from '../components/report-table';

const queryClient = new QueryClient();

const ReportPageContent = () => {
    const router = useRouter();
    const { isConfigured } = useBitbucketConfig();
    const { targetBranches, primaryBranch, isTargetConfigured } = useTargetBranches();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isConfigured || !isTargetConfigured) {
            router.push('/');
        }
    }, [isConfigured, isTargetConfigured, router]);

    const [filters, setFilters] = useState({
        merged: 'all',
        branchType: 'all',
        name: '',
        author: ''
    });

    const { data: report, isLoading, isError, refetch, error } = useQuery({
        queryKey: ['reportData', primaryBranch],
        queryFn: async () => {
            const params = { primaryBranch };
            const res = await axios.get('/api/report', { params });
            return res.data;
        },
        enabled: !!(isConfigured && isTargetConfigured),
        refetchOnWindowFocus: false,
        retry: 1
    });

    // Ekstrapolasi unique author list dari data (client-side)
    const authorList = React.useMemo(() => {
        const data = report?.data;
        if (!data) return [];
        const names = data.map(b => b.authorName).filter(Boolean);
        return [...new Set(names)].sort();
    }, [report]);

    // Filter dilakukan sepenuhnya di sisi client (instan & hemat API)
    const filteredData = React.useMemo(() => {
        const data = report?.data;
        if (!data) return [];
        
        return data.filter(branch => {
            // 1. Filter Nama (Case Insensitive)
            if (filters.name && !branch.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            
            // 2. Filter Branch Type
            if (filters.branchType !== 'all' && branch.branchType !== filters.branchType) {
                return false;
            }
            
            // 3. Filter Merged Status
            if (filters.merged !== 'all') {
                const isMerged = filters.merged === 'true';
                if (branch.primaryMergeStatus !== isMerged) {
                    return false;
                }
            }
            
            // 4. Filter Author
            if (filters.author && branch.authorName !== filters.author) {
                return false;
            }
            
            return true;
        });
    }, [report, filters]);

    const { data: branchTypeList } = useQuery({
        queryKey: ['branchTypeList', targetBranches],
        queryFn: () => {
            const targetBranchesParam = `?targetBranches=${encodeURIComponent(JSON.stringify(targetBranches))}`;
            return axios.get('/api/branches/constant/getBranchType' + targetBranchesParam).then((res) => res.data);
        },
        enabled: !!(isConfigured && isTargetConfigured),
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
            row.push(branch.primaryMergeStatus ? 'Merged' : 'Not Merged');
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
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group">
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl shadow-indigo-200 -rotate-2 hover:rotate-0 transition-all duration-500 flex-shrink-0">
                                <BarChart4 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Merge<span className="text-indigo-600">Report</span>.</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time Bitbucket Snapshot</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={isLoading || !report}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white px-4 sm:px-6 py-3 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 font-bold text-slate-700 text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                            <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="hidden xs:inline">Export</span> CSV
                        </button>
                        <button
                            onClick={handleCopyMarkdown}
                            disabled={isLoading || !report}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 px-4 sm:px-6 py-3 rounded-2xl shadow-lg font-bold text-white text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap hover:bg-slate-800"
                        >
                            <Copy className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span className="hidden xs:inline">Copy</span> Markdown
                        </button>
                    </div>
                </div>

                {/* ── Filters ───────────────────────────────────────────── */}
                <ReportFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    targetBranches={targetBranches}
                    primaryBranch={primaryBranch}
                    branchTypes={branchTypeList?.data}
                    authors={authorList}
                />

                {/* ── Content ───────────────────────────────────────────── */}
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-6 bg-white/50 rounded-3xl border border-white backdrop-blur-sm">
                        <div className="relative">
                            <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 animate-spin" />
                            <div className="absolute inset-0 bg-indigo-600/20 blur-3xl animate-pulse"></div>
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg sm:text-xl font-black text-slate-800 animate-pulse">Analysing Repository...</h3>
                            <p className="text-sm text-slate-400 font-medium">Fetching merge status, please wait.</p>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-12 sm:p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                            <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        {error?.response?.status === 429 ? (
                            <>
                                <h3 className="text-xl font-black text-rose-900 mb-2">Too Many Requests</h3>
                                <p className="text-sm text-rose-600 font-medium max-w-sm mx-auto mb-6">
                                    Bitbucket rate limit reached. The report contains many branches and many parallel requests. Please wait a minute before trying again.
                                </p>
                                <button
                                    onClick={() => refetch()}
                                    className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200 inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Retry Report
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-black text-rose-900 mb-2">Report Generation Failed</h3>
                                <p className="text-sm text-rose-600 font-medium max-w-sm mx-auto mb-6">
                                    {error?.response?.data?.error || "An unexpected error occurred while generating the report."}
                                </p>
                                <button
                                    onClick={() => refetch()}
                                    className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200"
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <ReportSummary summary={report?.summary} targetBranch={primaryBranch} filteredCount={filteredData.length} />
                        <ReportTable 
                            data={filteredData} 
                            targetBranches={targetBranches} 
                            primaryBranch={primaryBranch} 
                            workspace={report?.workspace}
                            repoSlug={report?.repoSlug}
                        />
                    </>
                )}

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="pt-8 pb-4 text-center select-none opacity-30">
                    <div className="inline-flex items-center gap-2">
                        <div className="bg-slate-200 w-8 h-px"></div>
                        <Package className="w-4 h-4 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Branch Tracker v3.0</span>
                        <div className="bg-slate-200 w-8 h-px"></div>
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
