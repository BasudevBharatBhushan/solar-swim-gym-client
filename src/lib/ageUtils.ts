export const calculateAge = (dob: string | Date): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getAgeGroupName = (dob: string | Date, ageGroups: any[]): string => {
  if (!dob) return 'No Age Group';
  const age = calculateAge(dob);
  
  const group = ageGroups.find(g => {
    const min = g.min_age ?? 0;
    const max = g.max_age ?? 999;
    return age >= min && age <= max;
  });

  return group ? group.name : 'No Age Group';
};
