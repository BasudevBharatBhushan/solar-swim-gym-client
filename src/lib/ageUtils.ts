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

export const getAgeGroup = (dob: string | Date, ageGroups: any[], category?: 'Membership' | 'Service'): any | null => {
  if (!dob) return null;
  const age = calculateAge(dob);
  
  return ageGroups.find(g => {
    const min = g.min_age ?? 0;
    const max = g.max_age ?? 999;
    const categoryMatch = !category || g.age_group_category === category;
    return age >= min && age <= max && categoryMatch;
  });
};

export const getAgeGroupName = (dob: string | Date, ageGroups: any[], category?: 'Membership' | 'Service'): string => {
  const group = getAgeGroup(dob, ageGroups, category);
  return group ? group.name : 'No Age Group';
};

export const getAgeRangeLabel = (group: any): string => {
  if (!group) return '';
  const min = group.min_age ?? 0;
  const max = group.max_age ?? 999;
  return `(${min}-${max === 999 ? '+' : max})`;
};
