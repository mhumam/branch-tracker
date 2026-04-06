'use client';

import React from 'react';
import { Layers, CheckCircle2, XCircle, PieChart } from 'lucide-react';

const ReportSummary = ({ summary, targetBranch }) => {
    if (!summary) return null;
    
    const { total, merged, notMerged } = summary;
    const mergeRate = total > 0 ? (merged / total) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-600 transition-colors">
                        <Layers className="w-6 h-6 text-blue-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Branches</span>
                </div>
                <h3 className="text-3xl font-black text-slate-800">{total}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-600 transition-colors">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Merged to {targetBranch}</span>
                </div>
                <h3 className="text-3xl font-black text-emerald-600">{merged}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-rose-50 p-3 rounded-2xl group-hover:bg-rose-600 transition-colors">
                        <XCircle className="w-6 h-6 text-rose-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Not Merged</span>
                </div>
                <h3 className="text-3xl font-black text-rose-600">{notMerged}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-600 transition-colors">
                        <PieChart className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Merge Rate</span>
                </div>
                <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-black text-slate-800">{mergeRate.toFixed(1)}%</h3>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full mb-2 overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${mergeRate}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportSummary;
