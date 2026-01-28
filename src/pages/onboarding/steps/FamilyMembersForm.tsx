import React, { useState } from 'react';
import type { FamilyMember, PrimaryProfile } from '../../../types/api.types';

interface FamilyMembersFormProps {
    members: FamilyMember[];
    updateMembers: (members: FamilyMember[]) => void;
    primaryProfile: PrimaryProfile;
    updatePrimaryProfile: (data: Partial<PrimaryProfile>) => void;
    onNext: () => void;
    onPrev: () => void;
}

interface CaseManagerFormProps {
    rcebFlag: boolean;
    caseManager?: { name: string; email: string };
    onChange: (field: 'name' | 'email', value: string) => void;
    error?: string;
}

const CaseManagerForm: React.FC<CaseManagerFormProps> = ({
    rcebFlag,
    caseManager,
    onChange,
    error
}) => {
    if (!rcebFlag) return null;
    return (
        <div className={`mt-4 p-5 rounded-xl border animate-fade-in ${error ? 'bg-red-50 border-red-200' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold text-sm flex items-center ${error ? 'text-red-700' : 'text-brand-dark'}`}>
                    Case Manager Information
                </h4>
                {error && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{error}</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    placeholder="Case Manager Name"
                    value={caseManager?.name || ''}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
                />
                <input
                    type="email"
                    placeholder="Case Manager Email"
                    value={caseManager?.email || ''}
                    onChange={(e) => onChange('email', e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
                />
            </div>
        </div>
    );
};

export const FamilyMembersForm: React.FC<FamilyMembersFormProps> = ({
    members,
    updateMembers,
    primaryProfile,
    updatePrimaryProfile,
    onNext,
    onPrev
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (key: string) => {
        if (errors[key]) {
            const newErrors = { ...errors };
            delete newErrors[key];
            setErrors(newErrors);
        }
    };

    // --- Primary Profile Handlers ---

    const handlePrimaryRcebChange = (checked: boolean) => {
        updatePrimaryProfile({ rceb_flag: checked });
        if (!checked) clearError('primary_case_manager');
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleNext = () => {
        const newErrors: Record<string, string> = {};
        let hasError = false;

        // Validate Primary Profile
        if (primaryProfile.rceb_flag) {
            if (!primaryProfile.case_manager?.name || !primaryProfile.case_manager?.email) {
                newErrors['primary_case_manager'] = "Name and Email required";
                hasError = true;
            }
        }

        // Validate Family Members
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            // const displayIndex = i + 2; 

            if (!member.first_name) {
                newErrors[`member_${i}_firstname`] = "First Name is required";
                hasError = true;
            }

            if (member.rceb_flag) {
                if (!member.case_manager?.name || !member.case_manager?.email) {
                    newErrors[`member_${i}_casemanager`] = "Case Manager details required";
                    hasError = true;
                }
            }

            const age = calculateAge(member.date_of_birth);
            if (age < 18) {
                if (!member.guardian_name || !member.guardian_mobile) {
                    newErrors[`member_${i}_guardian`] = "Guardian Name & Mobile required";
                    hasError = true;
                }
            }
        }

        setErrors(newErrors);
        if (hasError) {
            // Scroll to top or first error could be nice, but simple state update for now
            return;
        }

        onNext();
    };

    const handlePrimaryCaseManagerChange = (field: 'name' | 'email', value: string) => {
        const currentManager = primaryProfile.case_manager || { name: '', email: '' };
        updatePrimaryProfile({
            case_manager: {
                ...currentManager,
                [field]: value
            }
        });
        clearError('primary_case_manager');
    };

    // --- Family Member Handlers ---

    const updateMember = (index: number, field: keyof FamilyMember, value: any) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        updateMembers(newMembers);
        if (field === 'first_name') clearError(`member_${index}_firstname`);
        if (field === 'guardian_name' || field === 'guardian_mobile') clearError(`member_${index}_guardian`);
    };

    const handleMemberCaseManagerChange = (index: number, field: 'name' | 'email', value: string) => {
        const member = members[index];
        const currentManager = member.case_manager || { name: '', email: '' };
        const updatedCaseManager = {
            ...currentManager,
            [field]: value
        };
        updateMember(index, 'case_manager', updatedCaseManager);
        clearError(`member_${index}_casemanager`);
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Family Details</h3>
                <p className="text-gray-500 text-sm">Review and update details for all family members.</p>
            </div>

            <div className="space-y-8">

                {/* --- MEMBER 1 (Primary Profile) --- */}
                <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-brand-primary/80 relative animate-fade-in">
                    <div className="absolute top-0 right-0 p-2 bg-brand-primary/10 rounded-bl-xl text-xs font-bold text-brand-primary">
                        HEAD MEMBER
                    </div>

                    <h4 className="font-bold text-brand-dark mb-4 flex items-center text-lg">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center mr-3 text-sm font-bold shadow-lg shadow-brand-primary/30">
                            1
                        </div>
                        {primaryProfile.first_name} {primaryProfile.last_name}
                    </h4>

                    <div className="mb-6 ml-11 -mt-3 text-sm text-gray-500 space-y-1">
                        <p className="flex items-center">
                            <span className="font-medium text-gray-400 w-16 text-xs uppercase tracking-wider">Email:</span>
                            {primaryProfile.email}
                        </p>
                        <p className="flex items-center">
                            <span className="font-medium text-gray-400 w-16 text-xs uppercase tracking-wider">Mobile:</span>
                            {primaryProfile.mobile}
                        </p>
                        <p className="flex items-center">
                            <span className="font-medium text-gray-400 w-16 text-xs uppercase tracking-wider">DOB:</span>
                            {primaryProfile.date_of_birth}
                        </p>
                    </div>

                    {/* RCEB Toggle */}
                    <div className="mb-4">
                        <label className="flex items-center space-x-3 cursor-pointer w-fit p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input
                                type="checkbox"
                                checked={primaryProfile.rceb_flag}
                                onChange={(e) => handlePrimaryRcebChange(e.target.checked)}
                                className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary border-gray-300"
                            />
                            <span className="font-medium text-gray-700">RCEB (Regional Center of the East Bay) Client</span>
                        </label>
                    </div>

                    {/* Case Manager */}
                    <CaseManagerForm
                        rcebFlag={primaryProfile.rceb_flag}
                        caseManager={primaryProfile.case_manager}
                        onChange={handlePrimaryCaseManagerChange}
                        error={errors['primary_case_manager']}
                    />
                </div>

                {/* --- ADDITIONAL FAMILY MEMBERS --- */}
                {members.map((member, index) => {
                    const displayIndex = index + 2; // Starts from 2
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 relative animate-fade-in group hover:shadow-lg transition-shadow">

                            <h4 className="font-bold text-brand-dark mb-4 flex items-center text-lg">
                                <div className="w-8 h-8 rounded-full bg-brand-secondary text-white flex items-center justify-center mr-3 text-sm font-bold shadow-lg shadow-brand-secondary/30">
                                    {displayIndex}
                                </div>
                                Family Member #{displayIndex}
                            </h4>

                            {/* Basic Info Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                                    <input
                                        value={member.first_name}
                                        onChange={(e) => updateMember(index, 'first_name', e.target.value)}
                                        required
                                        className={`w-full px-4 py-2 rounded-lg border ${errors[`member_${index}_firstname`] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none`}
                                    />
                                    {errors[`member_${index}_firstname`] && <p className="text-xs text-red-500 mt-1">{errors[`member_${index}_firstname`]}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                                    <input
                                        value={member.last_name}
                                        onChange={(e) => updateMember(index, 'last_name', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={member.email}
                                        onChange={(e) => updateMember(index, 'email', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={member.date_of_birth}
                                        onChange={(e) => updateMember(index, 'date_of_birth', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Guardian & Emergency Contact (Conditional for < 18) */}
                            {(() => {
                                const age = calculateAge(member.date_of_birth);
                                if (age < 18) {
                                    return (
                                        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                            <h5 className="font-bold text-orange-800 text-xs mb-3 flex items-center justify-between uppercase tracking-wide">
                                                <span>Guardian Details (Under 18)</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateMember(index, 'guardian_name', `${primaryProfile.first_name} ${primaryProfile.last_name}`);
                                                        updateMember(index, 'guardian_mobile', primaryProfile.mobile);
                                                    }}
                                                    className="text-[10px] bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                                                >
                                                    Copy Head Member
                                                </button>
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian Name</label>
                                                    <input
                                                        value={member.guardian_name || ''}
                                                        onChange={(e) => updateMember(index, 'guardian_name', e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                                        placeholder="Parent/Guardian Name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian Mobile</label>
                                                    <input
                                                        value={member.guardian_mobile || ''}
                                                        onChange={(e) => updateMember(index, 'guardian_mobile', e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                                        placeholder="(555) 123-4567"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact Number</label>
                                                    <input
                                                        value={member.emergency_mobile || ''}
                                                        onChange={(e) => updateMember(index, 'emergency_mobile', e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                                        placeholder="(555) 987-6543"
                                                    />
                                                </div>
                                            </div>
                                            {errors[`member_${index}_guardian`] && (
                                                <div className="mt-3 px-3 py-2 bg-red-100 border border-red-200 rounded-lg text-red-700 text-xs font-bold">
                                                    {errors[`member_${index}_guardian`]}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="border-t border-gray-100 pt-4">
                                {/* RCEB Toggle */}
                                <div className="mb-4">
                                    <label className="flex items-center space-x-3 cursor-pointer w-fit p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={member.rceb_flag}
                                            onChange={(e) => updateMember(index, 'rceb_flag', e.target.checked)}
                                            className="w-5 h-5 text-brand-secondary rounded focus:ring-brand-secondary border-gray-300"
                                        />
                                        <span className="font-medium text-gray-700">RCEB (Regional Center of the East Bay) Client</span>
                                    </label>
                                </div>

                                {/* Case Manager */}
                                <CaseManagerForm
                                    rcebFlag={member.rceb_flag}
                                    caseManager={member.case_manager}
                                    onChange={(f, v) => handleMemberCaseManagerChange(index, f, v)}
                                    error={errors[`member_${index}_casemanager`]}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <button type="button" onClick={onPrev} className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                    Back
                </button>
                <button type="button" onClick={handleNext} className="btn-primary flex items-center">
                    Next Step
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
