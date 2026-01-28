
import React, { useEffect, useState } from 'react';
import { adminService } from '../../../../services/admin.service';
import type { Service, SubscriptionType } from '../../../../types/api.types';
import { PricingMatrix } from './PricingMatrix';
import { mapAgeGroupToDb } from '../../../../constants/ageGroups';

export const ServiceManager: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [servicePlans, setServicePlans] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New Service Form
    const [newService, setNewService] = useState({
        service_name: '',
        is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedServices, fetchedTypes] = await Promise.all([
                adminService.getServices(),
                adminService.getSubscriptionTypes()
            ]);
            setServices(fetchedServices);
            setSubscriptionTypes(fetchedTypes);
        } catch (err: any) {
            setError(err.message || 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Load pricing when a service is selected
    useEffect(() => {
        if (!selectedService) return;

        const fetchPricing = async () => {
            setLoading(true);
            try {
                const plans = await adminService.getServicePlans();
                // Filter for this service and map to simple dictionary
                const pricingMap: Record<string, number> = {};
                plans.forEach(plan => {
                    if (plan.service_id === selectedService.id) {
                        pricingMap[`${plan.age_group}-${plan.subscription_type_id}`] = plan.price;
                    }
                });
                setServicePlans(pricingMap);
            } catch (err) {
                console.error('Failed to load pricing', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPricing();
    }, [selectedService]);

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const created = await adminService.createService(newService);
            setServices([...services, created]);
            setSuccess('Service created successfully!');
            setNewService({ service_name: '', is_active: true });
            setSelectedService(created); // Auto-select to configure price
        } catch (err: any) {
            setError(err.message || 'Failed to create service');
        }
    };

    const handleDeleteService = (serviceId: string) => {
        // TODO: Implement delete functionality
        console.log('Delete service:', serviceId);
        alert('Delete functionality will be implemented later');
    };

    const handlePriceChange = async (ageGroup: string, subscriptionTypeId: string, price: number) => {
        if (!selectedService) {
            console.error('No service selected!');
            return;
        }

        // Optimistic update
        const key = `${ageGroup}-${subscriptionTypeId}`;
        setServicePlans(prev => ({ ...prev, [key]: price }));

        const dbAgeGroup = mapAgeGroupToDb(ageGroup);

        // Use service_id if it exists, otherwise fall back to id
        const serviceId = (selectedService as any).service_id || selectedService.id;

        const payload = {
            service_id: serviceId,
            subscription_type_id: subscriptionTypeId,
            age_group: dbAgeGroup,
            price: price,
            currency: 'USD',
            funding_type: 'private' // Default to private, can be made configurable later
        };

        try {
            const result = await adminService.createServicePlan(payload);
            console.log('Service plan created successfully:', result);
            setSuccess('Prices saved successfully.');
        } catch (err) {
            console.error('Failed to save price', err);
            setError('Failed to save specific price changes. Please check connection.');
        }
    };

    const handleAddNewClick = () => {
        setSelectedService(null);
        setNewService({ service_name: '', is_active: true });
    };

    return (
        <div className="space-y-6">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Description Card */}
                <div className="md:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Service Configuration</h2>
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                            Define core and add-on services and their associated pricing tiers across different age groups.
                        </p>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-gray-900">{services.length}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Total Services</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List Column */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Available Services
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {loading && services.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            </div>
                        ) : (
                            services.map(s => (
                                <div
                                    key={s.id}
                                    className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${selectedService?.id === s.id
                                            ? 'bg-white border-green-500 shadow-md ring-1 ring-green-100'
                                            : 'bg-white border-transparent hover:border-green-200 hover:shadow-sm shadow-sm'
                                        }`}
                                    onClick={() => setSelectedService(s)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900 truncate pr-8">{s.name || s.service_name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteService(s.id);
                                        }}
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                        title="Delete service"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                        <button
                            onClick={handleAddNewClick}
                            className={`w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium ${!selectedService ? 'bg-green-50 border-green-400 text-green-700' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Service
                        </button>
                    </div>
                </div>

                {/* Create/Edit Column */}
                <div className="lg:col-span-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {selectedService ? 'Edit Service Details' : 'Create New Service'}
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-8">
                        <form onSubmit={handleCreateService} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Service Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Swimming Lessons"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-900"
                                    value={newService.service_name}
                                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="service-active"
                                        type="checkbox"
                                        className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        checked={newService.is_active}
                                        onChange={(e) => setNewService({ ...newService, is_active: e.target.checked })}
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="service-active" className="font-bold text-gray-900 block">Active Status</label>
                                    <p className="text-gray-500 mt-1">Make this service available for selection</p>
                                </div>
                            </div>

                            {!selectedService && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-xl text-white! bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all shadow-lg shadow-green-200"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Create Service
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewService({ service_name: '', is_active: true })}
                                        className="inline-flex items-center justify-center px-6 py-3.5 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Pricing Configuration (Full Width) */}
            <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pricing Configuration
                    </h3>
                    {selectedService && (
                        <span className="bg-green-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                            {selectedService.name || selectedService.service_name}
                        </span>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <div className="mb-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-blue-900 mb-1">Add-On Service Pricing</p>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                This service price is only applicable if opted as an ADDON. If CORE, these charges will not apply.
                            </p>
                        </div>
                    </div>

                    {selectedService ? (
                        <PricingMatrix
                            subscriptionTypes={subscriptionTypes}
                            prices={servicePlans}
                            onPriceChange={handlePriceChange}
                            loading={loading}
                        />
                    ) : (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                            <p>Select a service to configure pricing</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
