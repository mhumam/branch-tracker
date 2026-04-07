'use client';

import React, { useState } from 'react';
import { Settings, X, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, LogOut, Layers, Plus, Trash2, RotateCcw, Star } from 'lucide-react';
import axios from 'axios';

const SettingsModal = ({ 
    config, 
    onSaveConfig, 
    onClearAll, 
    onClose, 
    targetBranches, 
    onSaveTargetBranches, 
    onResetTargetBranches 
}) => {
    const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'branches'
    
    // Credentials State
    const [formData, setFormData] = useState(config || {
        username: '',
        appPassword: '',
        workspace: '',
        repoSlug: '',
        domainApi: 'https://api.bitbucket.org'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Branches State
    const [branches, setBranches] = useState(targetBranches || []);
    const [newBranch, setNewBranch] = useState({ branchName: '', displayName: '', isPrimary: false });

    const handleConfigChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setTestStatus(null);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            // 1. Simpan ke session dulu agar server bisa baca credentials
            const saveRes = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!saveRes.ok) throw new Error('Failed to save session');

            // 2. Test koneksi — credentials dibaca server dari cookie
            const response = await axios.get('/api/branches', {
                params: { size: 1 },
            });
            if (response.data.error) throw new Error(response.data.error);
            setTestStatus('success');
        } catch (error) {
            setTestStatus('error');
            setErrorMessage(error.response?.data?.error || error.message);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSetPrimary = (index) => {
        setBranches(branches.map((b, i) => ({
            ...b,
            isPrimary: i === index
        })));
    };

    const handleAddBranch = (e) => {
        e.preventDefault();
        if (newBranch.branchName && newBranch.displayName) {
            setBranches([...branches, { ...newBranch, isPrimary: branches.length === 0 }]);
            setNewBranch({ branchName: '', displayName: '', isPrimary: false });
        }
    };

    const handleRemoveBranch = (index) => {
        let updated = branches.filter((_, i) => i !== index);
        if (updated.length > 0 && !updated.some(b => b.isPrimary)) {
            updated[0].isPrimary = true;
        }
        setBranches(updated);
    };

    const handleSave = async () => {
        if (activeTab === 'credentials') {
            // Credentials sudah tersimpan ke session saat Test Connection.
            // onSaveConfig() = markConfigured() — hanya set flag, tidak POST ke session.
            onSaveConfig();
        } else {
            onSaveTargetBranches(branches);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-lg">
                                <Settings className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Settings</h2>
                                <p className="text-slate-400 text-sm mt-1">Manage credentials and target branches</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="bg-white/10 p-2 hover:bg-white/20 rounded-xl transition-all text-slate-300">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-8 p-1 bg-white/5 rounded-2xl border border-white/5 relative z-10">
                        <button 
                            onClick={() => setActiveTab('credentials')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'credentials' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings className="w-4 h-4" /> Credentials
                        </button>
                        <button 
                            onClick={() => setActiveTab('branches')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'branches' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Layers className="w-4 h-4" /> Target Branches
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'credentials' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Username</label>
                                    <input name="username" value={formData.username} onChange={handleConfigChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-semibold text-slate-700">App Password</label>
                                    <div className="relative group">
                                        <input name="appPassword" type={showPassword ? 'text' : 'password'} value={formData.appPassword} onChange={handleConfigChange} className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Workspace</label>
                                    <input name="workspace" value={formData.workspace} onChange={handleConfigChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Repo Slug</label>
                                    <input name="repoSlug" value={formData.repoSlug} onChange={handleConfigChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">API Domain</label>
                                <input name="domainApi" value={formData.domainApi} onChange={handleConfigChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                            </div>
                            {testStatus === 'success' && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-medium">Connection successful!</div>}
                            {testStatus === 'error' && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-medium">{errorMessage}</div>}
                            <div className="flex gap-4">
                                <button onClick={handleTest} disabled={isTesting} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50">{isTesting ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Test Connection'}</button>
                                <button onClick={handleSave} className="flex-[1.5] py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-200">Save Credentials</button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {branches.map((branch, index) => (
                                    <div key={index} className={`flex items-center gap-4 p-4 border rounded-2xl group transition-all ${branch.isPrimary ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                        <button 
                                            onClick={() => handleSetPrimary(index)}
                                            className={`p-2 rounded-xl transition-all ${branch.isPrimary ? 'text-emerald-500 bg-emerald-100 shadow-sm' : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-50'}`}
                                            title="Set as primary"
                                        >
                                            <Star className={`w-4 h-4 ${branch.isPrimary ? 'fill-current' : ''}`} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 truncate">{branch.displayName}</p>
                                                {branch.isPrimary && (
                                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Primary</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-mono truncate">{branch.branchName}</p>
                                        </div>
                                        <button onClick={() => handleRemoveBranch(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddBranch} className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="Display Name" value={newBranch.displayName} onChange={(e) => setNewBranch({ ...newBranch, displayName: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="text" placeholder="Branch Name" value={newBranch.branchName} onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <button type="submit" disabled={!newBranch.branchName || !newBranch.displayName} className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">Add Branch</button>
                            </form>
                            <div className="flex gap-4">
                                <button onClick={() => setBranches([
                                    { branchName: 'staging', displayName: 'Staging', isPrimary: false }, 
                                    { branchName: 'uat', displayName: 'UAT', isPrimary: false }, 
                                    { branchName: 'testing-operation', displayName: 'Testing Operation', isPrimary: false }, 
                                    { branchName: 'master', displayName: 'Production', isPrimary: true }
                                ])} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"><RotateCcw className="w-4 h-4 inline mr-2" /> Reset Defaults</button>
                                <button onClick={handleSave} className="flex-[1.5] py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95 transition-all">Save Branches</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-8 pt-0">
                    <button onClick={() => { onClearAll(); onClose(); }} className="w-full flex items-center justify-center gap-2 py-4 text-rose-600 hover:bg-rose-50 rounded-2xl text-sm font-black transition-all border border-transparent hover:border-rose-100">
                        <LogOut className="w-4 h-4" /> Reset All and Onboard Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
