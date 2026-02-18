import { MembershipCategory, MembershipProgram } from '../../services/membershipService';

export type AgeBucket = 'child' | 'adult' | 'senior';

export interface HouseholdCounts {
  children: number;
  adults: number;
  seniors: number;
}

export interface RuleRange {
  children: { min: number; max: number };
  adults: { min: number; max: number };
  seniors: { min: number; max: number };
}

export interface CategoryCandidate {
  programId: string;
  programName: string;
  categoryId: string;
  categoryName: string;
  joiningFee?: number;
  annualFee?: number;
  range: RuleRange;
}

export interface EligibilityResult {
  candidate: CategoryCandidate;
  eligible: boolean;
  specificityScore: number;
  totalFee: number;
}

export interface CoverageLike {
  profile_id: string;
  date_of_birth?: string | null;
}

export interface BaseCartItemLike {
  type: string;
  coverage?: CoverageLike[];
}

const SPECIFICITY_INFINITY_CAP = 999;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toMinNumber = (value: unknown): number => {
  if (!isFiniteNumber(value)) {
    return 0;
  }
  return Math.max(0, value);
};

const toMaxNumber = (value: unknown): number => {
  if (!isFiniteNumber(value)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, value);
};

const rangeWidth = (min: number, max: number): number => {
  const boundedMax = Number.isFinite(max) ? max : SPECIFICITY_INFINITY_CAP;
  return Math.max(0, boundedMax - min);
};

const totalFeeForSort = (candidate: CategoryCandidate): number => {
  const joining = candidate.joiningFee ?? SPECIFICITY_INFINITY_CAP;
  const annual = candidate.annualFee ?? SPECIFICITY_INFINITY_CAP;
  return joining + annual;
};

const displayName = (candidate: CategoryCandidate): string =>
  `${candidate.programName} ${candidate.categoryName}`.toLowerCase();

const firstAllowRule = (category: MembershipCategory) => {
  const allowRules = category.rules
    .filter((rule) => rule.result === 'ALLOW')
    .sort((a, b) => a.priority - b.priority);
  return allowRules[0] ?? null;
};

const activeFeeAmount = (category: MembershipCategory, feeType: 'JOINING' | 'ANNUAL') => {
  const fee = category.fees.find((item) => item.fee_type === feeType && item.is_active !== false);
  return fee?.amount;
};

export const classifyAgeFromDob = (dob: string | Date): AgeBucket => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  if (age >= 65) {
    return 'senior';
  }
  if (age >= 18) {
    return 'adult';
  }
  return 'child';
};

export const getBaseCartMissingDobProfileIds = (baseCartItems: BaseCartItemLike[]): string[] => {
  const missing = new Set<string>();
  const seen = new Set<string>();

  baseCartItems.forEach((item) => {
    if (item.type !== 'BASE' || !item.coverage) {
      return;
    }

    item.coverage.forEach((coveredProfile) => {
      if (seen.has(coveredProfile.profile_id)) {
        return;
      }
      seen.add(coveredProfile.profile_id);
      if (!coveredProfile.date_of_birth) {
        missing.add(coveredProfile.profile_id);
      }
    });
  });

  return Array.from(missing);
};

export const buildHouseholdCountsFromBaseCart = (baseCartItems: BaseCartItemLike[]): HouseholdCounts => {
  const uniqueProfiles = new Map<string, CoverageLike>();

  baseCartItems.forEach((item) => {
    if (item.type !== 'BASE' || !item.coverage) {
      return;
    }
    item.coverage.forEach((coveredProfile) => {
      if (!uniqueProfiles.has(coveredProfile.profile_id)) {
        uniqueProfiles.set(coveredProfile.profile_id, coveredProfile);
      }
    });
  });

  const counts: HouseholdCounts = {
    children: 0,
    adults: 0,
    seniors: 0,
  };

  uniqueProfiles.forEach((coveredProfile) => {
    if (!coveredProfile.date_of_birth) {
      return;
    }
    const bucket = classifyAgeFromDob(coveredProfile.date_of_birth);
    if (bucket === 'child') {
      counts.children += 1;
      return;
    }
    if (bucket === 'adult') {
      counts.adults += 1;
      return;
    }
    counts.seniors += 1;
  });

  return counts;
};

export const extractCategoryRange = (category: MembershipCategory): RuleRange => {
  const selectedRule = firstAllowRule(category);
  const conditionJson = selectedRule?.condition_json ?? {};

  return {
    children: {
      min: toMinNumber(conditionJson.minChild),
      max: toMaxNumber(conditionJson.maxChild),
    },
    adults: {
      min: toMinNumber(conditionJson.minAdult),
      max: toMaxNumber(conditionJson.maxAdult),
    },
    seniors: {
      min: toMinNumber(conditionJson.minSenior),
      max: toMaxNumber(conditionJson.maxSenior),
    },
  };
};

export const isCategoryEligible = (counts: HouseholdCounts, range: RuleRange): boolean => {
  const childEligible = counts.children >= range.children.min && counts.children <= range.children.max;
  const adultEligible = counts.adults >= range.adults.min && counts.adults <= range.adults.max;
  const seniorEligible = counts.seniors >= range.seniors.min && counts.seniors <= range.seniors.max;
  return childEligible && adultEligible && seniorEligible;
};

export const getSpecificityScore = (range: RuleRange): number => {
  return (
    rangeWidth(range.children.min, range.children.max) +
    rangeWidth(range.adults.min, range.adults.max) +
    rangeWidth(range.seniors.min, range.seniors.max)
  );
};

export const getAllCategoriesWithEligibility = (
  programs: MembershipProgram[],
  counts: HouseholdCounts
): EligibilityResult[] => {
  const results: EligibilityResult[] = [];

  programs
    .filter((program) => program.is_active !== false)
    .forEach((program) => {
      program.categories
        .filter((category) => category.is_active !== false)
        .forEach((category) => {
          if (!category.category_id || !program.membership_program_id) {
            return;
          }

          const range = extractCategoryRange(category);
          const candidate: CategoryCandidate = {
            programId: program.membership_program_id,
            programName: program.name,
            categoryId: category.category_id,
            categoryName: category.name,
            joiningFee: activeFeeAmount(category, 'JOINING'),
            annualFee: activeFeeAmount(category, 'ANNUAL'),
            range,
          };

          results.push({
            candidate,
            eligible: isCategoryEligible(counts, range),
            specificityScore: getSpecificityScore(range),
            totalFee: totalFeeForSort(candidate),
          });
        });
    });

  return results.sort((left, right) => {
    if (left.eligible !== right.eligible) {
      return left.eligible ? -1 : 1;
    }
    if (left.specificityScore !== right.specificityScore) {
      return left.specificityScore - right.specificityScore;
    }
    if (left.totalFee !== right.totalFee) {
      return left.totalFee - right.totalFee;
    }
    return displayName(left.candidate).localeCompare(displayName(right.candidate));
  });
};

export const getSuggestedCategory = (
  eligibleCategories: CategoryCandidate[],
  counts: HouseholdCounts
): CategoryCandidate | null => {
  void counts;
  if (eligibleCategories.length === 0) {
    return null;
  }

  const sorted = [...eligibleCategories].sort((left, right) => {
    const leftSpecificity = getSpecificityScore(left.range);
    const rightSpecificity = getSpecificityScore(right.range);
    if (leftSpecificity !== rightSpecificity) {
      return leftSpecificity - rightSpecificity;
    }

    const leftTotalFee = totalFeeForSort(left);
    const rightTotalFee = totalFeeForSort(right);
    if (leftTotalFee !== rightTotalFee) {
      return leftTotalFee - rightTotalFee;
    }

    return displayName(left).localeCompare(displayName(right));
  });

  return sorted[0];
};
