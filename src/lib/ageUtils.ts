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

export const isFutureDate = (dob: string | Date): boolean => {
  const d = new Date(dob);
  const today = new Date();
  return d.getTime() > today.getTime();
};

export const isUnderSixMonths = (dob: string | Date): boolean => {
  const d = new Date(dob);
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  return d > sixMonthsAgo;
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

export const getMembershipAgeGroup = (dob: string | Date, ageGroups: any[]): any | null => {
  return getAgeGroup(dob, ageGroups, 'Membership');
};

export const getJuniorGroup = (ageGroups: any[]): any | null => {
  if (!Array.isArray(ageGroups)) return null;
  return ageGroups.find(
    g => g.age_group_category === 'Membership' && typeof g.name === 'string' && g.name.toLowerCase() === 'junior'
  ) || null;
};

export const isJuniorMembership = (dob: string | Date, ageGroups: any[]): boolean => {
  if (!dob) return false;
  const juniorGroup = getJuniorGroup(ageGroups);
  const age = calculateAge(dob);
  if (juniorGroup) {
    const min = juniorGroup.min_age ?? 13;
    const max = juniorGroup.max_age ?? 17;
    return age >= min && age <= max;
  }
  // Fallback to 13-17 if config missing
  return age >= 13 && age <= 17;
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
