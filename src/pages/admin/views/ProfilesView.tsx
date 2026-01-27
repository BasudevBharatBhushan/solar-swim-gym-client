import React, { useState, useEffect } from 'react';

// Types matching the API response structure roughly
interface Profile {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  dob: string;
  role: 'Primary' | 'Member';
  isRceb: boolean;
  
  plan?: string;
  services?: string[];
  paymentTenure?: string;
  expiryDate?: string;
  
  // Hierarchical data
  children?: Profile[];
}

interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ProfileRow: React.FC<{ profile: Profile; level: number }> = ({ profile, level }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = profile.children && profile.children.length > 0;

  return (
    <React.Fragment>
      <div 
        className={`
           group flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors
           ${level === 0 ? 'bg-white' : 'bg-gray-50/50'}
        `}
        style={{ paddingLeft: `${level * 2 + 1}rem` }}
      >
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
            
          {/* Name & Toggle */}
          <div className="col-span-3 flex items-center space-x-2">
            {hasChildren ? (
               <button 
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors focus:outline-none"
               >
                 {expanded ? <ChevronDown /> : <ChevronRight />}
               </button>
            ) : (
                <div className="w-6" /> // spacer
            )}
            
            <div className={`
                h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${profile.role === 'Primary' ? 'bg-brand-primary' : 'bg-orange-400'}
            `}>
                {profile.role === 'Primary' ? <UserGroupIcon /> : <UserIcon />}
            </div>

            <div>
                 <div className="text-sm font-semibold text-gray-900">{profile.name}</div>
                 <div className="text-xs text-gray-500">{profile.role}</div>
            </div>
          </div>

          {/* Details */}
          <div className="col-span-3 text-sm text-gray-600">
             {profile.email && <div className="truncate">{profile.email}</div>}
             {profile.mobile && <div className="text-xs">{profile.mobile}</div>}
          </div>

          <div className="col-span-2 text-sm text-gray-600">
             <div>Category: <span className="font-medium text-gray-900">{profile.plan || '-'}</span></div>
             <div className="text-xs">Expires: {profile.expiryDate || '-'}</div>
          </div>

           <div className="col-span-2 text-sm text-gray-600">
             <div className="flex flex-wrap gap-1">
                 {profile.services?.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                        {s}
                    </span>
                 ))}
             </div>
          </div>

          <div className="col-span-2 flex justify-end">
                {profile.isRceb && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        RCEB Client
                    </span>
                )}
          </div>

        </div>
      </div>
      
      {expanded && hasChildren && profile.children?.map(child => (
         <ProfileRow key={child.id} profile={child} level={level + 1} />
      ))}
    </React.Fragment>
  );
};

export const ProfilesView: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
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
      // const params = new URLSearchParams({
      //   q: searchParams.q,
      //   page: searchParams.page.toString(),
      //   limit: searchParams.limit.toString(),
      //   sortBy: searchParams.sortBy,
      //   sortOrder: searchParams.sortOrder
      // });

      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/v1/admin/profiles?${params}`);
      // const data = await response.json();
      // setProfiles(data.results || []);
      // setTotalResults(data.total || 0);

      // For now, load empty
      setProfiles([]);
      setTotalResults(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
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

  const handleShowAll = () => {
    setSearchParams(prev => ({ ...prev, limit: 1000, page: 1 }));
  };

  const totalPages = Math.ceil(totalResults / searchParams.limit);

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h3 className="text-lg font-medium text-gray-900">Member Profiles</h3>
                <p className="text-sm text-gray-500">Manage family hierarchies and enrollments</p>
             </div>
             <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
               {totalResults} Total Profiles
             </span>
          </div>

          {/* Search and Filters */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search profiles..."
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

       <div className="flex-1 overflow-auto">
          {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             </div>
          ) : profiles.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <svg className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               <p className="text-lg font-medium">No profiles found</p>
               <p className="text-sm">Search to find members or check back later</p>
             </div>
          ) : (
             profiles.map(profile => (
                <ProfileRow key={profile.id} profile={profile} level={0} />
             ))
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
    </div>
  );
};

