import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/admin.service';
import type { AdminAccount } from '../../../types/api.types';

interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const AccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [totalResults, setTotalResults] = useState(0);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAccounts(searchParams);
      setAccounts(response.results || []);
      setTotalResults(response.total || 0);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, q: value, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleShowAll = () => {
    setSearchParams(prev => ({ ...prev, limit: 1000, page: 1 }));
  };

  const toggleAccountExpansion = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const getHeadMember = (account: AdminAccount) => {
    if (account.profiles && account.profiles.length > 0) {
      const headMember = account.profiles.find(p => p.headmember);
      if (headMember) {
        return `${headMember.first_name} ${headMember.last_name}`;
      }
    }
    return account.primary_profile_name || account.account_name || 'Unknown';
  };

  const getFamilyMembers = (account: AdminAccount) => {
    if (account.profiles && account.profiles.length > 0) {
      return account.profiles.filter(p => !p.headmember);
    }
    return [];
  };

  const totalPages = Math.ceil(totalResults / searchParams.limit);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Accounts Management</h3>
            <p className="text-sm text-gray-500 mt-0.5">View and manage family accounts</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
              {totalResults} Total Accounts
            </span>
          </div>
        </div>
        <a
          href="/admin/add-client"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Client
        </a>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by account name, email, or member name..."
            value={searchParams.q}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-shadow text-sm"
          />
        </div>
        <button
          onClick={handleShowAll}
          className="px-5 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-all"
        >
          Show All
        </button>
      </div>


      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium">No accounts found</p>
            <p className="text-sm">Get started by adding a new client</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('account_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Head Member</span>
                    {searchParams.sortBy === 'account_name' && (
                      <span>{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('primary_profile_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Primary Contact</span>
                    {searchParams.sortBy === 'primary_profile_name' && (
                      <span>{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created Date</span>
                    {searchParams.sortBy === 'created_at' && (
                      <span>{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => {
                const accountId = account.account_id || account.id;
                const isExpanded = expandedAccounts.has(accountId);
                const familyMembers = getFamilyMembers(account);
                const headMemberName = getHeadMember(account);

                return (
                  <React.Fragment key={accountId}>
                    {/* Main Account Row */}
                    <tr
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => toggleAccountExpansion(accountId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <svg
                            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{headMemberName}</div>
                            <div className="text-xs text-gray-500">{account.email || account.primary_profile_email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account.primary_profile_name || headMemberName}</div>
                        <div className="text-sm text-gray-500">{account.primary_profile_email || account.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                          <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {account.profiles?.length || account.total_members || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full shadow-sm ${account.status === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>

                    {/* Expanded Family Members Rows */}
                    {isExpanded && familyMembers.length > 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                              Family Members ({familyMembers.length})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {familyMembers.map((member) => (
                                <div
                                  key={member.profile_id}
                                  className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {member.first_name} {member.last_name}
                                      </div>
                                      {member.email && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {member.email}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-400 mt-1">
                                        ID: {member.profile_id.substring(0, 8)}...
                                      </div>
                                    </div>
                                    <svg
                                      className="h-5 w-5 text-blue-400 flex-shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* No Family Members Message */}
                    {isExpanded && familyMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-3 bg-gray-50">
                          <div className="text-sm text-gray-500 text-center italic">
                            No additional family members
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between shadow-xs">
        <div className="text-sm text-gray-700 font-medium">
          Showing <span className="text-gray-900">{(searchParams.page - 1) * searchParams.limit + 1}</span> to <span className="text-gray-900">{Math.min(searchParams.page * searchParams.limit, totalResults)}</span> of <span className="text-gray-900">{totalResults}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSearchParams(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={searchParams.page === 1 || loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center space-x-1 px-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setSearchParams(prev => ({ ...prev, page: pageNum }))}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all ${searchParams.page === pageNum
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-gray-400">...</span>}
          </div>

          <button
            onClick={() => setSearchParams(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={searchParams.page === totalPages || totalPages === 0 || loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            Next
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div >
  );
};
