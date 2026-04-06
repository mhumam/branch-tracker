'use client';

import React from 'react';
import { Search, Filter, Layers } from 'lucide-react';

const ReportFilters = ({ filters, onFilterChange, targetBranches, branchTypes }) => {
    return (
        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 mb-8 items-center flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative w-full lg:w-auto">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by branch name..."
                    value={filters.name || ''}
                    onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
                    className="w-full pl-16 pr-6 py-4 bg-slate-50 border-0 rounded-[28px] text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[28px] transition-all focus-within:ring-4 focus-within:ring-blue-100">
                    <Layers className="w-5 h-5 text-blue-500" />
                    <select
                        value={filters.targetBranch || ''}
                        onChange={(e) => onFilterChange({ ...filters, targetBranch: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        {targetBranches.map(branch => (
                            <option key={branch.branchName} value={branch.branchName}>{branch.displayName}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[28px] transition-all focus-within:ring-4 focus-within:ring-blue-100">
                    <Filter className="w-5 h-5 text-indigo-500" />
                    <select
                        value={filters.merged || 'all'}
                        onChange={(e) => onFilterChange({ ...filters, merged: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="all">Status: All</option>
                        <option value="true">Already Merged</option>
                        <option value="false">Not Merged</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[28px] transition-all focus-within:ring-4 focus-within:ring-blue-100">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    <select
                        value={filters.branchType || 'all'}
                        onChange={(e) => onFilterChange({ ...filters, branchType: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="all">Type: All</option>
                        {branchTypes?.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ReportFilters;
