'use client';

import React from 'react';
import { Search, Filter, Layers, Star } from 'lucide-react';

const ReportFilters = ({ filters, onFilterChange, targetBranches, branchTypes, primaryBranch }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
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

                    {/* Merged Status */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <Filter className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <select
                            value={filters.merged || 'all'}
                            onChange={(e) => onFilterChange({ ...filters, merged: e.target.value })}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="true">Merged</option>
                            <option value="false">Not Merged</option>
                        </select>
                    </div>

                    {/* Branch Type */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <Layers className="w-4 h-4 text-emerald-500 flex-shrink-0" />
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
        </div>
    );
};

export default ReportFilters;
