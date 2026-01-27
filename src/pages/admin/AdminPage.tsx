import React, { useState } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { AdminLayout } from './components/AdminLayout';
import { LeadsView } from './views/LeadsView';
import { ProfilesView } from './views/ProfilesView';
import { AccountsView } from './views/AccountsView';
import { SettingsView } from './views/SettingsView';

type AdminView = 'leads' | 'accounts' | 'profiles' | 'settings';

export const AdminPage: React.FC = () => {
    // Demo State: Login status
    // In a real app, this would be handled by auth context, but per spec we keep it local/static
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentView, setCurrentView] = useState<AdminView>('leads');

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentView('leads');
    };

    if (!isLoggedIn) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    return (
        <AdminLayout 
            currentView={currentView} 
            onViewChange={setCurrentView}
            onLogout={handleLogout}
        >
            {currentView === 'leads' && <LeadsView />}
            {currentView === 'accounts' && <AccountsView />}
            {currentView === 'profiles' && <ProfilesView />}
            {currentView === 'settings' && <SettingsView />}
        </AdminLayout>
    );
};

