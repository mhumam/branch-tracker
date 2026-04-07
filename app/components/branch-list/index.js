'use client';

import { useState } from "react";
import Link from 'next/link';
import { RefreshCw, Clock, CheckCircle, XCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Search, Settings, Layers, BarChart4 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import axios from "axios";
import { useDebounce } from "@/app/hooks";
import { useBitbucketConfig } from "@/app/hooks/useBitbucketConfig";
import { useTargetBranches } from "@/app/hooks/useTargetBranches";
import SettingsModal from "../settings-modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTypeColor = (type) => {
    const colors = {
        feature: 'bg-blue-100 text-blue-700',
        bugfix:  'bg-amber-100 text-amber-700',
        hotfix:  'bg-rose-100 text-rose-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-600';
};

// ─── Status Chip ─────────────────────────────────────────────────────────────

const StatusChip = ({ name, merged, isLoading }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
        isLoading
            ? 'bg-slate-50 border-slate-100 animate-pulse'
            : merged
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm'
            : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
    }`}>
        {isLoading ? (
            <div className="w-3 h-3 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
        ) : merged ? (
            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
        ) : (
            <XCircle className="w-3 h-3 text-slate-300 flex-shrink-0" />
        )}
        <span className="truncate">{name}</span>
    </div>
);

// ─── Status Branch ───────────────────────────────────────────────────────────

const StatusBranch = ({ branch, targetBranches, primaryBranch, fullStatus, isChecking, onCheckAll }) => {
    // Mode B: Full Status (Loaded on demand)
    if (fullStatus || isChecking) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                {targetBranches.map((obj) => (
                    <StatusChip
                        key={obj.branchName}
                        name={obj.displayName}
                        merged={fullStatus?.[obj.branchName]?.merged}
                        isLoading={isChecking}
                    />
                ))}
            </div>
        );
    }

    // Mode A: Primary Only (Initial Load)
    const primaryInfo = targetBranches.find(t => t.branchName === primaryBranch) || { displayName: primaryBranch };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${branch.primaryMergeStatus ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                    {branch.primaryMergeStatus ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {primaryInfo.displayName}
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Status to Primary</p>
                    <p className="text-xs font-bold text-slate-700">
                        {branch.primaryMergeStatus ? 'Already Merged' : 'Not Merged Yet'}
                    </p>
                </div>
            </div>
            <button
                onClick={onCheckAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
            >
                Check {targetBranches.length} envs <ChevronRight className="w-3 h-3" />
            </button>
        </div>
    );
};

// ─── Main App Component ───────────────────────────────────────────────────────

const App = () => {
    const { isConfigured, markConfigured, clear: clearConfig } = useBitbucketConfig();
    const { targetBranches, primaryBranch, save: saveTargetBranches, resetToDefault: resetTargetBranches, clear: clearTargetBranches } = useTargetBranches();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showSettings, setShowSettings] = useState(false);
    const [fullStatusMap, setFullStatusMap] = useState({});
    const [checkingMap, setCheckingMap] = useState({});

    const handleClearAll = async () => {
        await clearConfig();
        clearTargetBranches();
        window.location.reload();
    };

    const handleCheckAll = async (branchName) => {
        setCheckingMap(prev => ({ ...prev, [branchName]: true }));
        try {
            const params = new URLSearchParams({ from: branchName });
            targetBranches.forEach(t => params.append('to', t.branchName));
            const res = await axios.get(`/api/branches/merge-status?${params.toString()}`);
            setFullStatusMap(prev => ({ ...prev, [branchName]: res.data.mergeStatus }));
        } catch (err) {
            console.error('Failed to check all statuses', err);
        } finally {
            setCheckingMap(prev => ({ ...prev, [branchName]: false }));
        }
    };

    const debouncedFilter = useDebounce(searchTerm, 500);

    const { isLoading, data, isError, error } = useQuery({
        queryKey: ['branchesData', debouncedFilter, currentPage, itemsPerPage, filterType, primaryBranch],
        queryFn: async () => {
            const branchTypeFilter = filterType !== 'All' ? `&branchType=${filterType}` : '';
            try {
                const res = await axios.get(
                    `/api/branches?name=${debouncedFilter}&page=${currentPage}&size=${itemsPerPage}${branchTypeFilter}&primaryBranch=${primaryBranch}`
                );
                return res.data;
            } catch (err) {
                throw err;
            }
        },
        refetchOnWindowFocus: false,
        retry: false
    });

    const { data: branchTypeList } = useQuery({
        queryKey: ['branchTypeList', targetBranches],
        queryFn: () => {
            const targetBranchesParam = `?targetBranches=${encodeURIComponent(JSON.stringify(targetBranches))}`;
            return axios.get(`/api/branches/constant/getBranchType${targetBranchesParam}`).then((res) => res.data);
        },
        refetchOnWindowFocus: false,
        retry: false
    });

    const totalPages = data?.totalPages || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;

    const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = data?.pageLimit || 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="space-y-5">
            {/* ── Action Bar ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 shadow-sm rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    {/* Filter Type */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-slate-100 shadow-sm rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                        {['All', ...branchTypeList?.data ?? []].map((value, key) => (
                            <option key={key} value={value}>{value}</option>
                        ))}
                    </select>

                    {/* View Report */}
                    <Link href="/report">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-2xl text-sm font-bold text-slate-700 transition-all active:scale-95 hover:border-indigo-100 whitespace-nowrap">
                            <BarChart4 className="w-4 h-4 text-indigo-500" />
                            <span className="hidden sm:inline">Report</span>
                        </button>
                    </Link>

                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`flex items-center gap-2 px-4 py-2.5 shadow-sm hover:shadow-md rounded-2xl text-sm font-bold transition-all active:scale-95 ${isConfigured ? 'bg-white border border-slate-100 text-slate-700' : 'bg-blue-600 text-white shadow-blue-200'}`}
                    >
                        <Settings className={`w-4 h-4 ${isConfigured ? 'text-blue-500' : 'text-white'}`} />
                        <span className="hidden sm:inline">Settings</span>
                    </button>
                </div>
            </div>

            {/* ── Results ───────────────────────────────────────────────── */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-4 bg-white/60 rounded-3xl">
                        <div className="relative">
                            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 bg-blue-600/20 blur-xl animate-pulse" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing with Bitbucket...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-12 sm:p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                            <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-black text-rose-900 mb-2">Sync Failed</h3>
                        <p className="text-sm text-rose-600 font-medium max-w-sm mx-auto mb-6">
                            {error?.response?.data?.error || "Couldn't connect to Bitbucket. Check your credentials."}
                        </p>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200"
                        >
                            Update Settings
                        </button>
                    </div>
                ) : data?.data?.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-dashed border-slate-200">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-base font-bold text-slate-800">No branches found</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">No branches match your current search or filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Header */}
                        <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                {startIndex + 1}–{Math.min(startIndex + itemsPerPage, data?.totalData)} of {data?.totalData} branches
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Per page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-transparent text-xs font-bold text-blue-600 outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Branch Cards */}
                        <div className="grid grid-cols-1 gap-3">
                            {data?.data?.map((branch, key) => (
                                <div key={key} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-100 group">
                                    <div className="p-5 sm:p-7">
                                        {/* Branch Header */}
                                        <div className="mb-5">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getTypeColor(branch?.branchType)}`}>
                                                    {branch?.branchType || 'Unknown'}
                                                </span>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors break-all sm:break-normal leading-tight mb-3">
                                                {branch?.name}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-1.5 gap-x-5 text-xs sm:text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 text-[10px] flex-shrink-0">
                                                        {branch.authorName ? branch.authorName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <span className="font-semibold truncate">{branch.authorName || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="text-xs">
                                                        {branch.lastCommitDate
                                                            ? format(new Date(branch.lastCommitDate), 'dd MMM yyyy • HH:mm', { locale: idLocale })
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deployment Status */}
                                        <StatusBranch
                                            branch={branch}
                                            targetBranches={targetBranches}
                                            primaryBranch={primaryBranch}
                                            fullStatus={fullStatusMap[branch.name]}
                                            isChecking={checkingMap[branch.name]}
                                            onCheckAll={() => handleCheckAll(branch.name)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Pagination ────────────────────────────────────────────── */}
            {!isLoading && data?.data?.length > 0 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl">
                        Page <span className="text-blue-600">{currentPage}</span> / <span className="text-slate-700">{totalPages}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => goToPage(1)} disabled={currentPage === 1}
                            className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 active:scale-90'}`}>
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                            className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 active:scale-90'}`}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex gap-1">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-2 py-2 text-slate-300 text-xs font-bold">…</span>
                                ) : (
                                    <button key={page} onClick={() => goToPage(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}>
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>

                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                            className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 active:scale-90'}`}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                            className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 active:scale-90'}`}>
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-blue-200 transition-all">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Go to</span>
                        <input
                            type="number" min="1" max={totalPages} value={currentPage}
                            onChange={(e) => { const p = parseInt(e.target.value); if (p >= 1 && p <= totalPages) goToPage(p); }}
                            className="w-10 bg-transparent text-center text-xs font-black text-blue-600 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Modal */}
            {showSettings && (
                <SettingsModal
                    config={null}
                    onSaveConfig={markConfigured}
                    onClearAll={handleClearAll}
                    onClose={() => setShowSettings(false)}
                    targetBranches={targetBranches}
                    onSaveTargetBranches={saveTargetBranches}
                    onResetTargetBranches={resetTargetBranches}
                />
            )}
        </div>
    );
};

export default App;