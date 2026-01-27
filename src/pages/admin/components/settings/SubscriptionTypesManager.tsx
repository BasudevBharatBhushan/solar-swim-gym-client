
import React, { useEffect, useState } from 'react';
import { adminService } from '../../../../services/admin.service';
import type { SubscriptionType } from '../../../../types/api.types';

export const SubscriptionTypesManager: React.FC = () => {
    const [types, setTypes] = useState<SubscriptionType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        type_name: '',
        billing_interval_unit: 'month',
        billing_interval_count: 1,
        auto_renew: true
    });

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const data = await adminService.getSubscriptionTypes();
            setTypes(data);
        } catch (err: any) {
            console.error(err);
             // Verify if it's a real error or just empty list initial state
            setError('Failed to load subscription types');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await adminService.createSubscriptionType(formData as any);
            setSuccess('Subscription Type created successfully!');
            setFormData({
                type_name: '',
                billing_interval_unit: 'month',
                billing_interval_count: 1,
                auto_renew: true
            });
            fetchTypes(); // Refresh list
        } catch (err: any) {
            setError(err.message || 'Failed to create subscription type');
        }
    };

    const handleDelete = (typeId: string) => {
        // TODO: Implement delete functionality
        console.log('Delete subscription type:', typeId);
        alert('Delete functionality will be implemented later');
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white!">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-white!">Subscription Types Management</h2>
                        <p className="text-slate-300 text-sm">Define billing intervals and subscription durations</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <div className="text-3xl font-bold">{types.length}</div>
                        <div className="text-xs text-slate-300">Total Types</div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Existing Types List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                        <h3 className="text-lg font-bold text-white! flex items-center">
                            <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Existing Subscription Types
                        </h3>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
                            </div>
                        ) : types.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium">No subscription types found</p>
                                <p className="text-xs mt-1">Create your first subscription type to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {types.map((type) => (
                                    <div 
                                        key={type.id || Math.random()} 
                                        className="group relative bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-bold text-gray-900">{type.type_name}</h4>
                                                    {type.auto_renew && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                            </svg>
                                                            Auto-Renew
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="font-semibold">{type.billing_interval_count}</span>
                                                        <span className="ml-1">{type.billing_interval_unit}(s)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => type.id && handleDelete(type.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-100 text-red-600"
                                                title="Delete subscription type"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Form */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                        <h3 className="text-lg font-bold text-white! flex items-center">
                            <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Subscription Type
                        </h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Display Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Monthly, Quarterly, Annual"
                                    value={formData.type_name}
                                    onChange={(e) => setFormData({...formData, type_name: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Interval Count <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.billing_interval_count}
                                        onChange={(e) => setFormData({...formData, billing_interval_count: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Interval Unit <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={formData.billing_interval_unit}
                                        onChange={(e) => setFormData({...formData, billing_interval_unit: e.target.value as any})}
                                    >
                                        <option value="day">Day</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                        <option value="year">Year</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <input
                                    id="auto-renew"
                                    type="checkbox"
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    checked={formData.auto_renew}
                                    onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})}
                                />
                                <label htmlFor="auto-renew" className="ml-3 cursor-pointer">
                                    <span className="text-sm font-semibold text-gray-900">Auto Renew</span>
                                    <p className="text-xs text-gray-500">Automatically renew subscriptions at the end of the billing period</p>
                                </label>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-medium text-blue-900">Preview</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            {formData.type_name || 'Subscription Type'} - Bills every {formData.billing_interval_count} {formData.billing_interval_unit}(s)
                                            {formData.auto_renew ? ' with auto-renewal' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white! bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Subscription Type
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ type_name: '', billing_interval_unit: 'month', billing_interval_count: 1, auto_renew: true })}
                                    className="px-6 py-3 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
