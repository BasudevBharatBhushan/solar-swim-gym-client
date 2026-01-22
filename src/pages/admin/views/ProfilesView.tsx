import React, { useState } from 'react';

type Profile = {
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
  
  children?: Profile[];
};

const DUMMY_PROFILES: Profile[] = [
  {
    id: 'h1',
    name: 'Robert Fox',
    email: 'robert.fox@example.com',
    mobile: '(201) 555-0123',
    dob: '1980-03-10',
    role: 'Primary',
    isRceb: false,
    plan: 'Individual',
    services: ['Gym Access', 'Pool'],
    paymentTenure: '12-month',
    expiryDate: '2025-12-31',
    children: [
      {
        id: 'd1-1',
        name: 'Lily Fox',
        dob: '2012-05-14',
        role: 'Member',
        isRceb: true,
        plan: 'Teen',
        services: ['Swim Class'],
        paymentTenure: 'Monthly',
        expiryDate: '2024-06-30'
      },
      {
        id: 'd1-2',
        name: 'James Fox',
        dob: '2015-08-22',
        role: 'Member',
        isRceb: false,
        plan: 'Child',
        services: ['Kids Gym'],
        paymentTenure: 'Monthly',
        expiryDate: '2024-06-30'
      }
    ]
  },
  {
    id: 'h2',
    name: 'Eleanor Pena',
    email: 'eleanor.pena@example.com',
    mobile: '(201) 555-0124',
    dob: '1955-11-05',
    role: 'Primary',
    isRceb: true,
    plan: 'Senior 65+',
    services: ['Gym Access', 'Personal Trainer'],
    paymentTenure: '6-month',
    expiryDate: '2024-09-30',
    children: []
  }
];

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
             <div>Category: <span className="font-medium text-gray-900">{profile.plan}</span></div>
             <div className="text-xs">Expires: {profile.expiryDate}</div>
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
  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-medium text-gray-900">Member Profiles</h3>
          <p className="text-sm text-gray-500">Manage family hierarchies and enrollments</p>
       </div>
       <div className="flex-1 overflow-auto">
          {DUMMY_PROFILES.map(profile => (
             <ProfileRow key={profile.id} profile={profile} level={0} />
          ))}
       </div>
    </div>
  );
};
