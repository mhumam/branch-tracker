'use client';

import React from 'react';
import { Layers, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, valueColor, children }) => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-3">
            <div className={`${iconBg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
        </div>
        {children || <p className={`text-2xl sm:text-3xl font-black ${valueColor || 'text-slate-800'}`}>{value}</p>}
    </div>
);

const ReportSummary = ({ summary, targetBranch }) => {
    if (!summary) return null;

    const { total, merged, notMerged } = summary;
    const mergeRate = total > 0 ? (merged / total) * 100 : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
                icon={Layers}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Total Branches"
                value={total}
            />

            <StatCard
                icon={CheckCircle2}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label={`Merged to ${targetBranch}`}
                value={merged}
                valueColor="text-emerald-600"
            />

            <StatCard
                icon={XCircle}
                iconBg="bg-rose-50"
                iconColor="text-rose-500"
                label="Not Merged"
                value={notMerged}
                valueColor="text-rose-600"
            />

            <StatCard
                icon={TrendingUp}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
                label="Merge Rate"
            >
                <div className="flex items-end gap-2 mt-1">
                    <p className="text-2xl sm:text-3xl font-black text-slate-800">{mergeRate.toFixed(1)}%</p>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${mergeRate}%` }}
                        />
                    </div>
                </div>
            </StatCard>
        </div>
    );
};

export default ReportSummary;
