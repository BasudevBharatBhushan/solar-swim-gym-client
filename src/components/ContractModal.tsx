import React, { useState, useRef, useEffect } from 'react';
import type { OnboardingRequest } from '../types/api.types';
import { getAgeCategory, getAge } from '../utils/pricing.utils';

interface ClientContract {
  id: string;
  name: string;
  ageGroup: string;
  rcebFlag: boolean;
  caseManager?: { name: string; email: string };
  tenure: string;
  services: string[];
  signed: boolean;
}

interface ContractModalProps {
  data: OnboardingRequest;
  servicesMap: Record<string, string>;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  data,
  servicesMap,
  onClose,
  onPaymentComplete
}) => {
  const [clients, setClients] = useState<ClientContract[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize clients from data
  useEffect(() => {
    const clientsList: ClientContract[] = [];

    // Add primary profile
    clientsList.push({
      id: 'primary',
      name: `${data.primary_profile.first_name} ${data.primary_profile.last_name}`,
      ageGroup: getAgeCategoryLabel(data.primary_profile.date_of_birth),
      rcebFlag: data.primary_profile.rceb_flag,
      caseManager: data.primary_profile.case_manager,
      tenure: getTenureLabel(data.primary_profile.tenure),
      services: data.primary_profile.services || [],
      signed: false
    });

    // Add family members
    data.family_members.forEach((member, index) => {
      clientsList.push({
        id: `member-${index}`,
        name: `${member.first_name} ${member.last_name}`,
        ageGroup: getAgeCategoryLabel(member.date_of_birth),
        rcebFlag: member.rceb_flag,
        caseManager: member.case_manager,
        tenure: getTenureLabel(member.tenure),
        services: member.services || [],
        signed: false
      });
    });

    setClients(clientsList);
    setSelectedClientId(clientsList[0]?.id || '');
  }, [data]);

  const getAgeCategoryLabel = (dob: string): string => {
    const age = getAge(dob);
    const category = getAgeCategory(dob);

    if (category === 'senior') return `Senior (${age} years, 65+)`;
    if (category === 'adult') return `Adult (${age} years, 18+)`;
    return `Child (${age} years, 6-17)`;
  };

  const getTenureLabel = (tenure?: string): string => {
    const t = tenure || '12mo';
    if (t === '12mo') return '12 Month (Monthly)';
    if (t === '6mo') return '6 Month (Pay in Full)';
    return '3 Month (Pay in Full)';
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const allSigned = clients.every(c => c.signed);

  // Canvas drawing functions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [selectedClientId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmitContract = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has content
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some(channel => channel !== 0);

    if (!hasSignature) {
      alert('Please provide your signature before submitting.');
      return;
    }

    // Signature is valid (could save to state if needed for backend submission)

    // Mark current client as signed
    setClients(prev => prev.map(c =>
      c.id === selectedClientId ? { ...c, signed: true } : c
    ));

    // Clear canvas for next client
    clearSignature();

    // Auto-select next unsigned client
    const nextUnsigned = clients.find(c => c.id !== selectedClientId && !c.signed);
    if (nextUnsigned) {
      setSelectedClientId(nextUnsigned.id);
    }
  };

  const handlePay = async () => {
    setIsProcessingPayment(true);
    setPaymentProgress(0);

    // Simulate payment processing with progress
    const interval = setInterval(() => {
      setPaymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProcessingPayment(false);
            onPaymentComplete();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="!text-white text-2xl font-bold">Contract Signing</h2>
            <p className="text-sm text-white/80 mt-1">Please review and sign contracts for all clients</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Section - Contract View (2/3) */}
          <div className="w-2/3 border-r border-gray-200 flex flex-col">
            {/* Contract Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedClient && (
                <div className="space-y-6">
                  {/* Client Info Header */}
                  <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        Membership Contract
                      </h3>
                      {selectedClient.signed && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          SIGNED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Client Name:</span>
                        <p className="font-bold text-gray-800 mt-1">{selectedClient.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Age Group:</span>
                        <p className="font-bold text-gray-800 mt-1">{selectedClient.ageGroup}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Payment Tenure:</span>
                        <p className="font-bold text-brand-primary mt-1">{selectedClient.tenure}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">RCEB Status:</span>
                        <p className="font-bold text-gray-800 mt-1">
                          {selectedClient.rcebFlag ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              RCEB Client
                            </span>
                          ) : 'Not RCEB'}
                        </p>
                      </div>
                    </div>

                    {selectedClient.rcebFlag && selectedClient.caseManager && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <span className="text-gray-600 font-medium text-sm">Case Manager:</span>
                        <p className="font-bold text-gray-800 mt-1">{selectedClient.caseManager.name}</p>
                        <p className="text-sm text-gray-600">{selectedClient.caseManager.email}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <span className="text-gray-600 font-medium text-sm">Selected Services:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedClient.services.length > 0 ? (
                          selectedClient.services.map((sid, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-sm text-brand-primary font-medium">
                              {servicesMap[sid] || 'Loading...'}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">No services selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dummy Contract Content */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-700 leading-relaxed">
                    <h4 className="font-bold text-lg text-gray-800 mb-4">Terms and Conditions</h4>

                    <p className="mb-4">
                      This Membership Agreement ("Agreement") is entered into between Solar Swim & Gym ("Facility") and <strong>{selectedClient.name}</strong> ("Member").
                    </p>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">1. Membership Details</h5>
                    <p className="mb-4">
                      The Member is enrolling in a <strong>{selectedClient.tenure}</strong> membership plan.
                      The Member falls under the <strong>{selectedClient.ageGroup}</strong> category.
                      {selectedClient.rcebFlag && ' This membership is designated as an RCEB-funded membership.'}
                    </p>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">2. Services Included</h5>
                    <p className="mb-4">
                      The Member has selected the following services as part of their membership:
                    </p>
                    <ul className="list-disc list-inside mb-4 ml-4">
                      {selectedClient.services.length > 0 ? (
                        selectedClient.services.map((sid, idx) => (
                          <li key={idx}>{servicesMap[sid] || 'Service'}</li>
                        ))
                      ) : (
                        <li>Base membership access</li>
                      )}
                    </ul>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">3. Payment Terms</h5>
                    <p className="mb-4">
                      Payment is due according to the selected tenure plan. The Member agrees to pay all fees associated with the membership and selected services in a timely manner.
                    </p>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">4. Facility Rules</h5>
                    <p className="mb-4">
                      The Member agrees to abide by all facility rules and regulations. The Facility reserves the right to terminate membership for violations of facility policies.
                    </p>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">5. Liability Waiver</h5>
                    <p className="mb-4">
                      The Member acknowledges that participation in physical activities involves inherent risks. The Member agrees to release the Facility from any liability for injuries sustained during the use of facilities or participation in programs.
                    </p>

                    <h5 className="font-bold text-gray-800 mt-6 mb-2">6. Cancellation Policy</h5>
                    <p className="mb-4">
                      Membership cancellation requests must be submitted in writing at least 30 days prior to the next billing cycle. Refunds are subject to the terms of the selected payment plan.
                    </p>

                    {selectedClient.rcebFlag && (
                      <>
                        <h5 className="font-bold text-gray-800 mt-6 mb-2">7. RCEB Funding Acknowledgment</h5>
                        <p className="mb-4">
                          The Member acknowledges that this membership is funded through the Regional Center of the East Bay (RCEB).
                          The Member agrees to comply with all RCEB requirements and reporting obligations.
                          Case Manager: <strong>{selectedClient.caseManager?.name}</strong> ({selectedClient.caseManager?.email}).
                        </p>
                      </>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-300">
                      <p className="text-xs text-gray-500 italic">
                        By signing below, the Member acknowledges that they have read, understood, and agree to be bound by the terms and conditions of this Agreement.
                      </p>
                    </div>
                  </div>

                  {/* Signature Section */}
                  {!selectedClient.signed && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <h4 className="font-bold text-gray-800 mb-4">Digital Signature</h4>
                      <div className="mb-4">
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair"
                        />
                        <p className="text-xs text-gray-500 mt-2">Sign above using your mouse or touchpad</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={clearSignature}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleSubmitContract}
                          className="flex-1 px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-bold shadow-md"
                        >
                          Submit Contract
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Client List (1/3) */}
          <div className="w-1/3 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-gray-800">Clients ({clients.length})</h3>
              <p className="text-xs text-gray-500 mt-1">
                {clients.filter(c => c.signed).length} of {clients.length} signed
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedClientId === client.id
                      ? 'border-brand-primary bg-brand-primary/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        {client.name}
                        {client.rcebFlag && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
                            RCEB
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{client.ageGroup}</div>
                    </div>
                    {client.signed && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Section */}
            <div className="p-4 border-t border-gray-200 bg-white space-y-3">
              {isProcessingPayment ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 mb-2">
                      <svg className="animate-spin h-6 w-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-800">Processing payment...</p>
                    <p className="text-xs text-gray-500 mt-1">{paymentProgress}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-brand-primary to-brand-secondary h-full transition-all duration-300 ease-out"
                      style={{ width: `${paymentProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlePay}
                    disabled={!allSigned}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${allSigned
                        ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-gray-300 cursor-not-allowed'
                      }`}
                  >
                    {allSigned ? 'Pay Now' : 'Complete All Contracts'}
                  </button>
                  {!allSigned && (
                    <p className="text-xs text-center text-gray-500">
                      All clients must sign their contracts before payment
                    </p>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                disabled={isProcessingPayment}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
