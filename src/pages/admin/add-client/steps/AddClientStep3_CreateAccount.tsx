import React, { useState } from 'react';
import { onboardingApi } from '../../../../services/api.service';
import type { OnboardingRequest, OnboardingResponse } from '../../../../types/api.types';

interface Props {
    formData: OnboardingRequest;
    onNext: () => void;
    onPrev: () => void;
    setAccountCreatedData: (data: OnboardingResponse) => void;
}

export const AddClientStep3_CreateAccount: React.FC<Props> = ({
    formData,
    onNext,
    onPrev,
    setAccountCreatedData
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            // Call Onboarding API to create account
            const response = await onboardingApi.complete(formData);

            if (response.success) {
                setAccountCreatedData(response);
                onNext();
            } else {
                setError(response.message || 'Failed to create account.');
            }
        } catch (err: any) {
            console.error('Error creating account:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const { primary_profile, family_members } = formData;

    return (
        <div className="w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Confirm & Create Account</h3>
            <p className="text-gray-500 mb-6">
                Please review the client and family details below. Once confirmed, the account will be created,
                and you can proceed to select memberships and services for each profile.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Primary Profile Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Primary Client</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-400 text-xs font-bold uppercase">Name</span>
                            <span className="font-medium">{primary_profile.first_name} {primary_profile.last_name}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs font-bold uppercase">Email</span>
                            <span className="font-medium">{primary_profile.email}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs font-bold uppercase">Mobile</span>
                            <span className="font-medium">{primary_profile.mobile}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs font-bold uppercase">DOB</span>
                            <span className="font-medium">{primary_profile.date_of_birth}</span>
                        </div>
                    </div>
                </div>

                {/* Family Members Summary */}
                {family_members.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Family Members ({family_members.length})</h4>
                        <div className="space-y-4">
                            {family_members.map((member, index) => (
                                <div key={index} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <span className="font-bold text-gray-700 block">{member.first_name} {member.last_name}</span>
                                        <span className="text-gray-400 text-xs">{member.email}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-gray-600">{member.date_of_birth}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary flex items-center shadow-lg disabled:opacity-70"
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </>
                    ) : 'Confirm & Create Account'}
                </button>
            </div>
        </div>
    );
};
