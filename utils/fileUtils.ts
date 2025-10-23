
import { type Candidate, type MatchedCandidate } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper to check if a candidate is a MatchedCandidate by looking for the matchScore property
const isMatchedCandidate = (candidate: Candidate | MatchedCandidate): candidate is MatchedCandidate => {
    return 'matchScore' in candidate;
};

// Helper to safely format any value for a CSV cell
const formatCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '""';
    }
    // If the field is an array, join it with a semicolon
    const value = Array.isArray(field) ? field.join('; ') : String(field);
    // Escape double quotes by doubling them and wrap the whole thing in double quotes
    return `"${value.replace(/"/g, '""')}"`;
};


export const downloadCsv = (candidates: (Candidate | MatchedCandidate)[]) => {
    if (candidates.length === 0) return;

    const isMatchedExport = candidates.every(isMatchedCandidate);

    const headers = [
        'Name', 'Email', 'Phone', 'Total Experience (Yrs)', 'Current Role', 
        'Job Type', 'Current CTC', 'Expected CTC', 'Notice Period', 'Skills', 'Summary'
    ];
    
    if (isMatchedExport) {
        headers.push('Match Score', 'Match Reason');
    }

    const rows = candidates.map(c => {
        const baseRow = [
            formatCsvField(c.name),
            formatCsvField(c.email),
            formatCsvField(c.phone),
            formatCsvField(c.totalExperience),
            formatCsvField(c.currentRole),
            formatCsvField(c.jobType),
            formatCsvField(c.currentCTC),
            formatCsvField(c.expectedCTC),
            formatCsvField(c.noticePeriod),
            formatCsvField(c.skills),
            formatCsvField(c.summary)
        ];
        
        if (isMatchedExport && isMatchedCandidate(c)) {
            baseRow.push(
                formatCsvField(c.matchScore),
                formatCsvField(c.matchReason)
            );
        }
        return baseRow.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${isMatchedExport ? 'matched_' : ''}candidates.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export const downloadResume = (resume: Candidate['originalResume']) => {
    const link = document.createElement('a');
    link.href = resume.content;
    link.download = resume.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
