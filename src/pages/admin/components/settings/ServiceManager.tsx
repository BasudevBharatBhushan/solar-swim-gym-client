
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
        
        console.log('handlePriceChange called with:', { ageGroup, subscriptionTypeId, price });
        console.log('selectedService:', selectedService);
        console.log('selectedService.id:', selectedService.id);
        console.log('selectedService.service_id:', (selectedService as any).service_id);
        
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

        console.log('Creating service plan with payload:', payload);
        console.log('Payload JSON:', JSON.stringify(payload, null, 2));

        try {
            const result = await adminService.createServicePlan(payload);
            console.log('Service plan created successfully:', result);
            setSuccess('Prices saved successfully.');
        } catch (err) {
            console.error('Failed to save price', err);
            setError('Failed to save specific price changes. Please check connection.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white!">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-white!">Service Management</h2>
                        <p className="text-slate-300 text-sm">Configure add-on services and their pricing structure</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <div className="text-3xl font-bold">{services.length}</div>
                        <div className="text-xs text-slate-300">Total Services</div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Available Services
                            </h3>
                        </div>
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm">No services yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {services.map(s => (
                                        <div 
                                            key={s.id} 
                                            className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                                selectedService?.id === s.id 
                                                    ? 'bg-green-50 border-2 border-green-500 shadow-md' 
                                                    : 'bg-gray-50 border-2 border-transparent hover:border-green-200 hover:shadow-sm'
                                            }`}
                                            onClick={() => setSelectedService(s)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 truncate">{s.name || s.service_name}</h4>
                                                        {s.is_active ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {s.description && (
                                                        <p className="text-xs text-gray-600 line-clamp-2">{s.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteService(s.id);
                                                    }}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-100 text-red-600"
                                                    title="Delete service"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>

                {/* Create New Service Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create New Service
                            </h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateService} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Service Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Swimming Lessons, Personal Training"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        value={newService.service_name}
                                        onChange={(e) => setNewService({...newService, service_name: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <input
                                        id="service-active"
                                        type="checkbox"
                                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                        checked={newService.is_active}
                                        onChange={(e) => setNewService({...newService, is_active: e.target.checked})}
                                    />
                                    <label htmlFor="service-active" className="ml-3 cursor-pointer">
                                        <span className="text-sm font-semibold text-gray-900">Active Status</span>
                                        <p className="text-xs text-gray-500">Make this service available for selection</p>
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white! bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        {loading ? 'Creating...' : 'Create Service'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewService({ service_name: '', is_active: true })}
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

            {/* Pricing Configuration */}
            {selectedService && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pricing Configuration
                            </h3>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {selectedService.name || selectedService.service_name}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-yellow-900">Add-On Service Pricing</p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        This service price is only applicable if the service is opted as an <strong>ADDON</strong>. 
                                        If this service is <strong>CORE</strong> (bundled) with a valid membership, these charges will not apply.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Pricing Configuration</p>
                                    <p className="text-xs text-blue-700 mt-1">Set prices for different age groups and subscription types. Changes are saved automatically when you tab out of a field.</p>
                                </div>
                            </div>
                        </div>

                        <PricingMatrix 
                            subscriptionTypes={subscriptionTypes} 
                            prices={servicePlans} 
                            onPriceChange={handlePriceChange}
                            loading={loading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
