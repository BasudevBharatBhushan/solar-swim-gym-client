import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/admin.service';
import type { AdminProfile } from '../../../types/api.types';

interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const ProfilesView: React.FC = () => {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [totalResults, setTotalResults] = useState(0);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await adminService.getProfiles(searchParams);
      // Map the response to ensure name field is populated
      const mappedProfiles = (response.results || []).map((profile: any) => ({
        ...profile,
        id: profile.profile_id || profile.id,
        name: profile.name || `${profile.first_name} ${profile.last_name}`,
        is_rceb: profile.rceb_flag || profile.is_rceb || false
      }));
      setProfiles(mappedProfiles);
      setTotalResults(response.total || 0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, q: value, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleShowAll = () => {
    setSearchParams(prev => ({ ...prev, limit: 1000, page: 1 }));
  };

  const toggleProfileExpansion = (profileId: string) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return '-';
    }
  };

  const totalPages = Math.ceil(totalResults / searchParams.limit);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Member Profiles</h3>
            <p className="text-sm text-gray-500 mt-0.5">View and manage all member profiles</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm">
              {totalResults} Total Profiles
            </span>
          </div>
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
              placeholder="Search by name, email, or mobile..."
              value={searchParams.q}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm transition-shadow text-sm"
            />
          </div>

          <button
            onClick={handleShowAll}
            className="px-5 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 shadow-sm transition-all"
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
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50/50">
            <svg className="h-16 w-16 mb-4 text-gray-300 shadow-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium">No member profiles found</p>
            <p className="text-sm">Try broadening your search or check different filters</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {searchParams.sortBy === 'first_name' && (
                      <span>{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age / DOB
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
                    <span>Created</span>
                    {searchParams.sortBy === 'created_at' && (
                      <span>{searchParams.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.map((profile) => {
                const profileId = profile.profile_id || profile.id || '';
                const isExpanded = expandedProfiles.has(profileId);
                const hasAdditionalInfo = profile.case_manager_name || profile.guardian_name;

                return (
                  <React.Fragment key={profileId}>
                    {/* Main Profile Row */}
                    <tr
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => hasAdditionalInfo && toggleProfileExpansion(profileId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {hasAdditionalInfo && (
                            <svg
                              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {profile.first_name} {profile.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {profileId.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.email && (
                          <div className="text-sm text-gray-900">{profile.email}</div>
                        )}
                        {profile.mobile && (
                          <div className="text-xs text-gray-500">{profile.mobile}</div>
                        )}
                        {!profile.email && !profile.mobile && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm ${profile.role === 'HEAD' || profile.role === 'Primary'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                          : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                          }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateAge(profile.date_of_birth)} years
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(profile.date_of_birth)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md inline-flex items-center justify-center ${profile.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {profile.rceb_flag && (
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-100 text-purple-800 inline-flex items-center justify-center">
                              RCEB
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(profile.created_at)}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {isExpanded && hasAdditionalInfo && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Case Manager Info */}
                            {profile.case_manager_name && (
                              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Case Manager
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {profile.case_manager_name}
                                </div>
                                {profile.case_manager_email && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {profile.case_manager_email}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Guardian Info */}
                            {profile.guardian_name && (
                              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Guardian
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {profile.guardian_name}
                                </div>
                                {profile.guardian_phoneno && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {profile.guardian_phoneno}
                                  </div>
                                )}
                              </div>
                            )}
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
    </div>
  );
};

