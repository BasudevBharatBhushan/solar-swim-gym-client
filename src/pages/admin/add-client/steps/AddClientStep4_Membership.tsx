import React, { useState, useEffect } from 'react';
import type { OnboardingRequest, OnboardingResponse, Membership, SubscriptionType, Service } from '../../../../types/api.types';
import { adminService } from '../../../../services/admin.service';
import { servicesApi } from '../../../../services/api.service';

export interface ProfileSelection {
    profileId: string;
    name: string;
    isPrimary: boolean;
    membershipId: string;
    subscriptionTypeId: string;
    serviceIds: string[];
}

interface Props {
    formData: OnboardingRequest;
    accountData: OnboardingResponse;
    selections: ProfileSelection[];
    setSelections: (selections: ProfileSelection[]) => void;
    onNext: () => void;
}

export const AddClientStep4_Membership: React.FC<Props> = ({
    formData,
    accountData,
    selections,
    setSelections,
    onNext
}) => {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [bundledMap, setBundledMap] = useState<Record<string, string[]>>({}); // membershipId -> serviceIds[]

    // Initialize selections based on account data if empty
    useEffect(() => {
        if (selections.length === 0) {
            const initialSelections: ProfileSelection[] = [];

            // Use real IDs if available, otherwise use temporary ones for demo
            const primaryId = accountData.primary_profile_id || `temp-primary-${Date.now()}`;

            // Primary
            initialSelections.push({
                profileId: primaryId,
                name: `${formData.primary_profile.first_name} ${formData.primary_profile.last_name}`,
                isPrimary: true,
                membershipId: '',
                subscriptionTypeId: '',
                serviceIds: []
            });

            // Family
            if (formData.family_members && formData.family_members.length > 0) {
                formData.family_members.forEach((member, index) => {
                    // Use real ID if available, otherwise use temporary one
                    const familyId = (accountData.family_member_ids && accountData.family_member_ids[index])
                        || `temp-family-${index}-${Date.now()}`;

                    initialSelections.push({
                        profileId: familyId,
                        name: `${member.first_name} ${member.last_name}`,
                        isPrimary: false,
                        membershipId: '',
                        subscriptionTypeId: '',
                        serviceIds: []
                    });
                });
            }
            setSelections(initialSelections);
        }
    }, [accountData, formData, selections.length, setSelections]);


    // Fetch Options
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membershipsRes, subTypesRes, servicesRes] = await Promise.all([
                    adminService.getMemberships(),
                    adminService.getSubscriptionTypes(),
                    servicesApi.list()
                ]);
                setMemberships(membershipsRes);
                setSubscriptionTypes(subTypesRes);
                setAllServices(servicesRes.services || []);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch bundled services for selected memberships
    useEffect(() => {
        const fetchBundled = async () => {
            const selectedMemIds = Array.from(new Set(selections.map(s => s.membershipId).filter(Boolean)));
            const neededIds = selectedMemIds.filter(id => !bundledMap[id]);

            if (neededIds.length > 0) {
                const newMap = { ...bundledMap };
                await Promise.all(neededIds.map(async (id) => {
                    try {
                        const services = await adminService.getMembershipServices(id);
                        // Assuming response structure, map to IDs
                        newMap[id] = services.map((s: { service_id?: string; id?: string }) => s.service_id || s.id || '');
                    } catch (e) {
                        console.error(`Failed to fetch services for membership ${id}`, e);
                        newMap[id] = [];
                    }
                }));
                setBundledMap(newMap);
            }
        };
        fetchBundled();
    }, [selections, bundledMap]);

    // Handlers
    const updateSelection = (profileId: string, field: keyof ProfileSelection, value: string | string[]) => {
        const newSelections = selections.map(s =>
            s.profileId === profileId ? { ...s, [field]: value } : s
        );
        setSelections(newSelections);
    };

    const toggleService = (profileId: string, serviceId: string) => {
        const selection = selections.find(s => s.profileId === profileId);
        if (!selection) return;

        const currentServices = selection.serviceIds || [];
        const newServices = currentServices.includes(serviceId)
            ? currentServices.filter(id => id !== serviceId)
            : [...currentServices, serviceId];

        updateSelection(profileId, 'serviceIds', newServices);
    };

    if (loading) return <div className="p-10 text-center">Loading options...</div>;

    return (
        <div className="w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Select Membership & Services (Profile-wise)</h3>
            <p className="text-gray-500 mb-6 text-sm">
                Each profile can have its own membership plan and add-on services.
            </p>

            <div className="space-y-8">
                {selections.map((selection, index) => (
                    <div key={selection.profileId} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                        <div className="flex items-center mb-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 text-white ${selection.isPrimary ? 'bg-indigo-600' : 'bg-indigo-400'}`}>
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-800">{selection.name}</h4>
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    {selection.isPrimary ? 'Primary Account Holder' : 'Family Member'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Membership</label>
                                <select
                                    value={selection.membershipId}
                                    onChange={(e) => updateSelection(selection.profileId, 'membershipId', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">-- Select Membership --</option>
                                    {memberships.map(m => (
                                        <option key={m.membership_id} value={m.membership_id}>{m.membership_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Cycle</label>
                                <select
                                    value={selection.subscriptionTypeId}
                                    onChange={(e) => updateSelection(selection.profileId, 'subscriptionTypeId', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">-- Select Cycle --</option>
                                    {subscriptionTypes.map(t => (
                                        <option key={t.id || t.subscription_type_id} value={t.id || t.subscription_type_id}>{t.type_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            {/* Bundled Services Display */}
                            {selection.membershipId && bundledMap[selection.membershipId] && bundledMap[selection.membershipId].length > 0 && (
                                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <span className="text-xs font-bold text-indigo-800 uppercase mb-2 block">Included in Membership</span>
                                    <div className="flex flex-wrap gap-2">
                                        {bundledMap[selection.membershipId].map(sId => {
                                            const s = allServices.find(as => as.id === sId);
                                            return s ? (
                                                <span key={sId} className="px-2 py-1 bg-white text-indigo-600 text-xs font-semibold rounded border border-indigo-100 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {s.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Add-on Services</label>
                            <div className="flex flex-wrap gap-2">
                                {allServices
                                    .filter(s => {
                                        const bundled = bundledMap[selection.membershipId] || [];
                                        return !bundled.includes(s.id);
                                    })
                                    .map(service => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => toggleService(selection.profileId, service.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selection.serviceIds.includes(service.id)
                                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-indigo-300'
                                                }`}
                                        >
                                            {service.name}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onNext}
                    className="btn-primary"
                >
                    Review & Save Selections
                </button>
            </div>
        </div>
    );
};
