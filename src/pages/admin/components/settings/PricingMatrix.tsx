
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

    const handleChange = (ageGroup: string, typeId: string, val: number) => {
        // Immediately call the API for this specific field
        onPriceChange(ageGroup, typeId, val);
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                                Category
                            </th>
                            {subscriptionTypes.map(type => (
                                <th key={type.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {type.type_name}
                                    <div className="text-[10px] font-normal lowercase text-gray-400">
                                        {type.billing_interval_count} {type.billing_interval_unit}(s)
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {AGE_GROUPS_UI.map((ageGroup: string) => (
                            <tr key={ageGroup}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                    {ageGroup}
                                </td>
                                {subscriptionTypes.map(type => {
                                    const key = `${ageGroup}-${type.id}`;
                                    const displayValue = inputValues[key] !== undefined ? inputValues[key] : (prices[key] ?? '');
                                    return (
                                        <td key={type.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={loading}
                                                    className="block w-full rounded-md border-gray-300 pl-7 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                                                    placeholder="0.00"
                                                    value={displayValue}
                                                    onChange={(e) => {
                                                        // Update local state as user types
                                                        setInputValues(prev => ({ ...prev, [key]: e.target.value }));
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val > 0) {
                                                            handleChange(ageGroup, type.id, val);
                                                        }
                                                        // Clear local input state after blur
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
            
            <div className="text-sm text-gray-500 mt-2">
                💡 Tip: Enter a price and press Tab or click outside the field to save automatically
            </div>
        </div>
    );
};
