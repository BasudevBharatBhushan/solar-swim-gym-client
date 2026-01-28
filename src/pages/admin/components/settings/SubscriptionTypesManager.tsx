
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
            {/* Top Stats */}
            <div>
                <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-gray-100 flex items-center w-fit min-w-[240px]">
                    <div className="bg-violet-50 p-3 rounded-xl mr-4 text-violet-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Active Types</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{types.length}</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-fadeIn">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fadeIn">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Existing Types List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Existing Subscription Types
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
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
                                            className="group relative bg-white border border-gray-100 rounded-xl p-5 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900">{type.type_name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Bills every {type.billing_interval_count} {type.billing_interval_unit}(s)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {type.auto_renew && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wide">
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                            </svg>
                                                            Auto-Renew
                                                        </span>
                                                    )}
                                                    <div className="flex space-x-1">
                                                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => type.id && handleDelete(type.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Form */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Subscription Type
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500 transition-all font-medium text-gray-900"
                                        placeholder="e.g. Monthly, Quarterly, Annual"
                                        value={formData.type_name}
                                        onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Interval Count <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500 transition-all font-medium text-gray-900"
                                            value={formData.billing_interval_count}
                                            onChange={(e) => setFormData({ ...formData, billing_interval_count: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Interval Unit <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500 transition-all font-medium text-gray-900 appearance-none"
                                                value={formData.billing_interval_unit}
                                                onChange={(e) => setFormData({ ...formData, billing_interval_unit: e.target.value as any })}
                                            >
                                                <option value="day">Day(s)</option>
                                                <option value="week">Week(s)</option>
                                                <option value="month">Month(s)</option>
                                                <option value="year">Year(s)</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="auto-renew"
                                            type="checkbox"
                                            className="h-5 w-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            checked={formData.auto_renew}
                                            onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="auto-renew" className="font-bold text-gray-900 block">Enable Auto-Renew</label>
                                        <p className="text-gray-500 mt-1">Automatically renew subscriptions at the end of the billing period.</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border-1 border-blue-100 p-4 rounded-xl">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Preview</p>
                                            <p className="text-sm text-blue-800 mt-1 font-medium">
                                                {formData.type_name || 'My Subscription'} — Bills every {formData.billing_interval_count} {formData.billing_interval_unit}(s)
                                                {formData.auto_renew ? ' with auto-renewal' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-xl text-white! bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all shadow-lg shadow-violet-200"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Create Subscription
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ type_name: '', billing_interval_unit: 'month', billing_interval_count: 1, auto_renew: true })}
                                        className="inline-flex items-center justify-center px-6 py-3.5 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
