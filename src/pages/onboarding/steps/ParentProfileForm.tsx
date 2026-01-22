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
      alert("Please enter a valid number of family members (minimum 1).");
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
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Number of Family Members to Enroll (including yourself)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="20"
                value={totalMembers}
                onChange={handleMemberCountChange}
                required
                className="w-40 px-5 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
              />
             
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



