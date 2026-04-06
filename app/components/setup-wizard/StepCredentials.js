'use client';

import React, { useState } from 'react';
import { Settings, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import axios from 'axios';

const StepCredentials = ({ config, onNext }) => {
    const [formData, setFormData] = useState(config || {
        username: '',
        appPassword: '',
        workspace: '',
        repoSlug: '',
        domainApi: 'https://api.bitbucket.org'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null); // 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setTestStatus(null);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const response = await axios.get('/api/branches', {
                params: { size: 1 },
                headers: {
                    'x-bb-username': formData.username,
                    'x-bb-password': formData.appPassword,
                    'x-bb-workspace': formData.workspace,
                    'x-bb-repo-slug': formData.repoSlug,
                    'x-bb-domain': formData.domainApi
                }
            });
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            setTestStatus('success');
        } catch (error) {
            setTestStatus('error');
            setErrorMessage(error.response?.data?.error || error.message);
        } finally {
            setIsTesting(false);
        }
    };

    const isComplete = formData.username && formData.appPassword && formData.workspace && formData.repoSlug;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-lg">
                        <Key className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Step 1: Bitbucket Access</h2>
                        <p className="text-slate-400 text-sm mt-1">Provide your credentials and test the connection</p>
                    </div>
                </div>
            </div>

            <div className="p-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="bitbucket-username"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-slate-700 ml-1">App Password</label>
                        <div className="relative group">
                            <input
                                name="appPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.appPassword}
                                onChange={handleChange}
                                placeholder="••••••••••••••••"
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Workspace</label>
                        <input
                            name="workspace"
                            value={formData.workspace}
                            onChange={handleChange}
                            placeholder="workspace-slug"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Repo Slug</label>
                        <input
                            name="repoSlug"
                            value={formData.repoSlug}
                            onChange={handleChange}
                            placeholder="repository-name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {testStatus === 'success' && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-700 border border-emerald-100 animate-in zoom-in-95 duration-300">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">Connection verified!</p>
                    </div>
                )}

                {testStatus === 'error' && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl text-rose-700 border border-rose-100 animate-in zoom-in-95 duration-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{errorMessage}</p>
                    </div>
                )}

                <div className="flex gap-4 items-center">
                    <button
                        onClick={handleTest}
                        disabled={isTesting || !isComplete}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isTesting ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            'Test Connection'
                        )}
                    </button>
                    <button
                        onClick={() => onNext(formData)}
                        disabled={testStatus !== 'success'}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                    >
                        Continue to Step 2
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepCredentials;
