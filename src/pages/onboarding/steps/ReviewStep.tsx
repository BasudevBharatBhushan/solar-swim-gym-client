import React, { useState, useEffect } from 'react';
import type { OnboardingRequest } from '../../../types/api.types';
import { onboardingApi, servicesApi } from '../../../services/api.service';
import { useNavigate } from 'react-router-dom';
import { calculateMemberPrice, getAgeCategory, getAge } from '../../../utils/pricing.utils';
import type { TenureType } from '../../../utils/pricing.utils';
import { ContractModal } from '../../../components/ContractModal';

interface ReviewStepProps {
  data: OnboardingRequest;
  onPrev: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onPrev }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [showContractModal, setShowContractModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
  }, []);

  useEffect(() => {
    servicesApi.list()
      .then(res => {
         const map: Record<string, string> = {};
         if (res.services) {
            res.services.forEach(s => map[s.id] = s.name);
         }
         setServicesMap(map);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = () => {
    // Open contract modal instead of directly submitting
    setShowContractModal(true);
  };

  const handlePaymentComplete = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await onboardingApi.complete(data);
      if (response.success) {
        alert('Onboarding Complete! Please check your email for activation links.');
        navigate('/login');
      } else {
        setError(response.message || 'Onboarding failed');
      }
    } catch (err: any) {
      setError(err.message || 'Onboarding failed');
    } finally {
      setSubmitting(false);
      setShowContractModal(false);
    }
  };

  const totalMembers = 1 + data.family_members.length;

  const calculateTotal = () => {
    let total = 0;
    total += calculateMemberPrice(
      data.primary_profile.date_of_birth, 
      true, 
      totalMembers, 
      (data.primary_profile.tenure as TenureType) || '12mo', 
      data.primary_profile.rceb_flag
    );
    data.family_members.forEach(m => {
        total += calculateMemberPrice(
            m.date_of_birth,
            false,
            totalMembers,
            (m.tenure as TenureType) || '12mo',
            m.rceb_flag
        );
    });
    return total;
  };

  const ServiceList = ({ ids }: { ids?: string[] }) => {
      if (!ids || ids.length === 0) return <span className="text-xs text-gray-400 italic">None selected</span>;
      return (
        <div className="flex flex-wrap gap-1">
            {ids.map((sid, idx) => (
                <span key={idx} className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded text-xs text-brand-primary font-medium">
                    {servicesMap[sid] || 'Loading...'}
                </span>
            ))}
        </div>
      );
  };

  const CaseManagerDisplay = ({ cm }: { cm?: { name: string; email: string } }) => (
      <div className="mt-2 text-xs bg-blue-50 p-2 rounded border border-blue-100/50">
          <div className="font-semibold text-blue-800">Case Manager:</div>
          <div className="text-blue-600">{cm?.name} ({cm?.email})</div>
      </div>
  );

  const getAgeCategoryLabel = (dob: string): string => {
    const age = getAge(dob);
    const category = getAgeCategory(dob);
    
    if (category === 'senior') return `Senior (${age} years, 65+)`;
    if (category === 'adult') return `Adult (${age} years, 18+)`;
    if (category === 'teen') return `Teen (${age} years, 13-17)`;
    return `Child (${age} years, 6mo-12yr)`;
  };

  const getTenureLabel = (tenure?: string): string => {
    const t = tenure || '12mo';
    if (t === '12mo') return '12 Month (Monthly)';
    if (t === '6mo') return '6 Month (Pay in Full)';
    return '3 Month (Pay in Full)';
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-gray-800">Review & Submit</h3>
        <p className="text-gray-500 text-sm">Please verify your information before completing the onboarding process.</p>
      </div>

      <div className="space-y-6">
        
        {/* Plan Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-md">
            <h4 className="font-bold text-lg mb-2 flex justify-between items-center text-blue-900">
                <span>Plan Summary</span>
                <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider font-bold">Multi-Plan Membership</span>
            </h4>
            <div className="flex justify-between items-end border-t border-blue-200 pt-4 mt-2">
                <div>
                   <div className="text-sm text-blue-700 font-semibold">Total Members: {totalMembers}</div>
                   <div className="text-xs text-blue-600 mt-1">Includes Services & Membership Fees</div>
                </div>
                <div className="text-3xl font-bold text-brand-primary">
                    ${calculateTotal().toFixed(2)}
                </div>
            </div>
        </div>

        {/* Parent Profile Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
           <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-lg text-brand-primary">Primary Account</h4>
                    {data.primary_profile.rceb_flag && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            RCEB CLIENT
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <span className="block font-bold text-gray-800">
                        ${calculateMemberPrice(data.primary_profile.date_of_birth, true, totalMembers, (data.primary_profile.tenure as TenureType) || '12mo', data.primary_profile.rceb_flag).toFixed(2)}
                    </span>
                </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
              <div>
                 <dt className="text-gray-500 font-medium">Full Name</dt>
                 <dd className="font-bold text-gray-800">{data.primary_profile.first_name} {data.primary_profile.last_name}</dd>
              </div>
              <div>
                 <dt className="text-gray-500 font-medium">Email Address</dt>
                 <dd className="font-bold text-gray-800 break-all">{data.primary_profile.email}</dd>
              </div>
              <div>
                 <dt className="text-gray-500 font-medium">Age Group</dt>
                 <dd className="font-bold text-gray-800">{getAgeCategoryLabel(data.primary_profile.date_of_birth)}</dd>
              </div>
              <div>
                 <dt className="text-gray-500 font-medium">Plan Tenure</dt>
                 <dd className="font-bold text-brand-primary">{getTenureLabel(data.primary_profile.tenure)}</dd>
              </div>
              {data.primary_profile.rceb_flag && (
                  <div className="sm:col-span-2">
                      <CaseManagerDisplay cm={data.primary_profile.case_manager} />
                  </div>
              )}
              <div className="sm:col-span-2">
                 <dt className="text-gray-500 font-medium mb-2">Services Selected</dt>
                 <dd>
                    <ServiceList ids={data.primary_profile.services} />
                 </dd>
              </div>
           </div>
        </div>

        {/* Family Members Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
           <h4 className="font-bold text-lg text-brand-secondary mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
              Family Members
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{data.family_members.length} Added</span>
           </h4>
           
           {data.family_members.length === 0 ? (
             <p className="text-gray-500 italic text-sm">No family members added.</p>
           ) : (
              <div className="space-y-4">
                 {data.family_members.map((member, i) => (
                   <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                             <div className="w-6 h-6 rounded-full bg-brand-secondary/20 text-brand-secondary flex items-center justify-center text-xs font-bold mr-2">
                             {i + 2}
                             </div>
                             <div>
                                 <div className="font-bold text-gray-800 flex items-center gap-2">
                                     {member.first_name} {member.last_name}
                                     {member.rceb_flag && (
                                         <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-400">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                             </svg>
                                             RCEB
                                         </span>
                                     )}
                                 </div>
                                 <div className="text-xs text-gray-500 mt-0.5">
                                     {getAgeCategoryLabel(member.date_of_birth)}
                                 </div>
                             </div>
                          </div>
                          <div className="font-bold text-gray-800">
                             ${calculateMemberPrice(member.date_of_birth, false, totalMembers, (member.tenure as TenureType) || '12mo', member.rceb_flag).toFixed(2)}
                          </div>
                      </div>
                      
                      <div className="ml-8 space-y-3">
                          <div>
                              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Plan Tenure</div>
                              <div className="text-sm font-bold text-brand-primary">{getTenureLabel(member.tenure)}</div>
                          </div>
                          
                          {member.rceb_flag && (
                              <CaseManagerDisplay cm={member.case_manager} />
                          )}

                          <div>
                             <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Services Selected</div>
                             <ServiceList ids={member.services} />
                          </div>
                      </div>
                   </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center animate-fade-in">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
           </svg>
           {error}
        </div>
      )}

      <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onPrev} 
          className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          disabled={submitting}
        >
          Back
        </button>
        <button 
          type="button" 
          onClick={handleSubmit} 
          className="btn-primary py-3 px-8 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          disabled={submitting}
        >
          {submitting ? (
             <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
             </span>
          ) : 'Complete Payment'}
        </button>
      </div>

      {/* Contract Modal */}
      {showContractModal && (
        <ContractModal
          data={data}
          servicesMap={servicesMap}
          onClose={() => setShowContractModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};
