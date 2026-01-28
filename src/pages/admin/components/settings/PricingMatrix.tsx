
import React from 'react';
import type { SubscriptionType } from '../../../../types/api.types';
import { AGE_GROUPS_UI } from '../../../../constants/ageGroups';


interface PricingMatrixProps {
    subscriptionTypes: SubscriptionType[];
    prices: Record<string, number>; // Key: `${ageGroup}-${subscriptionTypeId}`, Value: price
    onPriceChange: (ageGroup: string, subscriptionTypeId: string, price: number) => void;
    loading?: boolean;
}

export const PricingMatrix: React.FC<PricingMatrixProps> = ({
    subscriptionTypes,
    prices,
    onPriceChange,
    loading = false
}) => {
    // Local state to track current input values (for typing)
    const [inputValues, setInputValues] = React.useState<Record<string, string>>({});
    const [focusedInput, setFocusedInput] = React.useState<string | null>(null);

    const handleChange = (ageGroup: string, typeId: string, val: number) => {
        // Immediately call the API for this specific field
        onPriceChange(ageGroup, typeId, val);
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest sticky left-0 bg-gray-50 z-10 w-48">
                                Age Group / Category
                            </th>
                            {subscriptionTypes.map(type => (
                                <th key={type.id} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[160px]">
                                    <div className="flex flex-col items-center">
                                        <span>{type.type_name}</span>
                                        <span className="mt-1 px-2 py-0.5 bg-white rounded-full text-[10px] text-gray-400 border border-gray-100 shadow-sm font-medium normal-case">
                                            {type.billing_interval_count} {type.billing_interval_unit}(s)
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {AGE_GROUPS_UI.map((ageGroup: string) => (
                            <tr key={ageGroup} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 sticky left-0 bg-white">
                                    {ageGroup}
                                </td>
                                {subscriptionTypes.map(type => {
                                    const key = `${ageGroup}-${type.id}`;
                                    const displayValue = inputValues[key] !== undefined ? inputValues[key] : (prices[key] ?? '');
                                    const isFocused = focusedInput === key;

                                    return (
                                        <td key={type.id} className="px-4 py-3 whitespace-nowrap">
                                            <div className={`relative rounded-xl transition-all duration-200 ${isFocused ? 'ring-2 ring-indigo-500 shadow-sm' : ''}`}>
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <span className={`${isFocused ? 'text-indigo-500' : 'text-gray-400'} text-sm font-medium transition-colors`}>$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={loading}
                                                    className={`block w-full rounded-xl border-none pl-8 pr-4 py-3 text-sm font-semibold transition-all
                                                        ${isFocused ? 'bg-white text-indigo-900' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
                                                        focus:ring-0 placeholder-gray-300 disabled:opacity-50 disabled:bg-gray-100
                                                    `}
                                                    placeholder="0.00"
                                                    value={displayValue}
                                                    onFocus={() => setFocusedInput(key)}
                                                    onChange={(e) => {
                                                        setInputValues(prev => ({ ...prev, [key]: e.target.value }));
                                                    }}
                                                    onBlur={(e) => {
                                                        setFocusedInput(null);
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val >= 0 && type.id) {
                                                            handleChange(ageGroup, type.id, val);
                                                        }
                                                        setInputValues(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[key];
                                                            return newState;
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 px-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Prices update automatically when you click outside the field</span>
            </div>
        </div>
    );
};
