
import React, { useState } from 'react';
import { MembershipManager } from '../components/settings/MembershipManager';
import { ServiceManager } from '../components/settings/ServiceManager';
import { SubscriptionTypesManager } from '../components/settings/SubscriptionTypesManager';

type SettingsTab = 'membership' | 'services' | 'subscriptions';

export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('membership');

    return (
        <div className="h-full flex flex-col space-y-8 m-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Settings</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage global configuration for memberships, services, and pricing.</p>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm inline-flex">
                    <button
                        onClick={() => setActiveTab('membership')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'membership'
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        Membership Management
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'services'
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        Service Management
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'subscriptions'
                            ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        Subscription Types
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'membership' && <MembershipManager />}
                {activeTab === 'services' && <ServiceManager />}
                {activeTab === 'subscriptions' && <SubscriptionTypesManager />}
            </div>
        </div>
    );
};
