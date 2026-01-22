import React, { useState } from 'react';

// Pricing Data Types
type PricingRow = {
  id: string;
  category: string;
  monthly12mo: number;
  sixMonth: number;
  threeMonth: number;
};

// RCEB Rule Types
type RcebRule = {
    id: string;
    description: string;
    enabled: boolean;
};


export const SettingsView: React.FC = () => {
    
  // 1. Pricing Structure State
  const [pricingData, setPricingData] = useState<PricingRow[]>([
    { id: '1', category: 'Individual', monthly12mo: 41.50, sixMonth: 333, threeMonth: 195.50 },
    { id: '2', category: 'Individual Plus', monthly12mo: 66.50, sixMonth: 513, threeMonth: 294.50 },
    { id: '3', category: 'Senior 65+', monthly12mo: 37.35, sixMonth: 299.70, threeMonth: 175.95 },
    { id: '4', category: 'Add 18yr+', monthly12mo: 35.00, sixMonth: 228, threeMonth: 120.00 },
    { id: '5', category: '13yr–17yr', monthly12mo: 30.00, sixMonth: 200, threeMonth: 105.00 },
    { id: '6', category: '6mo–12yr', monthly12mo: 20.00, sixMonth: 150, threeMonth: 90.00 },
  ]);

  // 2. Rules State
  const [generalRules, setGeneralRules] = useState<RcebRule[]>([
      { id: 'g1', description: 'Mandatory shower before entering the pool', enabled: true },
      { id: 'g2', description: 'Appropriate swimwear required at all times', enabled: true },
      { id: 'g3', description: 'No glass containers in the pool area', enabled: true },
      { id: 'g4', description: 'Children under 12 must be supervised', enabled: true },
      { id: 'g5', description: 'Wipe down gym equipment after use', enabled: true },
      { id: 'g6', description: '30-minute limit on cardio machines during peak hours', enabled: false },
  ]);

  const [rcebRules, setRcebRules] = useState<RcebRule[]>([
      { id: 'r1', description: 'Maximum 1 hour per week per service', enabled: true },
      { id: 'r2', description: 'Services run in 4-week cycles', enabled: true },
      { id: 'r3', description: 'Services auto-renew monthly unless otherwise specified', enabled: true },
      { id: 'r4', description: 'RCEB clients may book without payment', enabled: true },
  ]);

  const handlePriceChange = (id: string, field: keyof PricingRow, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricingData(prev => prev.map(row => 
        row.id === id ? { ...row, [field]: numValue } : row
    ));
  };
  
  const toggleRcebRule = (id: string) => {
      setRcebRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ));
  };

  const toggleGeneralRule = (id: string) => {
      setGeneralRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ));
  };


  return (
    <div className="h-full overflow-auto bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* SECTION 1: PRICE SETTINGS */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Pricing Structure (Age-Based Memberships)</h3>
             <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
               Demo Configuration
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">12 mo (Monthly)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">6 mo (PIF)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3 mo (PIF)</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {pricingData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {row.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="relative rounded-md shadow-sm max-w-[120px]">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                    type="number"
                                    className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"
                                    value={row.monthly12mo}
                                    onChange={(e) => handlePriceChange(row.id, 'monthly12mo', e.target.value)}
                                    />
                                </div>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="relative rounded-md shadow-sm max-w-[120px]">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                    type="number"
                                    className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"
                                    value={row.sixMonth}
                                    onChange={(e) => handlePriceChange(row.id, 'sixMonth', e.target.value)}
                                    />
                                </div>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="relative rounded-md shadow-sm max-w-[120px]">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                    type="number"
                                    className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"
                                    value={row.threeMonth}
                                    onChange={(e) => handlePriceChange(row.id, 'threeMonth', e.target.value)}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: General Rules */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">General Facility Rules</h3>
          </div>
          <div className="p-6">
              <div className="space-y-4">
                  {generalRules.map((rule) => (
                      <div key={rule.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                                id={`gen-rule-${rule.id}`}
                                name={`gen-rule-${rule.id}`}
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={() => toggleGeneralRule(rule.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                              <label htmlFor={`gen-rule-${rule.id}`} className={`font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                  {rule.description}
                              </label>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        {/* SECTION 3: RCEB Rules */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">RCEB Service Rules</h3>
          </div>
          <div className="p-6">
              <div className="space-y-4">
                  {rcebRules.map((rule) => (
                      <div key={rule.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                                id={`rule-${rule.id}`}
                                name={`rule-${rule.id}`}
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={() => toggleRcebRule(rule.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                              <label htmlFor={`rule-${rule.id}`} className={`font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                  {rule.description}
                              </label>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};
