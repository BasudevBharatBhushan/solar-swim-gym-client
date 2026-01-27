/**
 * AGE GROUP CONSTANTS
 * 
 * Central definition of age group mappings between UI and backend.
 * Import this file wherever age group mapping is needed to ensure consistency.
 * 
 * UPDATED: 2026-01-28
 * Schema now uses exact string values for age groups (no mapping needed)
 */

// Static age groups displayed in the UI (exact values from schema)
export const AGE_GROUPS_UI = [
    'Individual',
    'Individual Plus',
    'Senior (65+)',
    'Adult (18+)',
    'Teen (13–17)',
    'Child (6–12)',
    'Infant (0–5)'
] as const;

// Type for UI age groups
export type AgeGroupUI = typeof AGE_GROUPS_UI[number];

// Type for backend age groups (exact values from database schema)
export type AgeGroupDB = 
    | 'Individual'
    | 'Individual Plus'
    | 'Senior (65+)'
    | 'Adult (18+)'
    | 'Teen (13–17)'
    | 'Child (6–12)'
    | 'Infant (0–5)';

// Mapping from UI labels to backend database values
// Since UI and backend now use the same values, this is a 1:1 mapping
export const AGE_GROUP_UI_TO_DB: Record<AgeGroupUI, AgeGroupDB> = {
    'Individual': 'Individual',
    'Individual Plus': 'Individual Plus',
    'Senior (65+)': 'Senior (65+)',
    'Adult (18+)': 'Adult (18+)',
    'Teen (13–17)': 'Teen (13–17)',
    'Child (6–12)': 'Child (6–12)',
    'Infant (0–5)': 'Infant (0–5)'
};

// Reverse mapping from backend to UI (for displaying saved data)
export const AGE_GROUP_DB_TO_UI: Record<AgeGroupDB, AgeGroupUI> = {
    'Individual': 'Individual',
    'Individual Plus': 'Individual Plus',
    'Senior (65+)': 'Senior (65+)',
    'Adult (18+)': 'Adult (18+)',
    'Teen (13–17)': 'Teen (13–17)',
    'Child (6–12)': 'Child (6–12)',
    'Infant (0–5)': 'Infant (0–5)'
};

/**
 * Convert UI age group label to backend database value
 * @param uiLabel - Age group label shown in UI
 * @returns Database value for the age group
 */
export function mapAgeGroupToDb(uiLabel: string): AgeGroupDB {
    const mapped = AGE_GROUP_UI_TO_DB[uiLabel as AgeGroupUI];
    if (!mapped) {
        // Fallback: return as-is since UI and DB values are now the same
        return uiLabel as AgeGroupDB;
    }
    return mapped;
}

/**
 * Convert backend database value to UI label
 * @param dbValue - Database value for age group
 * @returns UI label for the age group
 */
export function mapAgeGroupToUi(dbValue: string): AgeGroupUI {
    const mapped = AGE_GROUP_DB_TO_UI[dbValue as AgeGroupDB];
    if (!mapped) {
        // Fallback: return as-is since UI and DB values are now the same
        return dbValue as AgeGroupUI;
    }
    return mapped;
}

/**
 * Validate if a string is a valid backend age group value
 * @param value - Value to validate
 * @returns true if valid backend age group
 */
export function isValidAgeGroupDb(value: string): value is AgeGroupDB {
    return Object.values(AGE_GROUP_UI_TO_DB).includes(value as AgeGroupDB);
}

/**
 * Validate if a string is a valid UI age group label
 * @param value - Value to validate
 * @returns true if valid UI age group
 */
export function isValidAgeGroupUi(value: string): value is AgeGroupUI {
    return AGE_GROUPS_UI.includes(value as AgeGroupUI);
}

// Example usage:
// import { mapAgeGroupToDb, mapAgeGroupToUi } from './ageGroupConstants';
// 
// const dbValue = mapAgeGroupToDb('Individual'); // Returns: 'Individual'
// const uiLabel = mapAgeGroupToUi('Senior (65+)'); // Returns: 'Senior (65+)'
