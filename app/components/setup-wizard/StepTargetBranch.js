'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2, RotateCcw, ChevronRight, Star } from 'lucide-react';

const StepTargetBranch = ({ onComplete }) => {
    const DEFAULT_BRANCHES = [
        { branchName: 'staging', displayName: 'Staging', isPrimary: false },
        { branchName: 'uat', displayName: 'UAT', isPrimary: false },
        { branchName: 'testing-operation', displayName: 'Testing Operation', isPrimary: false },
        { branchName: 'master', displayName: 'Production', isPrimary: true },
    ];

    const [branches, setBranches] = useState(DEFAULT_BRANCHES);
    const [newBranch, setNewBranch] = useState({ branchName: '', displayName: '', isPrimary: false });

    const handleSetPrimary = (index) => {
        setBranches(branches.map((b, i) => ({
            ...b,
            isPrimary: i === index
        })));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (newBranch.branchName && newBranch.displayName) {
            setBranches([...branches, { ...newBranch, isPrimary: branches.length === 0 }]);
            setNewBranch({ branchName: '', displayName: '', isPrimary: false });
        }
    };

    const handleRemove = (index) => {
        let updated = branches.filter((_, i) => i !== index);
        if (updated.length > 0 && !updated.some(b => b.isPrimary)) {
            updated[0].isPrimary = true;
        }
        setBranches(updated);
    };

    const handleReset = () => {
        setBranches(DEFAULT_BRANCHES);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-lg">
                        <Layers className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Step 2: Target Branches</h2>
                        <p className="text-emerald-300 text-sm mt-1">Select branches you want to track</p>
                    </div>
                </div>
            </div>

            <div className="p-2 space-y-6">
                <div className="space-y-3">
                    {branches.map((branch, index) => (
                        <div key={index} className={`flex items-center gap-4 p-4 border rounded-2xl group animate-in slide-in-from-left-4 fade-in duration-300 ${branch.isPrimary ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`} style={{ animationDelay: `${index * 50}ms` }}>
                            <button 
                                onClick={() => handleSetPrimary(index)}
                                className={`p-2 rounded-xl transition-all ${branch.isPrimary ? 'text-emerald-500 bg-emerald-100' : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-50'}`}
                                title="Set as primary"
                            >
                                <Star className={`w-5 h-5 ${branch.isPrimary ? 'fill-current' : ''}`} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 truncate">{branch.displayName}</p>
                                    {branch.isPrimary && (
                                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Primary</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 truncate font-mono">{branch.branchName}</p>
                            </div>
                            <button 
                                onClick={() => handleRemove(index)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    
                    {branches.length === 0 && (
                        <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-medium">No target branches specified.</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Display Label"
                            value={newBranch.displayName}
                            onChange={(e) => setNewBranch({ ...newBranch, displayName: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Branch Name"
                            value={newBranch.branchName}
                            onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newBranch.branchName || !newBranch.displayName}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" /> Add Branch
                    </button>
                </form>

                <div className="flex gap-4 items-center pt-2">
                    <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <RotateCcw className="w-5 h-5" /> Reset to Defaults
                    </button>
                    <button
                        onClick={() => onComplete(branches)}
                        disabled={branches.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                    >
                        Finish Setup <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepTargetBranch;
