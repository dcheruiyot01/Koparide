import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { ProtectionType } from './types';
import { PROTECTION_PRICES, PROTECTION_DESCRIPTIONS } from './types';

interface ProtectionPlansProps {
    selectedProtection: ProtectionType;
    onProtectionChange: (type: ProtectionType) => void;
}

const formatCurrency = (amount: number): string => {
    return `Ksh ${amount.toFixed(2)}`;
};

export const ProtectionPlans: React.FC<ProtectionPlansProps> = ({
                                                                    selectedProtection,
                                                                    onProtectionChange,
                                                                }) => {
    const protectionTypes: ProtectionType[] = ["none", "standard", "enhanced"];

    return (
        <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Protection Plan</h3>
                <ShieldCheck className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-3">
                {protectionTypes.map((type) => (
                    <label
                        key={type}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                            selectedProtection === type
                                ? 'bg-[#00A699]/5 border border-[#00A699]'
                                : 'hover:bg-gray-50 border border-transparent'
                        }`}
                    >
                        <input
                            type="radio"
                            name="protection"
                            checked={selectedProtection === type}
                            onChange={() => onProtectionChange(type)}
                            className="mt-1 text-[#00A699] focus:ring-[#00A699]"
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium capitalize">
                                        {type === 'none' ? 'No Protection' : `${type} Protection`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {PROTECTION_DESCRIPTIONS[type]}
                                    </p>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(PROTECTION_PRICES[type])}
                                </div>
                            </div>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};