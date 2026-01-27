import React from 'react';

type AdminView = 'leads' | 'accounts' | 'profiles' | 'settings';

interface AdminLayoutProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
  children: React.ReactNode;
}



const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentView, onViewChange, onLogout, children }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10 transition-width duration-300">
        <div className="p-6 flex flex-col items-start justify-center space-y-1">
          <h1 className="text-xl tracking-tighter text-white! uppercase">
            Solar Swim & Gym
          </h1>
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest border-t border-white/10 pt-1 w-full block">
            Admin Panel
          </span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => onViewChange('leads')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'leads' 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UsersIcon />
            <span className="font-medium">Leads</span>
          </button>

          <button
            onClick={() => onViewChange('accounts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'accounts' 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">Accounts</span>
          </button>

          <button
            onClick={() => onViewChange('profiles')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'profiles' 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserIcon />
            <span className="font-medium">Profiles</span>
          </button>

          <button
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'settings' 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CogIcon />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogoutIcon />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-0">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {currentView} Dashboard
            </h2>
            <div className="flex items-center space-x-4">
               <span className="text-sm text-gray-500">Welcome, Admin</span>
               <div className="h-8 w-8 rounded-full bg-brand-secondary text-white flex items-center justify-center font-bold">
                 A
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {children}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};
