import { MembershipCategory, MembershipProgram } from '../../services/membershipService';
import { AgeGroup } from '../../context/ConfigContext';
import { getAgeGroup } from '../../lib/ageUtils';

export interface HouseholdCounts {
  [ageGroupId: string]: number;
}

export interface RuleRange {
  [ageGroupId: string]: { min: number; max: number };
}

export interface CategoryCandidate {
  programId: string;
  programName: string;
  categoryId: string;
  categoryName: string;
  joiningFee?: number;
  annualFee?: number;
  range: RuleRange;
  membersAllowed?: number;
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

export const classifyAgeFromDob = (dob: string | Date, ageGroups: AgeGroup[], category: 'Membership' | 'Service' = 'Membership'): string | null => {
  const match = getAgeGroup(dob, ageGroups, category);
  return (match as any)?.age_group_id || match?.id || null;
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

export const buildHouseholdCountsFromBaseCart = (
  baseCartItems: BaseCartItemLike[],
  ageGroups: AgeGroup[]
): HouseholdCounts => {
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

  const counts: HouseholdCounts = {};
  ageGroups.forEach(g => {
    counts[g.age_group_id] = 0;
  });

  uniqueProfiles.forEach((coveredProfile) => {
    if (!coveredProfile.date_of_birth) {
      return;
    }
    const ageGroupId = classifyAgeFromDob(coveredProfile.date_of_birth, ageGroups);
    if (ageGroupId && counts[ageGroupId] !== undefined) {
      counts[ageGroupId] += 1;
    }
  });

  return counts;
};

export const extractCategoryRange = (category: MembershipCategory, ageGroups: AgeGroup[]): RuleRange => {
  const selectedRule = firstAllowRule(category);
  const conditionJson = selectedRule?.condition_json ?? {};

  const range: RuleRange = {};
  ageGroups.forEach(g => {
    range[g.age_group_id] = {
      min: toMinNumber(conditionJson[`min_${g.age_group_id}`]),
      max: toMaxNumber(conditionJson[`max_${g.age_group_id}`]),
    };
  });

  return range;
};

export const isCategoryEligible = (
  counts: HouseholdCounts, 
  range: RuleRange, 
  ageGroups: AgeGroup[],
  membersAllowed?: number
): boolean => {
  // 1. Check total members against category limit if defined
  if (membersAllowed !== undefined && membersAllowed > 0) {
    const totalMembers = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalMembers > membersAllowed) {
      return false;
    }
  }

  // 2. Check per-age-group ranges
  return ageGroups.every(g => {
    const count = counts[g.age_group_id] || 0;
    const r = range[g.age_group_id];
    if (!r) return count === 0; // If no rule, only allow if count is 0
    return count >= r.min && count <= r.max;
  });
};

export const getSpecificityScore = (range: RuleRange, ageGroups: AgeGroup[]): number => {
  let score = 0;
  ageGroups.forEach(g => {
    const r = range[g.age_group_id];
    if (r) {
      score += rangeWidth(r.min, r.max);
    } else {
      score += SPECIFICITY_INFINITY_CAP;
    }
  });
  return score;
};

export const getAllCategoriesWithEligibility = (
  programs: MembershipProgram[],
  counts: HouseholdCounts,
  ageGroups: AgeGroup[]
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

          const membersAllowed = typeof category.members_allowed === 'string'
            ? parseInt(category.members_allowed, 10)
            : category.members_allowed;

          const range = extractCategoryRange(category, ageGroups);

          const candidate: CategoryCandidate = {
            programId: program.membership_program_id,
            programName: program.name,
            categoryId: category.category_id,
            categoryName: category.name,
            joiningFee: activeFeeAmount(category, 'JOINING'),
            annualFee: activeFeeAmount(category, 'ANNUAL'),
            range,
            membersAllowed,
          };

          results.push({
            candidate,
            eligible: isCategoryEligible(counts, range, ageGroups, membersAllowed),
            specificityScore: getSpecificityScore(range, ageGroups),
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
  counts: HouseholdCounts,
  ageGroups: AgeGroup[]
): CategoryCandidate | null => {
  void counts;
  if (eligibleCategories.length === 0) {
    return null;
  }

  const sorted = [...eligibleCategories].sort((left, right) => {
    const leftSpecificity = getSpecificityScore(left.range, ageGroups);
    const rightSpecificity = getSpecificityScore(right.range, ageGroups);
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
