
import React, { useEffect, useState } from 'react';
import { adminService } from '../../../../services/admin.service';
import type { Membership, SubscriptionType, Service } from '../../../../types/api.types';
import { PricingMatrix } from './PricingMatrix';
import { mapAgeGroupToDb } from '../../../../constants/ageGroups';

export const MembershipManager: React.FC = () => {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
    const [services, setServices] = useState<Service[]>([]); // For bundling
    const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
    const [membershipPlans, setMembershipPlans] = useState<Record<string, number>>({});
    
    // Bundled Services State - All services are CORE type by default
    // Key: serviceId, Value: boolean (enabled/disabled)
    const [bundledServices, setBundledServices] = useState<Record<string, boolean>>({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newMembership, setNewMembership] = useState({
        membership_name: '',
        description: '',
        is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedMemberships, fetchedTypes, fetchedServices] = await Promise.all([
                adminService.getMemberships(),
                adminService.getSubscriptionTypes(),
                adminService.getServices()
            ]);
            setMemberships(fetchedMemberships);
            setSubscriptionTypes(fetchedTypes);
            setServices(fetchedServices);
        } catch (err: any) {
            setError(err.message || 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedMembership) return;
        
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Fetch Pricing
                const plans = await adminService.getMembershipPlans();
                const pricingMap: Record<string, number> = {};
                plans.forEach(plan => {
                    if (plan.membership_id === selectedMembership.membership_id) {
                        pricingMap[`${plan.age_group}-${plan.subscription_type_id}`] = plan.price;
                    }
                });
                setMembershipPlans(pricingMap);

                // TODO: Fetch Bundled Services
                // Since API is missing, we reset for now or would fetch here
                setBundledServices({}); 
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [selectedMembership]);

    const handleCreateMembership = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const created = await adminService.createMembership(newMembership);
            setMemberships([...memberships, created]);
            setSuccess('Membership created successfully!');
            setNewMembership({ membership_name: '', description: '', is_active: true });
            setSelectedMembership(created);
        } catch (err: any) {
            setError(err.message || 'Failed to create membership');
        }
    };

    const handleDeleteMembership = (membershipId: string) => {
        // TODO: Implement delete functionality
        console.log('Delete membership:', membershipId);
        alert('Delete functionality will be implemented later');
    };

    const handlePriceChange = async (ageGroup: string, subscriptionTypeId: string, price: number) => {
        if (!selectedMembership) return;
        
        const key = `${ageGroup}-${subscriptionTypeId}`;
        setMembershipPlans(prev => ({ ...prev, [key]: price }));

        const dbAgeGroup = mapAgeGroupToDb(ageGroup);

        const payload = {
            membership_id: selectedMembership.membership_id,
            subscription_type_id: subscriptionTypeId,
            age_group: dbAgeGroup,
            price: price,
            currency: 'USD',
            funding_type: 'private' // Default to private, can be made configurable later
        };

        console.log('Creating membership plan with payload:', payload);

        try {
             // See ServiceManager notes on upsert
            const result = await adminService.createMembershipPlan(payload);
            console.log('Membership plan created successfully:', result);
            setSuccess('Prices updating...'); 
            // Note: PricingMatrix calls this in a loop for multiple items. 
            // Ideally we'd debounce or have a bulk API, but this works for now.
        } catch (err) {
            console.error('Failed to save price', err);
            setError('Failed to save price change automatically.');
        }
    };

    const toggleServiceBundle = (serviceId: string) => {
        setBundledServices(prev => ({
            ...prev,
            [serviceId]: !prev[serviceId]
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white!">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-white!">Membership Management</h2>
                        <p className="text-slate-300 text-sm">Configure membership plans, pricing, and bundled services</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <div className="text-3xl font-bold">{memberships.length}</div>
                        <div className="text-xs text-slate-300">Total Plans</div>
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
                {/* Membership List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white! not-visited:flex items-center">
                                <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Active Memberships
                            </h3>
                        </div>
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : memberships.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-sm">No memberships yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {memberships.map(m => (
                                        <div 
                                            key={m.membership_id} 
                                            className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                                selectedMembership?.membership_id === m.membership_id 
                                                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                                                    : 'bg-gray-50 border-2 border-transparent hover:border-blue-200 hover:shadow-sm'
                                            }`}
                                            onClick={() => setSelectedMembership(m)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 truncate">{m.membership_name}</h4>
                                                        {m.is_active ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {m.description && (
                                                        <p className="text-xs text-gray-600 line-clamp-2">{m.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteMembership(m.membership_id);
                                                    }}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-100 text-red-600"
                                                    title="Delete membership"
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

                {/* Create New Membership Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create New Membership
                            </h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateMembership} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Membership Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Premium Membership, Basic Plan"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={newMembership.membership_name}
                                        onChange={(e) => setNewMembership({...newMembership, membership_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        rows={3}
                                        placeholder="Provide a detailed description of this membership plan..."
                                        value={newMembership.description}
                                        onChange={(e) => setNewMembership({...newMembership, description: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <input
                                        id="membership-active"
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                        checked={newMembership.is_active}
                                        onChange={(e) => setNewMembership({...newMembership, is_active: e.target.checked})}
                                    />
                                    <label htmlFor="membership-active" className="ml-3 cursor-pointer">
                                        <span className="text-sm font-semibold text-gray-900">Active Status</span>
                                        <p className="text-xs text-gray-500">Enable this membership for customer selection</p>
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white!bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        {loading ? 'Creating...' : 'Create Membership'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewMembership({ membership_name: '', description: '', is_active: true })}
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

            {/* Pricing & Services Configuration */}
            {selectedMembership && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Pricing Configuration */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white! flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pricing Matrix
                                </h3>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    {selectedMembership.membership_name}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
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
                                prices={membershipPlans} 
                                onPriceChange={handlePriceChange}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Bundled Services */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Bundled Services Configuration
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Bundled Services</p>
                                        <p className="text-xs text-blue-700 mt-1">Toggle services to include them as CORE services in this membership at no additional charge.</p>
                                    </div>
                                </div>
                            </div>
                            
                            {services.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-sm font-medium">No services available</p>
                                    <p className="text-xs mt-1">Create services in the Service Management tab first</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {services.map(service => {
                                        const isSelected = bundledServices[service.id] || false;

                                        return (
                                            <div 
                                                key={service.id} 
                                                className={`relative border-2 rounded-xl p-5 transition-all duration-200 ${
                                                    isSelected 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-gray-900 truncate">
                                                                {service.name || service.service_name}
                                                            </h4>
                                                            {isSelected && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    CORE
                                                                </span>
                                                            )}
                                                        </div>
                                                        {service.description && (
                                                            <p className="text-xs text-gray-600 line-clamp-2">{service.description}</p>
                                                        )}
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer ml-2 flex-shrink-0">
                                                        <input 
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isSelected}
                                                            onChange={() => toggleServiceBundle(service.id)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
