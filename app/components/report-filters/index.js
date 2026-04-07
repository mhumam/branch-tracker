'use client';

import React from 'react';
import { Search, Filter, Layers, Star, User, X } from 'lucide-react';

const ReportFilters = ({ filters, onFilterChange, branchTypes, primaryBranch, authors }) => {
    const hasActiveFilters = filters.merged !== 'all' || filters.branchType !== 'all' || filters.name || filters.author;

    const handleReset = () => {
        onFilterChange({ merged: 'all', branchType: 'all', name: '', author: '' });
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Branch Name */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by branch name..."
                        value={filters.name || ''}
                        onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Primary Branch Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-200" />
                        <div>
                            <p className="text-[9px] font-black uppercase text-emerald-600 tracking-wider leading-none">Primary</p>
                            <p className="text-xs font-bold text-slate-700 leading-tight">{primaryBranch || 'master'}</p>
                        </div>
                    </div>

                    {/* Merge Status Filter */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${filters.merged !== 'all' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                        <Filter className={`w-4 h-4 flex-shrink-0 ${filters.merged !== 'all' ? 'text-indigo-600' : 'text-indigo-400'}`} />
                        <select
                            value={filters.merged || 'all'}
                            onChange={(e) => onFilterChange({ ...filters, merged: e.target.value })}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="true">✅ Merged</option>
                            <option value="false">❌ Not Merged</option>
                        </select>
                    </div>

                    {/* Branch Type Filter */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${filters.branchType !== 'all' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                        <Layers className={`w-4 h-4 flex-shrink-0 ${filters.branchType !== 'all' ? 'text-emerald-600' : 'text-emerald-500'}`} />
                        <select
                            value={filters.branchType || 'all'}
                            onChange={(e) => onFilterChange({ ...filters, branchType: e.target.value })}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            {branchTypes?.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Author Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border flex-1 sm:flex-none sm:min-w-[240px] transition-all ${filters.author ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                    <User className={`w-4 h-4 flex-shrink-0 ${filters.author ? 'text-blue-600' : 'text-slate-400'}`} />
                    <select
                        value={filters.author || ''}
                        onChange={(e) => onFilterChange({ ...filters, author: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
                    >
                        <option value="">All Authors</option>
                        {authors?.map(author => (
                            <option key={author} value={author}>{author}</option>
                        ))}
                    </select>
                </div>

                {/* Active Filters Summary + Reset */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex flex-wrap gap-1.5">
                            {filters.merged !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wide">
                                    {filters.merged === 'true' ? '✅ Merged' : '❌ Not Merged'}
                                </span>
                            )}
                            {filters.branchType !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wide">
                                    {filters.branchType}
                                </span>
                            )}
                            {filters.author && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wide">
                                    👤 {filters.author}
                                </span>
                            )}
                            {filters.name && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wide">
                                    🔍 {filters.name}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                            <X className="w-3 h-3" /> Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportFilters;
