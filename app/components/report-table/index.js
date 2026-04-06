'use client';

import React from 'react';
import { User, Calendar, GitBranch, CheckCircle2, XCircle } from 'lucide-react';

const ReportTable = ({ data, targetBranches }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 text-center mt-8">
                <GitBranch className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-800">No report data found</h3>
                <p className="text-slate-400 mt-2 font-medium">Try adjusting your filters or check your repository connection.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden mt-8 transition-all hover:shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Branch Name</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Author</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Last Commit</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((branch, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">{branch.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                {branch.branchType || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                            {branch.authorName?.[0] || <User className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 truncate max-w-[150px]">{branch.authorName || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {branch.lastCommitDate ? new Date(branch.lastCommitDate).toLocaleDateString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {targetBranches.map((target, tIdx) => (
                                            <div 
                                                key={tIdx} 
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                                                    branch.mergeStatus?.[target.branchName] 
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm' 
                                                        : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60 grayscale'
                                                }`}
                                            >
                                                {branch.mergeStatus?.[target.branchName] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {target.displayName}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportTable;
