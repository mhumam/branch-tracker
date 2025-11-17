import { useState } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Search } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import axios from "axios";
import { useDebounce } from "@/app/hooks";

const getTypeColor = (type) => {
    const colors = {
        feature: 'bg-blue-100 text-blue-800',
        bugfix: 'bg-yellow-100 text-yellow-800',
        hotfix: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
};

const mainBranchList = [
    { name: 'Staging', branchName: 'staging'},
    { name: 'UAT', branchName: 'uat'},
    { name: 'Testing Operation', branchName: 'testing-operation'},
    { name: 'Production', branchName: 'master'}
];

const getProgressPercentage = (branch) => {
    let progress = 0;
    if (branch?.staging) progress += 25;
    if (branch?.uat) progress += 25;
    if (branch?.['testing-operation']) progress += 25;
    if (branch?.master) progress += 25;
    
    return progress;
};

const getStatusIcon = (status) => {
    if (status) {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-gray-300" />;
};


const StatusBranch = ({ branch }) => {
    return (
        <>
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(branch?.mergeStatus)}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {
                    mainBranchList?.map((obj, key) => {
                        console.log('branch?.mergeStatus', branch?.mergeStatus)
                        return (
                            <div key={key} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                {getStatusIcon(branch?.mergeStatus?.[obj?.branchName])}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-700">{obj?.name}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}

const App = () => {
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const debouncedFilter = useDebounce(searchTerm, 500);
    const { isLoading, data } = useQuery({
        queryKey: ['branchesData', debouncedFilter, currentPage, itemsPerPage, filterType],
        queryFn: () => {
            const branchTypeFilter = filterType !== 'All' ? `&branchType=${filterType}` : '';

            return axios.get(`/api/branches?name=${debouncedFilter}&page=${currentPage}&size=${itemsPerPage}${branchTypeFilter}`).then((res) => res.data)
        },
        refetchOnWindowFocus: false
    });
    
    const { data: branchTypeList } = useQuery({
        queryKey: ['branchTypeList'],
        queryFn: () => axios.get('/api/branches/constant/getBranchType').then((res) => res.data),
        refetchOnWindowFocus: false
    });

    // Pagination calculations
    const totalPages = data?.totalPages;
    const startIndex = (currentPage - 1) * itemsPerPage;

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };
    
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = data?.pageLimit;
        const currentPage = data?.currentPage;
        
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
        <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search branch"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Type */}
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {
                            ['All', ...branchTypeList?.data ?? []]?.map((value, key) => {
                                return <option key={key} value={value}>{value}</option>
                            })
                        }
                    </select>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                    </select>
                </div>
            </div>
            <div className="space-y-4 mb-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : data?.data?.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <p className="text-gray-500 text-lg">No branches found</p>
                    </div>
                ) : (
                    <>
                        {/* Results Info */}
                        <div className="mb-4 text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, data?.totalData)} of {data?.totalData} branches
                        </div>
                        {
                            data?.data?.map((branch, key) => (
                                <div key={key} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        {/* Branch Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">{branch?.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(branch?.branchType)}`}>
                                                        {branch?.branchType}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Author:</span> {branch.authorName} • 
                                                    <span className="ml-2"><Clock className="inline w-4 h-4 mb-1" /> {branch.lastCommitDate ? format(new Date(branch.lastCommitDate), 'EEEE, dd/MM/yyyy - HH.mm', { locale: idLocale }) : '-'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deployment Status */}
                                        <StatusBranch branch={branch} />
                                    </div>
                                </div>
                            ))
                        }
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && data?.data?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Page Info */}
                        <div className="text-sm text-gray-600">
                            Page  {currentPage} of {totalPages}
                        </div>

                        {/* Pagination Buttons */}
                        <div className="flex items-center gap-2">
                            {/* First Page */}
                            <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100' }`}
                            >
                                <ChevronsLeft className="w-5 h-5" />
                            </button>

                            {/* Previous Page */}
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100' }`}
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
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page? 'bg-blue-600 text-white': 'text-gray-700 hover:bg-gray-100'}`}
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
                                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100' }`}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Last Page */}
                            <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Jump */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Go to page:</span>
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
        </>
    )
};

export default App;