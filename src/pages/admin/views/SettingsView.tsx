
import React, { useState } from 'react';
import { MembershipManager } from '../components/settings/MembershipManager';
import { ServiceManager } from '../components/settings/ServiceManager';
import { SubscriptionTypesManager } from '../components/settings/SubscriptionTypesManager';

type SettingsTab = 'membership' | 'services' | 'subscriptions';

export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('membership');

    return (
        <div className="h-full flex flex-col">
            {/* Enhanced Header Section */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-8 py-6 border-b border-slate-700 rounded-t-lg">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold text-white! tracking-tight">Admin Settings</h1>
                    <p className="text-slate-300 text-sm font-medium">Manage global configuration for memberships, services, and pricing</p>
                </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="bg-white border-b border-gray-200 px-8">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('membership')}
                        className={`relative py-4 px-2 font-semibold text-sm transition-all duration-200 ${
                            activeTab === 'membership'
                                ? 'text-cyan-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Membership Management
                        {activeTab === 'membership' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`relative py-4 px-2 font-semibold text-sm transition-all duration-200 ${
                            activeTab === 'services'
                                ? 'text-emerald-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Service Management
                        {activeTab === 'services' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={`relative py-4 px-2 font-semibold text-sm transition-all duration-200 ${
                            activeTab === 'subscriptions'
                                ? 'text-violet-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Subscription Types
                        {activeTab === 'subscriptions' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500"></div>
                        )}
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                {activeTab === 'membership' && <MembershipManager />}
                {activeTab === 'services' && <ServiceManager />}
                {activeTab === 'subscriptions' && <SubscriptionTypesManager />}
            </div>
        </div>
    );
};
