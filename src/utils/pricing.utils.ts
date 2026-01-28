export type TenureType = '12mo' | '6mo' | '3mo';

export const PRICING_STRUCTURE = {
  '12mo': {
    individual: 41.50,
    individual_plus: 66.50,
    senior: 37.35,
    add_adult: 35.00,
    add_child: 20.00, // 6-17yr
  },
  '6mo': {
    individual: 333.00,
    individual_plus: 513.00,
    senior: 299.70,
    add_adult: 228.00,
    add_child: 150.00,
  },
  '3mo': {
    individual: 195.50,
    individual_plus: 294.50,
    senior: 175.95,
    add_adult: 120.00,
    add_child: 90.00,
  },
};

export const getAge = (dob: string): number => {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getAgeCategory = (dob: string): 'senior' | 'adult' | 'child' => {
  const age = getAge(dob);
  if (age >= 65) return 'senior';
  if (age >= 18) return 'adult';
  return 'child'; // 6mo - 17yr
};

export const calculateMemberPrice = (
  dob: string,
  isHead: boolean,
  totalMembers: number,
  tenure: TenureType,
  isRceb: boolean
): number => {
  if (isRceb) return 0;

  const structure = PRICING_STRUCTURE[tenure];
  if (!structure) return 0; // Should not happen

  const category = getAgeCategory(dob);

  if (totalMembers === 1) {
    // Single member pricing
    if (category === 'senior') {
      return structure.senior;
    }
    return structure.individual;
  } else {
    // Multi-member pricing
    if (isHead) {
      return structure.individual_plus;
    } else {
      // Add-on members
      if (category === 'senior' || category === 'adult') return structure.add_adult;
      return structure.add_child;
    }
  }
};
