import React, { useState, useEffect } from 'react';
import type { FamilyMember, PrimaryProfile, OnboardingRequest, Service } from '../../../types/api.types';
import { servicesApi } from '../../../services/api.service';
import { calculateMemberPrice, getAgeCategory } from '../../../utils/pricing.utils';
import type { TenureType } from '../../../utils/pricing.utils';

interface ServicesStepProps {
  formData: OnboardingRequest;
  updatePrimaryProfile: (data: Partial<PrimaryProfile>) => void;
  updateMembers: (members: FamilyMember[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const ServicesStep: React.FC<ServicesStepProps> = ({
  formData,
  updatePrimaryProfile,
  updateMembers,
  onNext,
  onPrev
}) => {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [showPricingInfo, setShowPricingInfo] = useState(false);

  useEffect(() => {
    servicesApi.list()
      .then(res => setAvailableServices(res.services || []))
      .catch(console.error);
  }, []);

  const { primary_profile, family_members } = formData;
  const totalMembers = 1 + family_members.length;

  const togglePrimaryService = (serviceId: string) => {
    const currentServices = primary_profile.services || [];
    const newServices = currentServices.includes(serviceId)
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    updatePrimaryProfile({ services: newServices });
  };

  const toggleMemberService = (index: number, serviceId: string) => {
    const newMembers = [...family_members];
    const currentServices = newMembers[index].services || [];
    const newServicesList = currentServices.includes(serviceId)
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    
    newMembers[index] = { ...newMembers[index], services: newServicesList };
    updateMembers(newMembers);
  };

  const updatePrimaryTenure = (tenure: TenureType) => {
    updatePrimaryProfile({ tenure });
  };

  const updateMemberTenure = (index: number, tenure: TenureType) => {
    const newMembers = [...family_members];
    newMembers[index] = { ...newMembers[index], tenure };
    updateMembers(newMembers);
  };

  const calculateTotal = () => {
    let total = 0;
    // Primary
    total += calculateMemberPrice(
      primary_profile.date_of_birth,
      true,
      totalMembers,
      (primary_profile.tenure as TenureType) || '12mo',
      primary_profile.rceb_flag
    );
    // Family
    family_members.forEach(member => {
      total += calculateMemberPrice(
        member.date_of_birth,
        false,
        totalMembers,
        (member.tenure as TenureType) || '12mo',
        member.rceb_flag
      );
    });
    return total;
  };

  const TenureSelector = ({ current, onChange }: { current?: string, onChange: (t: TenureType) => void }) => {
    // Set default to 12mo if not set
    const selectedTenure = current || '12mo';
    
    return (
      <div className="flex gap-2 mt-4">
          {['12mo', '6mo', '3mo'].map((t) => (
              <button
                  key={t}
                  onClick={() => onChange(t as TenureType)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      selectedTenure === t 
                      ? 'bg-brand-primary text-white border-brand-primary' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-brand-primary'
                  }`}
              >
                  {t === '12mo' ? '12 Month (Monthly)' : t === '6mo' ? '6 Month (Pay in Full)' : '3 Month (Pay in Full)'}
              </button>
          ))}
      </div>
    );
  };

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-2xl font-bold text-gray-800">Select Services & Tenure</h3>
            <p className="text-gray-500 text-sm">Choose services and plan tenure for each member.</p>
        </div>
        <button 
            onClick={() => setShowPricingInfo(!showPricingInfo)}
            className="text-brand-primary hover:text-brand-dark transition-colors p-2 rounded-full hover:bg-brand-primary/5"
            title="View Pricing Structure"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
      </div>

      {/* Modern Pricing Table */}
      {showPricingInfo && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl animate-scale-in overflow-x-auto">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-brand-primary rounded-full mr-2"></span>
                Pricing Structure Reference
            </h4>
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-4 py-3 font-semibold text-gray-600 rounded-tl-xl border-b border-gray-100">Category</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-100 italic">12 Month (Monthly)</th>
                        <th className="px-4 py-3 font-semibold border-b border-gray-100 italic text-brand-primary">6 Month (Pay in Full)</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 rounded-tr-xl border-b border-gray-100 italic">3 Month (Pay in Full)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">Individual</td>
                        <td className="px-4 py-3 text-gray-500">$41.50</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$333</td>
                        <td className="px-4 py-3 text-gray-500">$195.50</td>
                    </tr>
                    <tr className="bg-brand-primary/5">
                        <td className="px-4 py-3 font-medium text-gray-700">Individual Plus</td>
                        <td className="px-4 py-3 text-gray-500">$66.50</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$513</td>
                        <td className="px-4 py-3 text-gray-500">$294.50</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">Senior 65+</td>
                        <td className="px-4 py-3 text-gray-500">$37.35</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$299.70</td>
                        <td className="px-4 py-3 text-gray-500">$175.95</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">Add 18yr+</td>
                        <td className="px-4 py-3 text-gray-500">$35</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$228</td>
                        <td className="px-4 py-3 text-gray-500">$120</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">13yr–17yr</td>
                        <td className="px-4 py-3 text-gray-500">$30</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$200</td>
                        <td className="px-4 py-3 text-gray-500">$105</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">6mo–12yr</td>
                        <td className="px-4 py-3 text-gray-500">$20</td>
                        <td className="px-4 py-3 text-brand-primary font-bold">$150</td>
                        <td className="px-4 py-3 text-gray-500">$90</td>
                    </tr>
                </tbody>
            </table>
            <p className="text-[10px] text-gray-400 mt-4 italic">* RCEB clients are not charged ($0.00). All prices are in USD.</p>
        </div>
      )}
      
      {/* RCEB Global Banner if applicable */}
      {(primary_profile.rceb_flag || family_members.some(m => m.rceb_flag)) && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start space-x-3 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                  <h4 className="font-bold text-green-800 text-sm">RCEB Service Rules</h4>
                  <ul className="text-xs text-green-700 mt-1 list-disc list-inside space-y-1">
                      <li>Maximum 1 hour per week per service</li>
                      <li>Services run in 4-week cycles</li>
                      <li>Services auto-renew monthly unless otherwise specified</li>
                      <li>RCEB clients may book without payment</li>
                  </ul>
              </div>
          </div>
      )}

      <div className="space-y-6">
        {/* Primary Member */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold mr-3 shadow-lg shadow-brand-primary/20">
                        1
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">{primary_profile.first_name} {primary_profile.last_name}</h4>
                        <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                {primary_profile.rceb_flag ? 'RCEB Client' : getAgeCategory(primary_profile.date_of_birth)}
                            </span>
                             <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase">
                                 {primary_profile.tenure === '12mo' ? '12 Month' : primary_profile.tenure === '6mo' ? '6 Month' : '3 Month'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-baseline">
                     <span className="block text-2xl font-bold text-brand-primary">
                        ${calculateMemberPrice(primary_profile.date_of_birth, true, totalMembers, (primary_profile.tenure as TenureType) || '12mo', primary_profile.rceb_flag).toFixed(2)}
                     </span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Cost</span>
                </div>
            </div>

            {/* Tenure Selection */}
            <div className="mb-4">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Plan Tenure</label>
                 <TenureSelector current={primary_profile.tenure} onChange={updatePrimaryTenure} />
            </div>

            {/* Services */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Services</label>
                 <div className="flex flex-wrap gap-2">
                    {availableServices.map(service => (
                        <button
                            key={service.id}
                            onClick={() => togglePrimaryService(service.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                (primary_profile.services || []).includes(service.id)
                                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {service.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Family Members */}
        {family_members.map((member, index) => (
             <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-brand-secondary text-white flex items-center justify-center font-bold mr-3 shadow-lg shadow-brand-secondary/20">
                            {index + 2}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">{member.first_name} {member.last_name}</h4>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                    {member.rceb_flag ? 'RCEB Client' : getAgeCategory(member.date_of_birth)}
                                </span>
                                 <span className="text-[10px] font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded uppercase">
                                     {member.tenure === '12mo' ? '12 Month' : member.tenure === '6mo' ? '6 Month' : '3 Month'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-baseline">
                        <span className="block text-2xl font-bold text-brand-primary">
                            ${calculateMemberPrice(member.date_of_birth, false, totalMembers, (member.tenure as TenureType) || '12mo', member.rceb_flag).toFixed(2)}
                        </span>
                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Cost</span>
                    </div>
                </div>

                {/* Tenure Selection */}
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Plan Tenure</label>
                    <TenureSelector current={member.tenure} onChange={(t) => updateMemberTenure(index, t)} />
                </div>

                {/* Services */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Services</label>
                    <div className="flex flex-wrap gap-2">
                        {availableServices.map(service => (
                            <button
                                key={service.id}
                                onClick={() => toggleMemberService(index, service.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                    (member.services || []).includes(service.id)
                                    ? 'bg-brand-secondary text-white border-brand-secondary shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {service.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ))}

        {/* Total Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl shadow-xl mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <span className="block text-blue-700 text-xs font-bold uppercase tracking-widest">Total Price</span>
                <span className="text-[10px] text-blue-600 italic">Individual member plan totals are combined here.</span>
            </div>
            <div className="text-4xl font-black text-brand-primary">
                ${calculateTotal().toFixed(2)}
            </div>
        </div>

      </div>

      <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
        <button type="button" onClick={onPrev} className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary flex items-center">
          Review
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
