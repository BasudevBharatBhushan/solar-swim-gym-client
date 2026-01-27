import React, { useState, useEffect } from 'react';

interface Account {
  id: string;
  account_name: string;
  primary_profile_id: string;
  primary_profile_name?: string;
  primary_profile_email?: string;
  created_at: string;
  status: string;
  total_members?: number;
}

interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const AccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [totalResults, setTotalResults] = useState(0);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // const params = new URLSearchParams({
      //   q: searchParams.q,
      //   page: searchParams.page.toString(),
      //   limit: searchParams.limit.toString(),
      //   sortBy: searchParams.sortBy,
      //   sortOrder: searchParams.sortOrder
      // });

      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/v1/admin/accounts?${params}`);
      // const data = await response.json();
      // setAccounts(data.results || []);
      // setTotalResults(data.total || 0);
      
      // For now, load empty
      setAccounts([]);
      setTotalResults(0);
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  const totalPages = Math.ceil(totalResults / searchParams.limit);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Accounts</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {totalResults} Total
            </span>
          </div>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchParams.q}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleShowAll}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Show All
          </button>
        </div>
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('account_name')}
                >
                  Account Name
                  {searchParams.sortBy === 'account_name' && (
                    <span className="ml-1">{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('primary_profile_name')}
                >
                  Primary Contact
                  {searchParams.sortBy === 'primary_profile_name' && (
                    <span className="ml-1">{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Created
                  {searchParams.sortBy === 'created_at' && (
                    <span className="ml-1">{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{account.account_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{account.primary_profile_name}</div>
                    <div className="text-sm text-gray-500">{account.primary_profile_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {account.total_members || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      account.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(account.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {searchParams.page} of {totalPages} ({totalResults} total results)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSearchParams(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={searchParams.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setSearchParams(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={searchParams.page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal Placeholder */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
            <p className="text-sm text-gray-500 mb-4">This functionality will be implemented later.</p>
            <button
              onClick={() => setShowAddClientModal(false)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
