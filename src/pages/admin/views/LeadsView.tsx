import React, { useState } from 'react';

// Dummy Data
const DUMMY_LEADS = [
  { id: 1, name: 'John Doe', email: 'john@example.com', mobile: '555-0101', dob: '1990-05-15', isRceb: true, rcebDetails: 'Regional Center East Bay - Case #123' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', mobile: '555-0102', dob: '1985-08-22', isRceb: false, rcebDetails: '-' },
  { id: 3, name: 'Michael Brown', email: 'michael@example.com', mobile: '555-0103', dob: '2010-11-30', isRceb: true, rcebDetails: 'Golden Gate Regional Center - Case #456' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', mobile: '555-0104', dob: '1995-02-14', isRceb: false, rcebDetails: '-' },
  { id: 5, name: 'Chris Wilson', email: 'chris@example.com', mobile: '555-0105', dob: '2000-06-19', isRceb: true, rcebDetails: 'San Andreas Regional Center - Case #789' },
];

export const LeadsView: React.FC = () => {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);

  const toggleLead = (id: number) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    );
  };

  const handleAction = (action: string) => {
    alert(`${action} for ${selectedLeads.length} leads: ${selectedLeads.join(', ')}`);
    console.log(`${action}`, selectedLeads);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Leads List</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {DUMMY_LEADS.length} Total
          </span>
          
          {selectedLeads.length > 0 && (
            <div className="flex space-x-3 animate-fade-in pl-4 ml-4 border-l border-gray-200">
              <button
                onClick={() => handleAction('Add to Campaign')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Add to Campaign
              </button>
              <button
                onClick={() => handleAction('Send Email')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Send Email
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Import Leads
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    checked={selectedLeads.length === DUMMY_LEADS.length && DUMMY_LEADS.length > 0}
                    onChange={(e) => {
                        if(e.target.checked) {
                            setSelectedLeads(DUMMY_LEADS.map(l => l.id));
                        } else {
                            setSelectedLeads([]);
                        }
                    }}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCEB Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {DUMMY_LEADS.map((lead) => (
              <tr 
                key={lead.id} 
                className={`hover:bg-blue-50/50 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                   <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                        {lead.name.charAt(0)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.email}</div>
                  <div className="text-sm text-gray-500">{lead.mobile}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.dob}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.isRceb ? (
                    <div className="flex flex-col">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit mb-1">
                        Yes
                        </span>
                        <span className="text-xs text-gray-500 max-w-xs truncate" title={lead.rcebDetails}>
                            {lead.rcebDetails}
                        </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
