export const dropdownOptions = {
  subscriptionTerms: [
    { value: 'Recurring', label: 'Recurring' },
    { value: 'PAY_IN_FULL', label: 'Pay in Full' },
  ],
  serviceType: [
    { value: 'PRIVATE', label: 'Private' },
    { value: 'GROUP', label: 'Group' },
  ],
  serviceCategory: [
    { value: 'SELF', label: 'Self' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'WORKSHOP', label: 'Workshop' },
  ],
};

export const getDropdownOptions = (key: keyof typeof dropdownOptions) => {
  return dropdownOptions[key];
};
