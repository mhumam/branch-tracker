'use client';

import React, { useState, useEffect } from 'react';
import { Search, GitBranch, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const BranchTracker = () => {
    const [branches, setBranches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(false);
  
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Simulasi data branch dengan lebih banyak data
    const generateMockBranches = () => {
        const types = ['feature', 'bugfix', 'hotfix'];
        const authors = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'David Brown', 'Emily Chen', 'Robert Garcia', 'Lisa Anderson'];
        const branches = [];

        for (let i = 1; i <= 150; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const stagingMerged = Math.random() > 0.2;
            const uatMerged = stagingMerged && Math.random() > 0.3;
            const masterMerged = uatMerged && Math.random() > 0.5;

            branches.push({
                id: i,
                name: `${type}/${type === 'feature' ? 'feat' : type === 'bugfix' ? 'fix' : 'hf'}-${i}-description-branch`,
                type: type,
                author: authors[Math.floor(Math.random() * authors.length)],
                createdDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                staging: {
                    merged: stagingMerged,
                    date: stagingMerged ? `2024-11-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}` : null,
                    pr: stagingMerged ? `#${1000 + i}` : null
                },
                uat: {
                    merged: uatMerged,
                    date: uatMerged ? `2024-11-${String(Math.floor(Math.random() * 10) + 5).padStart(2, '0')}` : null,
                    pr: uatMerged ? `#${2000 + i}` : null
                },
                master: {
                    merged: masterMerged,
                    date: masterMerged ? `2024-11-${String(Math.floor(Math.random() * 5) + 8).padStart(2, '0')}` : null,
                    pr: masterMerged ? `#${3000 + i}` : null
                }
            });
        }
        return branches;
    };

    const loadBranches = () => {
        setLoading(true);
        setTimeout(() => {
            setBranches(generateMockBranches());
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const getStatusIcon = (status) => {
        if (status.merged) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <XCircle className="w-5 h-5 text-gray-300" />;
    };

    const getTypeColor = (type) => {
        const colors = {
            feature: 'bg-blue-100 text-blue-800',
            bugfix: 'bg-yellow-100 text-yellow-800',
            hotfix: 'bg-red-100 text-red-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getProgressPercentage = (branch) => {
        let progress = 0;
        if (branch.staging.merged) progress += 33.33;
        if (branch.uat.merged) progress += 33.33;
        if (branch.master.merged) progress += 33.34;
        return progress;
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || branch.type === filterType;
        return matchesSearch && matchesFilter;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBranches = filteredBranches.slice(startIndex, endIndex);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType]);

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
    
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <GitBranch className="w-8 h-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-800">BranchTracker</h1>
                        </div>
                        <button
                            onClick={loadBranches}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
                        </button>
                    </div>
                    <p className="text-gray-600">Track status merge branch ke Staging, UAT, dan Production</p>
                </div>
        
                {/* Summary Stats */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-gray-600 text-sm mb-1">Total Branches</p>
                        <p className="text-3xl font-bold text-gray-800">{filteredBranches.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-gray-600 text-sm mb-1">In Staging</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {filteredBranches.filter(b => b.staging.merged && !b.uat.merged).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-gray-600 text-sm mb-1">In UAT</p>
                        <p className="text-3xl font-bold text-amber-600">
                            {filteredBranches.filter(b => b.uat.merged && !b.master.merged).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-gray-600 text-sm mb-1">In Production</p>
                        <p className="text-3xl font-bold text-green-600">
                            {filteredBranches.filter(b => b.master.merged).length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari branch atau author..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex gap-2">
                            {['all', 'feature', 'bugfix', 'hotfix'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Items per page */}
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={10}>10 per halaman</option>
                            <option value={25}>25 per halaman</option>
                            <option value={50}>50 per halaman</option>
                            <option value={100}>100 per halaman</option>
                        </select>
                    </div>
                </div>

                {/* Results Info */}
                <div className="mb-4 text-sm text-gray-600">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredBranches.length)} dari {filteredBranches.length} branch
                </div>

                {/* Branch List */}
                <div className="space-y-4 mb-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : currentBranches.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-gray-500 text-lg">Tidak ada branch yang ditemukan</p>
                        </div>
                    ) : (
                        currentBranches.map(branch => (
                            <div key={branch.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    {/* Branch Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">{branch.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(branch.type)}`}>
                                                    {branch.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Author:</span> {branch.author} • 
                                                <span className="ml-2"><Clock className="inline w-4 h-4 mb-1" /> {branch.createdDate}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${getProgressPercentage(branch)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Deployment Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Staging */}
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                            {getStatusIcon(branch.staging)}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-700">Staging</p>
                                                {branch.staging.merged ? (
                                                    <p className="text-xs text-gray-600">
                                                        {branch.staging.date} • {branch.staging.pr}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Belum merge</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* UAT */}
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                                            {getStatusIcon(branch.uat)}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-700">UAT</p>
                                                {branch.uat.merged ? (
                                                    <p className="text-xs text-gray-600">
                                                        {branch.uat.date} • {branch.uat.pr}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Belum merge</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Master/Production */}
                                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                            {getStatusIcon(branch.master)}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-700">Production</p>
                                                {branch.master.merged ? (
                                                    <p className="text-xs text-gray-600">
                                                        {branch.master.date} • {branch.master.pr}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Belum merge</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && filteredBranches.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Page Info */}
                            <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
                                {/* First Page */}
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                                >
                                    <ChevronsLeft className="w-5 h-5" />
                                </button>

                                {/* Previous Page */}
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                        ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {/* Next Page */}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Last Page */}
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                                >
                                    <ChevronsRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quick Jump */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Ke halaman:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const page = parseInt(e.target.value);
                                        if (page >= 1 && page <= totalPages) {
                                            goToPage(page);
                                        }
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchTracker;