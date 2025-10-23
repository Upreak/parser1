
import React, { useState, useMemo } from 'react';
import { generateInterviewQuestions } from '../services/aiService';
import { findBestMatches } from '../services/aiService';
import { type Candidate, type MatchedCandidate, type Role, type InterviewQuestions } from '../types';
import { Loader2, Sparkles, Star, XCircle, Download, FileDown, MessageSquarePlus } from 'lucide-react';
import { downloadCsv, downloadResume } from '../utils/fileUtils';
import InterviewQuestionsModal from './InterviewQuestionsModal';

interface JdMatcherProps {
    candidates: Candidate[];
    addToast: (type: 'success' | 'error', message: string) => void;
    role: Role;
}

const TagInput: React.FC<{ tags: string[], setTags: (tags: string[]) => void, placeholder: string }> = ({ tags, setTags, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            e.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                setTags([...tags, inputValue.trim()]);
            }
            setInputValue('');
        }
    };
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-secondary text-primary text-sm font-medium rounded-full">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-primary hover:text-red-500">
                            <XCircle size={14} />
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
        </div>
    );
};

interface JdFormState {
    title: string;
    location: string;
    skills: string[];
    experience: string;
    ctcRange: string;
    employmentType: 'Full-time' | 'Part-time' | 'Contract';
    workMode: 'Onsite' | 'Remote' | 'Hybrid';
    description: string;
}

const JdMatcher: React.FC<JdMatcherProps> = ({ candidates, addToast, role }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [matchedCandidates, setMatchedCandidates] = useState<MatchedCandidate[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
    const isRecruiter = role === 'Recruiter';

    const [jdForm, setJdForm] = useState<JdFormState>({
        title: '', location: '', skills: [], experience: '', ctcRange: '',
        employmentType: 'Full-time', workMode: 'Onsite', description: ''
    });
    const [errors, setErrors] = useState<Partial<Record<keyof JdFormState, string>>>({});
    
    const [questionsCandidate, setQuestionsCandidate] = useState<MatchedCandidate | null>(null);
    const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestions | null>(null);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const validateField = (field: keyof JdFormState, value: string): string => {
        if (field === 'title' && !value.trim()) return 'Job Title is required.';
        if (field === 'description' && !value.trim()) return 'Full Job Description is required.';
        return '';
    };

    const handleFormChange = (field: keyof JdFormState, value: any) => {
        setJdForm(prev => ({ ...prev, [field]: value }));
        const errorMsg = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: errorMsg }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof JdFormState, string>> = {};
        const titleError = validateField('title', jdForm.title);
        if(titleError) newErrors.title = titleError;
        const descriptionError = validateField('description', jdForm.description);
        if(descriptionError) newErrors.description = descriptionError;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const fullJobDescription = `Job Title: ${jdForm.title}\nLocation: ${jdForm.location}\nRequired Skills: ${jdForm.skills.join(', ')}\nRequired Experience: ${jdForm.experience}\nCTC Range: ${jdForm.ctcRange}\nEmployment Type: ${jdForm.employmentType}\nWork Mode: ${jdForm.workMode}\nJob Description: ${jdForm.description}`;

    const handleMatch = async () => {
        if (!validateForm()) {
            addToast('error', 'Please fill out all required fields.');
            return;
        }
        if (candidates.length === 0) {
            addToast('error', 'There are no candidates in the database to match against.');
            return;
        }
        setIsLoading(true);
        setMatchedCandidates([]);
        setSelectedMatchIds(new Set());

        try {
            const matches = await findBestMatches(fullJobDescription, candidates);
            setMatchedCandidates(matches);
            addToast('success', `Found ${matches.length} matching candidates!`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast('error', `Matching failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateQuestions = async (candidate: MatchedCandidate) => {
        setQuestionsCandidate(candidate);
        setGeneratedQuestions(null);
        setGenerationError(null);
        setIsGeneratingQuestions(true);

        try {
            const questions = await generateInterviewQuestions(candidate, fullJobDescription);
            setGeneratedQuestions(questions);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setGenerationError(message);
            addToast('error', `Failed to generate questions: ${message}`);
        } finally {
            setIsGeneratingQuestions(false);
        }
    };
    
    const handleSelectMatch = (candidateId: string) => {
        setSelectedMatchIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(candidateId)) newSet.delete(candidateId);
            else newSet.add(candidateId);
            return newSet;
        });
    };

    const selectedMatches = useMemo(() => {
        return matchedCandidates.filter(c => selectedMatchIds.has(c.id));
    }, [matchedCandidates, selectedMatchIds]);

    const isFormInvalid = !!errors.title || !!errors.description;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Job Description Matcher</h2>
            <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Job Title/Role*</label>
                        <input type="text" value={jdForm.title} onChange={e => handleFormChange('title', e.target.value)} className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}/>
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Location(s)</label>
                        <input type="text" value={jdForm.location} onChange={e => handleFormChange('location', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., New York, Remote"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Skills</label>
                        <TagInput tags={jdForm.skills} setTags={tags => handleFormChange('skills', tags)} placeholder="Type skill and press Enter..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Experience</label>
                        <input type="text" value={jdForm.experience} onChange={e => handleFormChange('experience', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., 5-7 years"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">CTC Range</label>
                        <input type="text" value={jdForm.ctcRange} onChange={e => handleFormChange('ctcRange', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., $100k - $120k"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Employment Type</label>
                        <select value={jdForm.employmentType} onChange={e => handleFormChange('employmentType', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                            <option>Full-time</option><option>Part-time</option><option>Contract</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Work Mode</label>
                        <div className="flex items-center space-x-4 mt-2">
                            <label><input type="radio" name="workMode" value="Onsite" checked={jdForm.workMode === 'Onsite'} onChange={e => handleFormChange('workMode', e.target.value)} className="mr-1"/> Onsite</label>
                            <label><input type="radio" name="workMode" value="Remote" checked={jdForm.workMode === 'Remote'} onChange={e => handleFormChange('workMode', e.target.value)} className="mr-1"/> Remote</label>
                            <label><input type="radio" name="workMode" value="Hybrid" checked={jdForm.workMode === 'Hybrid'} onChange={e => handleFormChange('workMode', e.target.value)} className="mr-1"/> Hybrid</label>
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="jd-input" className="block text-sm font-medium text-gray-600 mb-1">Full Job Description*</label>
                    <textarea id="jd-input" className={`w-full h-40 p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition ${errors.description ? 'border-red-500' : 'border-gray-300'}`} placeholder="Paste the full job description text here..." value={jdForm.description} onChange={(e) => handleFormChange('description', e.target.value)} disabled={isLoading}/>
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>
                <button onClick={handleMatch} disabled={isLoading || isFormInvalid} className="mt-4 w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                    {isLoading ? (<><Loader2 className="animate-spin mr-2" size={20} />Analyzing & Matching...</>) : (<><Sparkles className="mr-2" size={20} />Find Best Matches</>)}
                </button>
            </div>

            {matchedCandidates.length > 0 && (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-xl font-bold text-gray-800">Top Matches</h3>
                        {selectedMatchIds.size > 0 && (
                            <button 
                                onClick={() => downloadCsv(selectedMatches)} 
                                className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors w-full sm:w-auto justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={isRecruiter}
                                title={isRecruiter ? "Admin permission required" : "Export selected matches"}
                            >
                                <Download size={18} />
                                <span>Export Selected ({selectedMatchIds.size})</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {matchedCandidates.map((candidate, index) => (
                            <div key={candidate.id} className={`p-4 border rounded-lg shadow-sm bg-white relative transition-all duration-200 ${selectedMatchIds.has(candidate.id) ? 'ring-2 ring-accent border-transparent' : 'border-gray-200'}`}>
                                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                     <button onClick={() => handleGenerateQuestions(candidate)} className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full transition-colors" title="Generate Interview Questions">
                                        <MessageSquarePlus size={20} />
                                    </button>
                                    {candidate.originalResume?.content && (
                                        <button onClick={() => downloadResume(candidate.originalResume)} className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full transition-colors" title="Download Original Resume">
                                            <FileDown size={20} />
                                        </button>
                                     )}
                                    <input type="checkbox" checked={selectedMatchIds.has(candidate.id)} onChange={() => handleSelectMatch(candidate.id)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"/>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-primary">{index + 1}. {candidate.name}</h4>
                                        <p className="text-sm text-gray-500">{candidate.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-lg font-bold text-amber-500 bg-amber-100 px-3 py-1 rounded-full mr-32">
                                        <Star size={18} />
                                        <span>{candidate.matchScore}/100</span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="font-semibold text-gray-700">AI Match Reason:</p>
                                    <p className="text-sm text-gray-600 italic">"{candidate.matchReason}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <InterviewQuestionsModal
                isOpen={!!questionsCandidate}
                onClose={() => setQuestionsCandidate(null)}
                candidate={questionsCandidate}
                isLoading={isGeneratingQuestions}
                questions={generatedQuestions}
                error={generationError}
                onRetry={() => questionsCandidate && handleGenerateQuestions(questionsCandidate)}
            />
        </div>
    );
};

export default JdMatcher;
