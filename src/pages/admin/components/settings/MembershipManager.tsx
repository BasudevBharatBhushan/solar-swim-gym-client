
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
        if (!selectedMembership) {
            // If we deselect, maybe reset form to empty for "Create New"
            setNewMembership({ membership_name: '', description: '', is_active: true });
            return;
        }

        // Populate form with selected membership
        setNewMembership({
            membership_name: selectedMembership.membership_name,
            description: selectedMembership.description || '',
            is_active: selectedMembership.is_active
        });

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

                // Fetch Bundled Services
                try {
                    const assignedServices = await adminService.getMembershipServices(selectedMembership.membership_id);
                    const bundleMap: Record<string, boolean> = {};
                    if (Array.isArray(assignedServices)) {
                        assignedServices.forEach((item: any) => {
                            // Check for various ID formats: nested object, junction property, or direct
                            const sId = item.serviceId || item.service_id || item.id;
                            if (sId) bundleMap[sId] = true;
                        });
                    }
                    setBundledServices(bundleMap);
                } catch (serviceErr) {
                    console.error('Failed to fetch bundled services', serviceErr);
                    // Don't fail the whole view if just services fail
                }
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
            // TODO: If selectedMembership is not null, this should be an UPDATE operation
            if (selectedMembership) {
                // Mock update for now as create logic handles new ones
                // adminService.updateMembership(selectedMembership.id, newMembership)
                alert("Update logic to be implemented. Currently in 'Create Mode'.");
                return;
            }

            const created = await adminService.createMembership(newMembership);
            setMemberships([...memberships, created]);
            setSuccess('Membership created successfully!');
            setNewMembership({ membership_name: '', description: '', is_active: true });
            setSelectedMembership(created);
        } catch (err: any) {
            setError(err.message || 'Failed to create membership');
        }
    };

    // const handleDeleteMembership = (membershipId: string) => {
    //     // TODO: Implement delete functionality
    //     console.log('Delete membership:', membershipId);
    //     alert('Delete functionality will be implemented later');
    // };

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

    const toggleServiceBundle = async (serviceId: string) => {
        if (!selectedMembership) return;

        const isCurrentlyBundled = bundledServices[serviceId];

        // Optimistic update
        setBundledServices(prev => ({
            ...prev,
            [serviceId]: !prev[serviceId]
        }));

        try {
            if (!isCurrentlyBundled) {
                // Assign service
                await adminService.assignServiceToMembership(selectedMembership.membership_id, serviceId, 'CORE');
                setSuccess('Service bundled successfully');
            } else {
                // Unassign service
                // Note: If unassign endpoint isn't available, we warn user or revert
                // Assuming for now strict "Add" functionality requested.
                console.warn('Unassign endpoint implementation pending');
                // Revert for now as we don't have DELETE endpoint confirmed
                setBundledServices(prev => ({
                    ...prev,
                    [serviceId]: true
                }));
                setError('Removing bundled services is not yet supported.');
            }
        } catch (err: any) {
            // Revert on error
            setBundledServices(prev => ({
                ...prev,
                [serviceId]: isCurrentlyBundled
            }));
            setError(err.message || 'Failed to update bundle status');
        }
    };

    const handleAddNewClick = () => {
        setSelectedMembership(null);
        setNewMembership({ membership_name: '', description: '', is_active: true });
    };

    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div>
                <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-gray-100 flex items-center w-fit min-w-[240px]">
                    <div className="bg-blue-50 p-3 rounded-xl mr-4 text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Plans</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{memberships.length}</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Memberships</h3>
                    </div>

                    <div className="space-y-3">
                        {loading && memberships.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                            </div>
                        ) : (
                            memberships.map(m => (
                                <div
                                    key={m.membership_id}
                                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${selectedMembership?.membership_id === m.membership_id
                                        ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-100'
                                        : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm shadow-sm'
                                        }`}
                                    onClick={() => setSelectedMembership(m)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900 text-lg">{m.membership_name}</h4>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {m.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                        {m.description || 'No description provided.'}
                                    </p>
                                    {m.membership_name.toLowerCase() !== 'standard membership' && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs font-semibold text-green-700">Includes special discounts</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        <button
                            onClick={handleAddNewClick}
                            className={`w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium ${!selectedMembership ? 'bg-blue-50 border-blue-400 text-blue-700' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Type
                        </button>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Header for Editor */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {selectedMembership ? 'Edit Membership Details' : 'Create New Membership'}
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                        <form onSubmit={handleCreateMembership} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Membership Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                                    placeholder="e.g. Club Membership"
                                    value={newMembership.membership_name}
                                    onChange={(e) => setNewMembership({ ...newMembership, membership_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 resize-none"
                                    placeholder="Describe the benefits of this membership..."
                                    value={newMembership.description}
                                    onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="active-status"
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        checked={newMembership.is_active}
                                        onChange={(e) => setNewMembership({ ...newMembership, is_active: e.target.checked })}
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="active-status" className="font-bold text-gray-900 block">Active Status</label>
                                    <p className="text-gray-500 mt-1">Enable this membership for customer selection on the front-end portal.</p>
                                </div>
                            </div>

                            {!selectedMembership && (
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                                    >
                                        {loading ? 'Creating...' : 'Create Membership Plan'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Pricing Config (only if selected) */}
                    {selectedMembership && (
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Pricing Matrix</h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-1 rounded">Auto-Saving</span>
                            </div>

                            <div className="mb-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-blue-900 mb-1">Pricing for {selectedMembership.membership_name}</p>
                                    <p className="text-sm text-blue-700 leading-relaxed">
                                        Configure pricing for this specific membership across different age groups and subscription types. Changes are saved automatically when you tab out of a field or click outside.
                                    </p>
                                </div>
                            </div>

                            <PricingMatrix
                                subscriptionTypes={subscriptionTypes}
                                prices={membershipPlans}
                                onPriceChange={handlePriceChange}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* Bundled Services (only if selected) */}
                    {selectedMembership && (
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Bundled Services</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map(service => {
                                    const isSelected = bundledServices[service.id] || false;
                                    return (
                                        <div
                                            key={service.id}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleServiceBundle(service.id)}
                                        >
                                            <div>
                                                <h4 className="font-bold text-gray-900">{service.name || service.service_name}</h4>
                                                {isSelected && <span className="text-xs font-bold text-blue-600 uppercase">included</span>}
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
