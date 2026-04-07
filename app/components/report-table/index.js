'use client';

import React from 'react';
import { User, Calendar, GitBranch, CheckCircle2, XCircle } from 'lucide-react';

const ReportTable = ({ data, targetBranches, primaryBranch, workspace, repoSlug }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-16 sm:p-24 text-center">
                <GitBranch className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-black text-slate-800">No report data found</h3>
                <p className="text-sm text-slate-400 mt-2 font-medium">Try adjusting your filters or check your repository connection.</p>
            </div>
        );
    }

    const getBitbucketUrl = (branchName) => {
        if (!workspace || !repoSlug) return '#';
        // Format: https://bitbucket.org/{workspace}/{repoSlug}/branch/{branchName}?dest={primaryBranch}
        return `https://bitbucket.org/${workspace}/${repoSlug}/branch/${encodeURIComponent(branchName)}?dest=${encodeURIComponent(primaryBranch || 'master')}`;
    };

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            <th className="px-5 sm:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</th>
                            <th className="px-5 sm:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell">Author</th>
                            <th className="px-5 sm:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Last Commit</th>
                            <th className="px-5 sm:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                                {primaryBranch || 'Primary'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((branch, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                {/* Branch Name + mobile extras */}
                                <td className="px-5 sm:px-8 py-4">
                                    <div className="flex flex-col gap-1">
                                        <a 
                                            href={getBitbucketUrl(branch.name)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-black text-slate-700 group-hover:text-indigo-600 hover:underline transition-colors break-all sm:break-normal"
                                        >
                                            {branch.name}
                                        </a>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                {branch.branchType || 'Unknown'}
                                            </span>
                                            {/* Show author on mobile */}
                                            <span className="text-[10px] font-medium text-slate-400 sm:hidden">
                                                {branch.authorName || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Author — hidden on mobile */}
                                <td className="px-5 sm:px-8 py-4 hidden sm:table-cell">
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px] flex-shrink-0">
                                            {branch.authorName?.[0] || <User className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 truncate max-w-[120px]">
                                            {branch.authorName || 'Unknown'}
                                        </span>
                                    </div>
                                </td>

                                {/* Last Commit — hidden on mobile + tablet */}
                                <td className="px-5 sm:px-8 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="text-sm font-medium">
                                            {branch.lastCommitDate
                                                ? new Date(branch.lastCommitDate).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </td>

                                {/* Merge Status */}
                                <td className="px-5 sm:px-8 py-4">
                                    <div className="flex justify-center">
                                        <div
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tight whitespace-nowrap w-fit transition-all ${
                                                branch.primaryMergeStatus === true
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                                                    : branch.primaryMergeStatus === false
                                                    ? 'bg-slate-50 border-slate-100 text-slate-400'
                                                    : 'bg-slate-50 border-slate-100 text-slate-300 italic'
                                            }`}
                                        >
                                            {branch.primaryMergeStatus === true ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            ) : branch.primaryMergeStatus === false ? (
                                                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            ) : null}
                                            {branch.primaryMergeStatus === true
                                                ? 'Merged'
                                                : branch.primaryMergeStatus === false
                                                    ? 'Not Merged'
                                                    : '—'}
                                        </div>
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
