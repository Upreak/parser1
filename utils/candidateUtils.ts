
import { type Candidate } from "../types";

// Fields considered for profile completeness calculation
const COMPLETENESS_FIELDS: (keyof Candidate)[] = [
    'name', 'email', 'phone', 'summary', 'totalExperience',
    'skills', 'experience', 'highestEducation', 'currentRole',
    'jobType', 'noticePeriod', 'currentCTC', 'expectedCTC', 'preferredLocations',
    'readyToRelocate', 'languages', 'hasCurrentOffers', 'bestTimeToContact', 'preferredModeOfContact'
];

/**
 * Calculates the profile completeness percentage for a given candidate.
 * @param candidate The candidate object.
 * @returns A number between 0 and 100.
 */
export const calculateProfileCompleteness = (candidate: Partial<Candidate>): number => {
    if (!candidate) return 0;

    let filledFields = 0;
    for (const field of COMPLETENESS_FIELDS) {
        const value = candidate[field];
        if (value) {
            if (Array.isArray(value) && value.length > 0) {
                filledFields++;
            } else if (!Array.isArray(value) && String(value).trim() !== '') {
                filledFields++;
            }
        }
    }

    const percentage = Math.round((filledFields / COMPLETENESS_FIELDS.length) * 100);
    return percentage;
};


const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

/**
 * Formats a timestamp into a human-readable relative time string.
 * @param timestamp The timestamp number (from Date.now()).
 * @returns A string like "today", "yesterday", "2 days ago", etc.
 */
export const formatRelativeTime = (timestamp: number): string => {
    const then = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.round((then.getTime() - now.getTime()) / ONE_DAY_IN_MS);

    if (isNaN(diffInDays)) return '';

    // Check if it's the same day, ignoring time
    if (then.toDateString() === now.toDateString()) {
        return 'today';
    }

    return rtf.format(diffInDays, 'day');
};