import React, { useState } from 'react';
import type { OnboardingRequest, PrimaryProfile, FamilyMember } from '../../types/api.types';
import { ParentProfileForm } from './steps/ParentProfileForm';
import { FamilyMembersForm } from './steps/FamilyMembersForm';
import { ServicesStep } from './steps/ServicesStep';
import { ReviewStep } from './steps/ReviewStep';

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

export const OnboardingLayout: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingRequest>(initialData);

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
    { id: 1, label: 'Profile' },
    { id: 2, label: 'Family' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'Review' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 pb-10 relative overflow-hidden bg-brand-light">
       {/* Background Decorative Elements using Tailwind v4 compatible classes */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-linear-to-br from-brand-primary/5 via-brand-light to-brand-secondary/5">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-brand-primary/10 blur-[80px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] rounded-full bg-brand-secondary/5 blur-[80px]" />
      </div>

      <div className="w-full max-w-4xl px-4 z-10 flex flex-col h-full">
        {/* Header / Stepper */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-brand-accent mb-6">Join Solar Swim & Gym</h2>
          
          <div className="flex items-center justify-center max-w-2xl mx-auto relative px-4">
            {/* Connecting Lines */}
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden transform -translate-y-1/2">
              <div 
                className="h-full bg-brand-primary transition-all duration-500 ease-in-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            {steps.map((s) => (
              <div key={s.id} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 z-10
                    ${step > s.id ? 'bg-brand-primary border-brand-primary text-white' : 
                      step === s.id ? 'bg-white border-brand-primary text-brand-primary ring-4 ring-brand-primary/20 scale-110' : 
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
                    ${step >= s.id ? 'text-brand-accent' : 'text-gray-400'}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl w-full grow animate-fade-in shadow-2xl shadow-brand-primary/5">
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
              <ServicesStep 
                formData={formData} 
                updatePrimaryProfile={updatePrimaryProfile}
                updateMembers={updateFamilyMembers}
                onNext={nextStep} 
                onPrev={prevStep} 
              />
            </div>
          )}
          {step === 4 && (
            <div className="animate-slide-up">
              <ReviewStep 
                data={formData} 
                onPrev={prevStep} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
