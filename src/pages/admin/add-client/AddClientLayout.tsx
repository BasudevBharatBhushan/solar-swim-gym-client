import React, { useState } from 'react';
import type { OnboardingRequest, PrimaryProfile, FamilyMember, OnboardingResponse } from '../../../types/api.types';
import { ParentProfileForm } from '../../onboarding/steps/ParentProfileForm';
import { FamilyMembersForm } from '../../onboarding/steps/FamilyMembersForm';
import { AddClientStep3_CreateAccount } from './steps/AddClientStep3_CreateAccount';
import { AddClientStep4_Membership, type ProfileSelection } from './steps/AddClientStep4_Membership';
import { AddClientStep5_Review } from './steps/AddClientStep5_Review';
import { AddClientStep6_Complete } from './steps/AddClientStep6_Complete';
import { Link } from 'react-router-dom';

const initialData: OnboardingRequest = {
    primary_profile: {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        mobile: '',
        date_of_birth: '',
        rceb_flag: false,
        case_manager: { name: '', email: '' },
        services: [],
        tenure: '12mo'
    },
    family_members: []
};

export const AddClientLayout: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingRequest>(initialData);
    const [accountCreatedData, setAccountCreatedData] = useState<OnboardingResponse>({
        success: false,
        message: '',
        account_id: '',
        primary_profile_id: '',
        family_member_ids: []
    });

    // Stores the membership/service selections for each profile after creation
    const [selections, setSelections] = useState<ProfileSelection[]>([]);

    const updatePrimaryProfile = (data: Partial<PrimaryProfile>) => {
        setFormData(prev => ({
            ...prev,
            primary_profile: { ...prev.primary_profile, ...data }
        }));
    };

    const updateFamilyMembers = (members: FamilyMember[]) => {
        setFormData(prev => ({
            ...prev,
            family_members: members
        }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const steps = [
        { id: 1, label: 'Client Info' },
        { id: 2, label: 'Family' },
        { id: 3, label: 'Create Account' },
        { id: 4, label: 'Memberships' },
        { id: 5, label: 'Review Info' },
        { id: 6, label: 'Complete' }
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-6 pb-10 relative overflow-hidden bg-gray-50">
            {/* Admin Header Link */}
            <div className="absolute top-4 left-4 z-20">
                <Link to="/admin" className="flex items-center text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-linear-to-br from-indigo-50/50 via-white to-blue-50/50">
                <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-indigo-100/50 blur-[80px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] rounded-full bg-blue-100/30 blur-[80px]" />
            </div>

            <div className="w-full max-w-6xl px-4 z-10 flex flex-col h-full">
                {/* Header / Stepper */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Add New Client</h2>

                    <div className="flex items-center justify-center max-w-4xl mx-auto relative px-4">
                        {/* Connecting Lines */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden transform -translate-y-1/2">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-500 ease-in-out"
                                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {/* Steps */}
                        {steps.map((s) => (
                            <div key={s.id} className="flex-1 flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 z-10
                    ${step > s.id ? 'bg-indigo-600 border-indigo-600 text-white' :
                                            step === s.id ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-100 scale-110' :
                                                'bg-white border-gray-300 text-gray-400'}`}
                                >
                                    {step > s.id ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        s.id
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 hidden sm:block
                    ${step >= s.id ? 'text-indigo-900' : 'text-gray-400'}`}
                                >
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-3xl w-full grow animate-fade-in shadow-xl border border-white">
                    {step === 1 && (
                        <div className="animate-slide-up">
                            <ParentProfileForm
                                data={formData.primary_profile}
                                updateData={updatePrimaryProfile}
                                updateFamilyMembers={updateFamilyMembers}
                                familyMembers={formData.family_members}
                                onNext={nextStep}
                            />
                        </div>
                    )}
                    {step === 2 && (
                        <div className="animate-slide-up">
                            <FamilyMembersForm
                                members={formData.family_members}
                                updateMembers={updateFamilyMembers}
                                primaryProfile={formData.primary_profile}
                                updatePrimaryProfile={updatePrimaryProfile}
                                onNext={nextStep}
                                onPrev={prevStep}
                            />
                        </div>
                    )}
                    {step === 3 && (
                        <div className="animate-slide-up">
                            <AddClientStep3_CreateAccount
                                formData={formData}
                                onNext={nextStep}
                                onPrev={prevStep}
                                setAccountCreatedData={setAccountCreatedData}
                            />
                        </div>
                    )}
                    {step === 4 && (
                        <div className="animate-slide-up">
                            <AddClientStep4_Membership
                                formData={formData}
                                accountData={accountCreatedData}
                                selections={selections}
                                setSelections={setSelections}
                                onNext={nextStep}
                            />
                        </div>
                    )}
                    {step === 5 && (
                        <div className="animate-slide-up">
                            <AddClientStep5_Review
                                selections={selections}
                                formData={formData}
                                accountId={accountCreatedData.account_id}
                                onPrev={prevStep}
                                onNext={nextStep}
                            />
                        </div>
                    )}
                    {step === 6 && (
                        <div className="animate-slide-up">
                            <AddClientStep6_Complete />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
