import { type Candidate, type MatchedCandidate, type InterviewQuestions, type OriginalResume } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/ai';

const getApiErrorMessage = (error: unknown): string => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return 'Connection to backend failed. Please ensure the server is running.';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred.';
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // The backend will handle the 401, but we could throw here if we want to be stricter.
        console.warn("Auth token not found. API call might fail.");
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `An API error occurred: ${response.statusText}`);
    }
    return response.json();
};

export const parseResumeFile = async (resumeFile: OriginalResume): Promise<Partial<Candidate>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/parse`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ resumeFile }),
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error("Error parsing resume via backend proxy:", error);
        // Throw a new error with a clean, user-friendly message.
        // getApiErrorMessage will pass through specific backend messages or create a generic one for network failures.
        throw new Error(getApiErrorMessage(error));
    }
};

export const findBestMatches = async (jobDescription: string, candidates: Candidate[]): Promise<MatchedCandidate[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/match`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ jobDescription, candidates }),
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error("Error matching candidates via backend proxy:", error);
        // Throw a new error with a clean, user-friendly message.
        throw new Error(getApiErrorMessage(error));
    }
};

export const generateInterviewQuestions = async (candidate: Candidate, jobDescription: string): Promise<InterviewQuestions> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-questions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ candidate, jobDescription }),
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error("Error generating interview questions via backend proxy:", error);
        // Throw a new error with a clean, user-friendly message.
        throw new Error(getApiErrorMessage(error));
    }
};
