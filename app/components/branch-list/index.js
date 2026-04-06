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

const getTypeColor = (type) => {
    const colors = {
        feature: 'bg-blue-100 text-blue-800',
        bugfix: 'bg-yellow-100 text-yellow-800',
        hotfix: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
};

const StatusChip = ({ name, merged, isLoading }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
        isLoading ? 'bg-slate-50 border-slate-100 animate-pulse' :
        merged ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-50' : 
        'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
    }`}>
        {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
        ) : (
            merged ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />
        )}
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider truncate">{name}</p>
        </div>
    </div>
);

const StatusBranch = ({ branch, targetBranches, primaryBranch, fullStatus, isChecking, onCheckAll }) => {
    // Mode B: Full Status (Loaded on demand)
    if (fullStatus || isChecking) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 group/status hover:bg-white hover:border-blue-100 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${branch.primaryMergeStatus ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {branch.primaryMergeStatus ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {primaryInfo.displayName}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</span>
                    <span className="text-xs font-bold text-slate-600">
                        {branch.primaryMergeStatus ? 'Already Merged' : 'Not Merged Yet'}
                    </span>
                </div>
            </div>

            <button 
                onClick={onCheckAll}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
            >
                Check {targetBranches.length} Environments <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

const App = () => {
    // Hooks
    const { config, isConfigured, save: saveConfig, clear: clearConfig, getHeaders } = useBitbucketConfig();
    const { targetBranches, primaryBranch, save: saveTargetBranches, resetToDefault: resetTargetBranches, clear: clearTargetBranches } = useTargetBranches();

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showSettings, setShowSettings] = useState(false);

    // Lazy load state
    const [fullStatusMap, setFullStatusMap] = useState({});
    const [checkingMap, setCheckingMap] = useState({});

    const handleClearAll = () => {
        clearConfig();
        clearTargetBranches();
        window.location.reload();
    };

    const handleCheckAll = async (branchName) => {
        setCheckingMap(prev => ({ ...prev, [branchName]: true }));
        try {
            const params = new URLSearchParams({ from: branchName });
            targetBranches.forEach(t => params.append('to', t.branchName));
            
            const res = await axios.get(`/api/branches/merge-status?${params.toString()}`, { 
                headers: getHeaders() 
            });
            
            setFullStatusMap(prev => ({ ...prev, [branchName]: res.data.mergeStatus }));
        } catch (err) {
            console.error('Failed to check all statuses', err);
        } finally {
            setCheckingMap(prev => ({ ...prev, [branchName]: false }));
        }
    };

    const debouncedFilter = useDebounce(searchTerm, 500);

    const { isLoading, data, isError, error } = useQuery({
        queryKey: ['branchesData', debouncedFilter, currentPage, itemsPerPage, filterType, primaryBranch, config],
        queryFn: async () => {
            const branchTypeFilter = filterType !== 'All' ? `&branchType=${filterType}` : '';
            
            try {
                const res = await axios.get(
                    `/api/branches?name=${debouncedFilter}&page=${currentPage}&size=${itemsPerPage}${branchTypeFilter}&primaryBranch=${primaryBranch}`,
                    { headers: getHeaders() }
                );
                return res.data;
            } catch (err) {
                if (err.response?.status === 401) {
                    // Logic to handle unauthorized if necessary, 
                    // though page guard should prevent this
                }
                throw err;
            }
        },
        refetchOnWindowFocus: false,
        retry: false
    });
    
    const { data: branchTypeList } = useQuery({
        queryKey: ['branchTypeList', config],
        queryFn: () => axios.get('/api/branches/constant/getBranchType', { headers: getHeaders() }).then((res) => res.data),
        refetchOnWindowFocus: false,
        retry: false
    });

    // Pagination calculations
    const totalPages = data?.totalPages || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };
    
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = data?.pageLimit || 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <div className="flex flex-1 gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search branches..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-white border-0 shadow-sm rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Filter Type */}
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-3 bg-white border-0 shadow-sm rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-medium text-gray-700"
                    >
                        {
                            ['All', ...branchTypeList?.data ?? []]?.map((value, key) => {
                                return <option key={key} value={value}>{value}</option>
                            })
                        }
                    </select>
                </div>

                <div className="flex gap-3">
                    <Link href="/report">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white shadow-sm hover:shadow-md rounded-2xl font-bold text-gray-700 transition-all active:scale-95 border border-transparent hover:border-indigo-100">
                            <BarChart4 className="w-5 h-5 text-indigo-500" />
                            View Report
                        </button>
                    </Link>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className={`flex items-center gap-2 px-6 py-3 shadow-sm hover:shadow-md rounded-2xl font-bold transition-all active:scale-95 ${isConfigured ? 'bg-white text-gray-700' : 'bg-blue-600 text-white shadow-blue-200'}`}
                    >
                        <Settings className={`w-5 h-5 ${isConfigured ? 'text-blue-500' : 'text-white'}`} />
                        Settings
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-4 bg-white/50 rounded-3xl">
                        <div className="relative">
                            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 bg-blue-600/20 blur-xl animate-pulse"></div>
                        </div>
                        <p className="font-bold text-slate-500 animate-pulse">Syncing with Bitbucket...</p>
                    </div>
                ) : isError ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-[40px] p-24 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <h3 className="text-2xl font-black text-rose-900 mb-2">Sync Failed</h3>
                        <p className="text-rose-600 font-medium max-w-sm mx-auto mb-8">
                            {error?.response?.data?.error || "We couldn&apos;t connect to Bitbucket. Your credentials might be invalid or the repository is inaccessible."}
                        </p>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-200"
                        >
                            Update Settings
                        </button>
                    </div>
                ) : data?.data?.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm p-24 text-center border border-dashed border-gray-200">
                        <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">No branches found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">We couldn&apos;t find any branches matching your search or filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Header */}
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, data?.totalData)} of {data?.totalData} branches
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per Page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-0 text-sm font-bold text-blue-600 outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {
                                data?.data?.map((branch, key) => (
                                    <div key={key} className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100 group">
                                        <div className="p-8">
                                            {/* Branch Header */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getTypeColor(branch?.branchType)}`}>
                                                            {branch?.branchType || 'Unknown'}
                                                        </span>
                                                        <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                                            {branch?.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                                                                {branch.authorName ? branch.authorName.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="font-bold">{branch.authorName || 'Unknown Author'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                                                            <Clock className="w-4 h-4" />
                                                            {branch.lastCommitDate ? format(new Date(branch.lastCommitDate), 'EEEE, dd MMM yyyy • HH:mm', { locale: idLocale }) : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                    <ChevronRight className="w-6 h-6" />
                                                </button> */}
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
                                ))
                            }
                        </div>
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && data?.data?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Page Info */}
                    <div className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                        Page <span className="text-blue-600">{currentPage}</span> of <span className="text-slate-800">{totalPages}</span>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            className={`p-3 rounded-2xl transition-all ${currentPage === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600 active:scale-90' }`}
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-3 rounded-2xl transition-all ${currentPage === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600 active:scale-90' }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-4 py-3 text-gray-300 font-bold">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`w-12 h-12 rounded-2xl font-black transition-all ${currentPage === page? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110': 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-3 rounded-2xl transition-all ${currentPage === totalPages ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600 active:scale-90' }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`p-3 rounded-2xl transition-all ${currentPage === totalPages ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600 active:scale-90'}`}
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Jump */}
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-transparent focus-within:border-blue-200 transition-all">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Jump To</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                                const page = parseInt(e.target.value);
                                if (page >= 1 && page <= totalPages) {
                                    goToPage(page);
                                }
                            }}
                            className="w-12 bg-transparent text-center font-black text-blue-600 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {showSettings && (
                <SettingsModal 
                    config={config} 
                    onSaveConfig={saveConfig} 
                    onClearAll={handleClearAll} 
                    onClose={() => setShowSettings(false)} 
                    targetBranches={targetBranches}
                    onSaveTargetBranches={saveTargetBranches}
                    onResetTargetBranches={resetTargetBranches}
                />
            )}
        </div>
    )
};

export default App;