import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
    // You might want to pass email/contact details here to simulate sending
}

export const AddClientStep6_Complete: React.FC<Props> = () => {

    const handleAction = (action: string) => {
        alert(`${action} triggered (Simulation)`);
    };

    return (
        <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h3 className="text-3xl font-bold text-gray-900 mb-2">Onboarding Complete!</h3>
            <p className="text-gray-500 mb-10 max-w-md mx-auto">
                The client account and subscriptions have been successfully created. You can now perform the following actions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
                <button
                    onClick={() => handleAction('Send Contract Email')}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
                >
                    <div className="mb-2 text-indigo-600 group-hover:scale-110 transition-transform origin-left">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-gray-800">Send Contract</h4>
                    <p className="text-xs text-gray-500 mt-1">Email the digital contract for e-signature.</p>
                </button>

                <button
                    onClick={() => handleAction('Send Payment Link')}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
                >
                    <div className="mb-2 text-green-600 group-hover:scale-110 transition-transform origin-left">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-gray-800">Payment Link</h4>
                    <p className="text-xs text-gray-500 mt-1">Send secure link to setup payment method.</p>
                </button>

                <button
                    onClick={() => handleAction('Send Activation Email')}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
                >
                    <div className="mb-2 text-blue-600 group-hover:scale-110 transition-transform origin-left">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-gray-800">Activate Account</h4>
                    <p className="text-xs text-gray-500 mt-1">Send password setup / activation email.</p>
                </button>
            </div>

            <Link to="/admin" className="inline-block px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
                Return to Dashboard
            </Link>
        </div>
    );
};
