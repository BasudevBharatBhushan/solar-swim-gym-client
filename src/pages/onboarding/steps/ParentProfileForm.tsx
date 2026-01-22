import React, { useState } from 'react';
import type { PrimaryProfile, FamilyMember } from '../../../types/api.types';

interface ParentProfileFormProps {
  data: PrimaryProfile;
  updateData: (data: Partial<PrimaryProfile>) => void;
  familyMembers: FamilyMember[];
  updateFamilyMembers: (members: FamilyMember[]) => void;
  onNext: () => void;
}

const emptyMember: FamilyMember = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  email: '',
  rceb_flag: false,
  services: [],
  tenure: '12mo'
};

export const ParentProfileForm: React.FC<ParentProfileFormProps> = ({
  data,
  updateData,
  familyMembers,
  updateFamilyMembers,
  onNext,
}) => {
  const [totalMembers, setTotalMembers] = useState<string>(String(1 + familyMembers.length));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleMemberCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalMembers(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(totalMembers);
    if (isNaN(count) || count < 1) {
      setError("Min. 1 member required");
      return;
    }

    const additionalMembersCount = count - 1;
    let newMembers = [...familyMembers];
    if (newMembers.length < additionalMembersCount) {
      const toAdd = additionalMembersCount - newMembers.length;
      for (let i = 0; i < toAdd; i++) {
        newMembers.push({ ...emptyMember });
      }
    } else if (newMembers.length > additionalMembersCount) {
      newMembers = newMembers.slice(0, additionalMembersCount);
    }
    updateFamilyMembers(newMembers);
    onNext();
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Primary Contact Information</h3>
        <p className="text-gray-500 text-sm">Please provide your details to create the primary account holder profile.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">First Name</label>
            <input
              name="first_name"
              value={data.first_name}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
              placeholder="e.g. John"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Last Name</label>
            <input
              name="last_name"
              value={data.last_name}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
              placeholder="e.g. Doe"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 ml-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            required
            className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
            placeholder="john.doe@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 ml-1">Password</label>
          <input
            type="password"
            name="password"
            value={data.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
            placeholder="Min. 8 characters"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Mobile Number</label>
            <input
              name="mobile"
              value={data.mobile}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={data.date_of_birth}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
            />
          </div>
        </div>
        
        {/* Guardian & Emergency Contact (Conditional for < 18) */}
        {(() => {
            const birthDate = new Date(data.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (data.date_of_birth && age < 18) {
                return (
                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 animate-fade-in">
                        <div className="mb-4">
                            <h4 className="font-bold text-orange-800 text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Guardian & Emergency Details (Required for under 18)
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Guardian Name</label>
                                <input
                                    name="guardian_name"
                                    value={data.guardian_name || ''}
                                    onChange={handleChange}
                                    required={age < 18}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    placeholder="Parent/Guardian Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Guardian Mobile</label>
                                <input
                                    name="guardian_mobile"
                                    value={data.guardian_mobile || ''}
                                    onChange={handleChange}
                                    required={age < 18}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Emergency Contact Number</label>
                                <input
                                    name="emergency_mobile"
                                    value={data.emergency_mobile || ''}
                                    onChange={handleChange}
                                    required={age < 18}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                                    placeholder="(555) 987-6543"
                                />
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        })()}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Number of Family Members to Enroll (including yourself)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="20"
                value={totalMembers}
                onChange={(e) => {
                  handleMemberCountChange(e);
                  setError(null);
                }}
                required
                className={`w-40 px-5 py-3 rounded-xl border ${error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-white/50 focus:ring-brand-primary/20 focus:border-brand-primary'} focus:bg-white focus:ring-2 transition-all outline-none`}
              />
              {error && (
                <p className="absolute left-0 -bottom-6 text-xs text-red-500 font-medium animate-pulse">
                  {error}
                </p>
              )}
            </div>
          
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            className="btn-primary flex items-center"
          >
            Next Step
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};



