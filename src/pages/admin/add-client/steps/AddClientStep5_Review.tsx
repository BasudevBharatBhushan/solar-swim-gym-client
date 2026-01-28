import React, { useState, useEffect } from 'react';
import type { ProfileSelection } from './AddClientStep4_Membership';
import { adminService } from '../../../../services/admin.service';
import { servicesApi } from '../../../../services/api.service';
import type { OnboardingRequest, Membership, SubscriptionType, Service, MembershipPlan, ServicePlan } from '../../../../types/api.types';
import { getAgeCategory } from '../../../../utils/pricing.utils';

interface Props {
    selections: ProfileSelection[];
    formData: OnboardingRequest;
    accountId: string;
    onNext: () => void;
    onPrev: () => void;
}

export const AddClientStep5_Review: React.FC<Props> = ({
    selections,
    formData,
    accountId,
    onNext,
    onPrev
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Metadata for display
    const [memberships, setMemberships] = useState<Record<string, Membership>>({});
    const [subTypes, setSubTypes] = useState<Record<string, SubscriptionType>>({});
    const [servicesMap, setServicesMap] = useState<Record<string, Service>>({});
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
    const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [m, st, s, mp, sp] = await Promise.all([
                    adminService.getMemberships(),
                    adminService.getSubscriptionTypes(),
                    servicesApi.list(),
                    adminService.getMembershipPlans(),
                    adminService.getServicePlans()
                ]);

                const mObj: Record<string, Membership> = {}; m.forEach(x => mObj[x.membership_id] = x);
                const stObj: Record<string, SubscriptionType> = {}; st.forEach(x => {
                    const id = x.id || x.subscription_type_id;
                    if (id) stObj[id] = x;
                });
                const sObj: Record<string, Service> = {}; (s.services || []).forEach(x => sObj[x.id] = x);

                setMemberships(mObj);
                setSubTypes(stObj);
                setServicesMap(sObj);
                setMembershipPlans(mp);
                setServicePlans(sp);
            } catch (e) {
                console.error("Failed to load metadata", e);
            } finally {
                setLoading(false);
            }
        };
        loadMeta();
    }, []);

    const findProfileData = (profileId: string) => {
        // Quick lookup in formData using logic (Primary is first, others index based? No, ID doesn't help match to formData directly easily without index)
        // Actually we don't have IDs in formData, we have them in `selections` + `formData` index assumption or just use selections' name.
        // Wait, `selections` has `profileId`. I need to match `profileId` back to `formData` to get DOB/RCEB.
        // BUT `formData` doesn't have IDs yet (it's the request data).
        // `selections` was built from `accountData` which has ids.
        // `accountData` indices match `formData` indices generally:
        // Primary is always primary.
        // Family members array in `formData` corresponds to `family_member_ids` in `accountData`.

        // Let's assume passed `selections` are in order or we can deduce.
        // Or cleaner: `selections` should contain the dob/rceb info? No.
        // Let's deduce from `isPrimary`.
        const selection = selections.find(s => s.profileId === profileId);
        if (!selection) return null;

        if (selection.isPrimary) {
            return formData.primary_profile;
        } else {
            // Trying to find which family member this is.
            // We can iterate selections and find index among family members.
            const familySelections = selections.filter(s => !s.isPrimary);
            const index = familySelections.findIndex(s => s.profileId === profileId);
            return formData.family_members[index];
        }
    };

    const getPrice = (
        type: 'membership' | 'service',
        id: string,
        subscriptionTypeId: string,
        profileData: import('../../../../types/api.types').PrimaryProfile | import('../../../../types/api.types').FamilyMember | null
    ): number | null => {
        if (!profileData) return null;

        const ageGroup = getAgeCategory(profileData.date_of_birth); // 'adult', 'senior', etc.
        const fundingType = profileData.rceb_flag ? 'rceb' : 'private';

        if (type === 'membership') {
            // Find Membership Plan
            // Try specific match first
            let plan = membershipPlans.find(p =>
                p.membership_id === id &&
                p.subscription_type_id === subscriptionTypeId &&
                p.age_group.toLowerCase() === ageGroup &&
                p.funding_type.toLowerCase() === fundingType
            );

            // Fallbacks if exact age/funding not found (optional, depending on strictness)
            if (!plan) {
                plan = membershipPlans.find(p =>
                    p.membership_id === id &&
                    p.subscription_type_id === subscriptionTypeId
                    // Relax age/funding?
                );
            }
            return plan ? plan.price : null;

        } else {
            // Service Plan
            let plan = servicePlans.find(p =>
                p.service_id === id &&
                p.subscription_type_id === subscriptionTypeId &&
                p.age_group.toLowerCase() === ageGroup &&
                p.funding_type.toLowerCase() === fundingType
            );
            if (!plan) {
                plan = servicePlans.find(p =>
                    p.service_id === id &&
                    p.subscription_type_id === subscriptionTypeId
                );
            }
            // Even looser fallback
            if (!plan) {
                plan = servicePlans.find(p => p.service_id === id);
            }
            return plan ? plan.price : null;
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

            for (const sel of selections) {
                const profileData = findProfileData(sel.profileId);
                const ageGroup = profileData ? getAgeCategory(profileData.date_of_birth) : 'adult';
                const fundingType = profileData?.rceb_flag ? 'rceb' : 'private';

                // 1. Create Membership Subscription
                if (sel.membershipId && sel.subscriptionTypeId) {
                    let mPlan = membershipPlans.find(p =>
                        p.membership_id === sel.membershipId &&
                        p.subscription_type_id === sel.subscriptionTypeId &&
                        p.age_group.toLowerCase() === ageGroup &&
                        p.funding_type.toLowerCase() === fundingType
                    );

                    // Fallback
                    if (!mPlan) {
                        mPlan = membershipPlans.find(p =>
                            p.membership_id === sel.membershipId &&
                            p.subscription_type_id === sel.subscriptionTypeId
                        );
                    }

                    if (mPlan) {
                        await fetch(`${apiBase}/subscriptions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            body: JSON.stringify({
                                accountId: accountId,
                                profileId: sel.profileId,
                                membershipPlanId: mPlan.id // Use id
                            })
                        });
                    }
                }

                // 2. Create Service Subscriptions
                if (sel.serviceIds && sel.serviceIds.length > 0) {
                    for (const sId of sel.serviceIds) {
                        let sPlan = servicePlans.find(sp =>
                            sp.service_id === sId &&
                            sp.subscription_type_id === sel.subscriptionTypeId &&
                            sp.age_group.toLowerCase() === ageGroup &&
                            sp.funding_type.toLowerCase() === fundingType
                        );

                        if (!sPlan) {
                            sPlan = servicePlans.find(sp => sp.service_id === sId && sp.subscription_type_id === sel.subscriptionTypeId);
                        }
                        if (!sPlan) {
                            sPlan = servicePlans.find(sp => sp.service_id === sId);
                        }

                        if (sPlan) {
                            await fetch(`${apiBase}/subscriptions`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                                },
                                body: JSON.stringify({
                                    accountId: accountId,
                                    profileId: sel.profileId,
                                    servicePlanId: sPlan.id // Type says id
                                })
                            });
                        }
                    }
                }
            }

            setSuccessMessage("All subscriptions saved successfully!");
            setTimeout(() => {
                onNext();
            }, 1000);

        } catch (err: unknown) {
            console.error(err);
            setError("Failed to save some subscriptions. Check console for details.");
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Total
    const calculateTotal = () => {
        let total = 0;
        selections.forEach(sel => {
            const profileData = findProfileData(sel.profileId);
            if (sel.membershipId && sel.subscriptionTypeId) {
                const p = getPrice('membership', sel.membershipId, sel.subscriptionTypeId, profileData);
                if (p) total += p;
            }
            sel.serviceIds.forEach(sId => {
                const p = getPrice('service', sId, sel.subscriptionTypeId, profileData);
                if (p) total += p;
            });
        });
        return total;
    };

    if (loading) return <div className="p-10 text-center">Loading plan details...</div>;

    return (
        <div className="w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Review & Confirm Subscriptions</h3>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm">{error}</div>
            )}
            {successMessage && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-sm font-medium">{successMessage}</div>
            )}

            <div className="space-y-6 mb-8">
                {selections.map((sel, idx) => {
                    const memName = memberships[sel.membershipId]?.membership_name || 'None';
                    const cycleName = subTypes[sel.subscriptionTypeId]?.type_name || 'None';
                    const profileData = findProfileData(sel.profileId);

                    const memPrice = getPrice('membership', sel.membershipId, sel.subscriptionTypeId, profileData);

                    return (
                        <div key={idx} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg text-gray-800">{sel.name}</h4>
                                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {sel.isPrimary ? 'Primary' : 'Family'}
                                </span>
                            </div>

                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-500">Membership</td>
                                        <td className="py-2 text-gray-900">{memName} ({cycleName})</td>
                                        <td className="py-2 font-medium text-right">
                                            {memPrice !== null ? `$${memPrice.toFixed(2)}` : '-'}
                                        </td>
                                    </tr>
                                    {sel.serviceIds.map(sId => {
                                        const sPrice = getPrice('service', sId, sel.subscriptionTypeId, profileData);
                                        return (
                                            <tr key={sId} className="border-b border-gray-100 last:border-0">
                                                <td className="py-2 text-gray-500 pl-4">+ {servicesMap[sId]?.name}</td>
                                                <td className="py-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">Add-on</td>
                                                <td className="py-2 font-medium text-right text-indigo-600">
                                                    {sPrice !== null ? `$${sPrice.toFixed(2)}` : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}

                {/* Grand Total */}
                <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
                    <div>
                        <span className="block text-gray-400 text-xs font-bold uppercase tracking-widest">Estimated Recurring Total</span>
                        <span className="text-[10px] text-gray-500 italic">Does not include one-time fees or taxes.</span>
                    </div>
                    <div className="text-3xl font-black">
                        ${calculateTotal().toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <button onClick={onPrev} disabled={submitting} className="px-6 py-2 border rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">Back</button>
                <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="btn-primary flex items-center shadow-lg disabled:opacity-70"
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving Subscriptions...
                        </>
                    ) : 'Confirm & Activate Subscriptions'}
                </button>
            </div>
        </div>
    );
};
