
import React, { useState, useEffect } from 'react';
import { parseResumeFile } from '../services/aiService';
import { fileToBase64 } from '../utils/fileUtils';
import { type Candidate, type OriginalResume, type Experience } from '../types';
import { Upload, Loader2, Save, Trash2, PlusCircle, User, BookOpen, Settings, History, XCircle, FileText, AlertCircle, PhoneCall } from 'lucide-react';

// Simple validation utility
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface ResumeUploadProps {
    onSaveCandidate: (candidate: Candidate) => void;
    addToast: (type: 'success' | 'error', message: string) => void;
    candidateToEdit: Candidate | null;
    onCancelEdit: () => void;
}

// Simple Tag Input component defined locally
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


const FormSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
         <details className="p-4 border border-gray-200 rounded-lg bg-white mt-6" open={isOpen} onToggle={(e) => setIsOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary className="text-lg font-semibold text-gray-700 flex items-center cursor-pointer list-none">
                <span className="flex items-center">{icon}{title}</span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {children}
            </div>
        </details>
    )
};

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
    const getColor = () => {
        if (score > 0.8) return 'bg-green-500';
        if (score > 0.5) return 'bg-yellow-400';
        return 'bg-red-500';
    };
    return (
        <div className="relative group ml-2">
            <div className={`w-3 h-3 rounded-full ${getColor()}`}></div>
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              AI Confidence: {Math.round(score * 100)}%
            </span>
        </div>
    );
};

const FormField: React.FC<{ label: string, children: React.ReactNode, className?: string, error?: string, confidenceScore?: number }> = ({ label, children, className = '', error, confidenceScore }) => (
    <div className={className}>
        <label className="flex items-center text-sm font-medium text-gray-600 mb-1">
            {label}
            {confidenceScore !== undefined && confidenceScore !== null && <ConfidenceIndicator score={confidenceScore} />}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onSaveCandidate, addToast, candidateToEdit, onCancelEdit }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [filePreview, setFilePreview] = useState<{ url: string, type: string, name: string } | null>(null);
    const [candidateData, setCandidateData] = useState<Partial<Candidate>>({
        skills: [], languages: [], certificates: [], currentLocations: [], preferredLocations: [],
        preferredIndustries: [], experience: []
    });
    const [errors, setErrors] = useState<Partial<Record<keyof Candidate, string>>>({});
    
    const isEditMode = !!candidateToEdit;

    useEffect(() => {
        // This is a cleanup function to prevent memory leaks from blob URLs
        return () => {
            if (filePreview && filePreview.url.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview.url);
            }
        };
    }, [filePreview]);

    useEffect(() => {
        if (candidateToEdit) {
            setCandidateData(candidateToEdit);
            if (candidateToEdit.originalResume?.content) {
                const { content, type, name } = candidateToEdit.originalResume;
                
                // Clean up any existing blob URL before creating a new one
                if (filePreview && filePreview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(filePreview.url);
                }

                // All previews now use blob URLs for consistency and reliability.
                // We must convert the stored base64 data URI to a blob.
                fetch(content)
                    .then(res => res.blob())
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        setFilePreview({ url: blobUrl, type, name });
                    }).catch(e => {
                        console.error("Error creating blob from data URI for preview", e);
                        addToast('error', 'Could not display resume preview.');
                        setFilePreview(null);
                    });
            } else {
                 if (filePreview && filePreview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(filePreview.url);
                }
                setFilePreview(null);
            }
        } else {
             setCandidateData({
                skills: [], languages: [], certificates: [], currentLocations: [], preferredLocations: [],
                preferredIndustries: [], experience: []
            });
             if (filePreview && filePreview.url.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview.url);
            }
            setFilePreview(null);
        }
        setErrors({}); // Clear errors when mode changes
    }, [candidateToEdit]);

    const validateField = (field: keyof Candidate, value: any): string => {
        switch (field) {
            case 'name':
                return value.trim() ? '' : 'Full Name is required.';
            case 'email':
                if (!value.trim()) return 'Email Address is required.';
                if (!validateEmail(value)) return 'Please enter a valid email address.';
                return '';
            case 'phone':
                 if (!value.trim()) return 'Mobile Number is required.';
                 if (!/^[0-9\s-()+]{10,15}$/.test(value)) return 'Please enter a valid phone number.';
                 return '';
            default:
                return '';
        }
    };

    const handleDataChange = (field: keyof Candidate, value: any) => {
        setCandidateData(prev => ({ ...prev, [field]: value }));
        const errorMsg = validateField(field, value);
        setErrors(prev => ({...prev, [field]: errorMsg }));
    };

    const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
        const newExperience = [...(candidateData.experience || [])];
        newExperience[index] = { ...newExperience[index], [field]: value };
        handleDataChange('experience', newExperience);
    };

    const addExperience = () => {
        const newExperience = [...(candidateData.experience || []), { company: '', role: '', duration: '', description: '' }];
        handleDataChange('experience', newExperience);
    };

    const removeExperience = (index: number) => {
        const newExperience = (candidateData.experience || []).filter((_, i) => i !== index);
        handleDataChange('experience', newExperience);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
            if (!supportedTypes.includes(file.type)) {
                addToast('error', 'Unsupported file type. Please upload a PDF, PNG, or JPG.');
                event.target.value = ''; // Reset file input
                return;
            }

            setIsLoading(true);

            // Clean up old blob URL before creating a new one
            if (filePreview && filePreview.url.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview.url);
            }
            
            try {
                // Create a reliable preview URL using a blob
                const previewUrl = URL.createObjectURL(file);
                setFilePreview({ url: previewUrl, type: file.type, name: file.name });

                // Get base64 for storage and API
                const base64 = await fileToBase64(file);

                const originalResume: OriginalResume = { name: file.name, type: file.type, content: base64 };
                const parsedData = await parseResumeFile(originalResume);

                setCandidateData({
                    ...candidateData,
                    ...parsedData,
                    originalResume: originalResume,
                });
                addToast('success', 'Resume parsed! Please review and save the details.');

            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                addToast('error', `Failed to process resume: ${errorMessage}`);
                if (filePreview && filePreview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(filePreview.url);
                }
                setFilePreview(null);
            } finally {
                setIsLoading(false);
                 event.target.value = ''; // Reset file input
            }
        }
    };
    
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof Candidate, string>> = {};
        const nameError = validateField('name', candidateData.name || '');
        if(nameError) newErrors.name = nameError;

        const emailError = validateField('email', candidateData.email || '');
        if(emailError) newErrors.email = emailError;

        const phoneError = validateField('phone', candidateData.phone || '');
        if(phoneError) newErrors.phone = phoneError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitForm = () => {
        if (!validateForm()) {
            addToast('error', 'Please fix the errors before saving.');
            return;
        }

        let finalCandidate: Candidate;

        if (isEditMode) {
            finalCandidate = {
                ...(candidateToEdit as Candidate),
                ...candidateData,
            };
        } else {
             finalCandidate = {
                id: crypto.randomUUID(),
                name: '', email: '', phone: '', skills: [], experience: [], education: [], summary: '',
                originalResume: candidateData.originalResume || { name: 'manual_entry.txt', type: 'text/plain', content: '' },
                ...candidateData,
                pipelineStage: 'Sourced', lastUpdated: Date.now(),
            };
        }
        
        onSaveCandidate(finalCandidate);
    };
    
    const isFormInvalid = !!errors.name || !!errors.email || !!errors.phone || !candidateData.name || !candidateData.email || !candidateData.phone;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{isEditMode ? 'Edit Candidate Profile' : 'Add New Candidate'}</h2>
            
            <div className={`transition-all duration-500 ${filePreview ? 'grid md:grid-cols-2 md:gap-8' : ''}`}>
                {/* Left Pane: Resume Preview */}
                {filePreview && (
                     <div className="mb-6 md:mb-0">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-700">Resume Preview</h3>
                             <button onClick={() => {
                                if (filePreview.url.startsWith('blob:')) {
                                    URL.revokeObjectURL(filePreview.url);
                                }
                                setFilePreview(null);
                            }} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="relative w-full h-[calc(100vh-250px)] rounded-lg border bg-gray-100 overflow-hidden">
                            {filePreview.type.startsWith('image/') && (
                                <img src={filePreview.url} alt={filePreview.name} className="w-full h-full object-contain" />
                            )}
                            {filePreview.type === 'application/pdf' && (
                                <iframe src={filePreview.url} title={filePreview.name} className="w-full h-full" frameBorder="0"></iframe>
                            )}
                             {isLoading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" size={48} />
                                    <p className="mt-4 font-semibold text-primary">AI is analyzing the resume...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
               
                {/* Right Pane: Form */}
                <div>
                     {/* File Upload Section - Only show when no file is being previewed and not in edit mode */}
                     {!isEditMode && !filePreview && (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700">Upload Resume to Auto-fill Form</h3>
                            <p className="text-gray-500 mt-1 mb-4">Supports PDF, PNG, JPG. Or fill the form manually below.</p>
                            <label htmlFor="resume-upload" className="cursor-pointer bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                                Browse Files
                            </label>
                            <input id="resume-upload" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={isLoading} />
                        </div>
                    )}
                     {/* Candidate Form */}
                    <div className={!isEditMode && !filePreview ? "mt-6" : ""}>
                        <FormSection title="Identity Basics" icon={<User size={20} className="mr-2"/>}>
                            <FormField label="Full Name*" error={errors.name} confidenceScore={candidateData.confidenceScores?.name}><input type="text" value={candidateData.name || ''} onChange={e => handleDataChange('name', e.target.value)} className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`} /></FormField>
                            <FormField label="Email Address*" error={errors.email} confidenceScore={candidateData.confidenceScores?.email}><input type="email" value={candidateData.email || ''} onChange={e => handleDataChange('email', e.target.value)} className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`} /></FormField>
                            <FormField label="Mobile Number*" error={errors.phone} confidenceScore={candidateData.confidenceScores?.phone}><input type="tel" value={candidateData.phone || ''} onChange={e => handleDataChange('phone', e.target.value)} className={`w-full p-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} /></FormField>
                            <FormField label="Date of Birth" confidenceScore={candidateData.confidenceScores?.dob}><input type="date" value={candidateData.dob || ''} onChange={e => handleDataChange('dob', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Gender" confidenceScore={candidateData.confidenceScores?.gender}><select value={candidateData.gender || ''} onChange={e => handleDataChange('gender', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></FormField>
                            <FormField label="Marital Status" confidenceScore={candidateData.confidenceScores?.maritalStatus}><select value={candidateData.maritalStatus || ''} onChange={e => handleDataChange('maritalStatus', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select...</option><option>Single</option><option>Married</option><option>Other</option></select></FormField>
                            <FormField label="Languages Known" className="md:col-span-2" confidenceScore={candidateData.confidenceScores?.languages}><TagInput tags={candidateData.languages || []} setTags={tags => handleDataChange('languages', tags)} placeholder="Type and press Enter..." /></FormField>
                        </FormSection>

                        <FormSection title="Education & Skills" icon={<BookOpen size={20} className="mr-2"/>}>
                            <FormField label="Highest Education" confidenceScore={candidateData.confidenceScores?.highestEducation}><input type="text" value={candidateData.highestEducation || ''} onChange={e => handleDataChange('highestEducation', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Second Highest" confidenceScore={candidateData.confidenceScores?.secondHighestEducation}><input type="text" value={candidateData.secondHighestEducation || ''} onChange={e => handleDataChange('secondHighestEducation', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Third Highest" confidenceScore={candidateData.confidenceScores?.thirdHighestEducation}><input type="text" value={candidateData.thirdHighestEducation || ''} onChange={e => handleDataChange('thirdHighestEducation', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Skills" className="md:col-span-3" confidenceScore={candidateData.confidenceScores?.skills}><TagInput tags={candidateData.skills || []} setTags={tags => handleDataChange('skills', tags)} placeholder="e.g., React, Python..." /></FormField>
                            <FormField label="Certificates" className="md:col-span-3" confidenceScore={candidateData.confidenceScores?.certificates}><TagInput tags={candidateData.certificates || []} setTags={tags => handleDataChange('certificates', tags)} placeholder="e.g., AWS Certified Developer..." /></FormField>
                        </FormSection>
                        
                        <FormSection title="Job Preferences" icon={<Settings size={20} className="mr-2"/>}>
                            <FormField label="Total Experience (Years)" confidenceScore={candidateData.confidenceScores?.totalExperience}><input type="number" value={candidateData.totalExperience || ''} onChange={e => handleDataChange('totalExperience', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Current Role" confidenceScore={candidateData.confidenceScores?.currentRole}><input type="text" value={candidateData.currentRole || ''} onChange={e => handleDataChange('currentRole', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Expected Role" confidenceScore={candidateData.confidenceScores?.expectedRole}><input type="text" value={candidateData.expectedRole || ''} onChange={e => handleDataChange('expectedRole', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Job Type" confidenceScore={candidateData.confidenceScores?.jobType}><select value={candidateData.jobType || ''} onChange={e => handleDataChange('jobType', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select...</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option><option>Hybrid</option></select></FormField>
                            <FormField label="Ready to Relocate" confidenceScore={candidateData.confidenceScores?.readyToRelocate}><select value={candidateData.readyToRelocate || ''} onChange={e => handleDataChange('readyToRelocate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select...</option><option>Yes</option><option>No</option><option>Open to Discussion</option></select></FormField>
                            <FormField label="Notice Period" confidenceScore={candidateData.confidenceScores?.noticePeriod}><select value={candidateData.noticePeriod || ''} onChange={e => handleDataChange('noticePeriod', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select...</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option><option>90+ Days</option></select></FormField>
                            <FormField label="Current CTC (LPA)" confidenceScore={candidateData.confidenceScores?.currentCTC}><input type="text" value={candidateData.currentCTC || ''} onChange={e => handleDataChange('currentCTC', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Expected CTC (LPA)" confidenceScore={candidateData.confidenceScores?.expectedCTC}><input type="text" value={candidateData.expectedCTC || ''} onChange={e => handleDataChange('expectedCTC', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                            <FormField label="Preferred Locations" className="md:col-span-2" confidenceScore={candidateData.confidenceScores?.preferredLocations}><TagInput tags={candidateData.preferredLocations || []} setTags={tags => handleDataChange('preferredLocations', tags)} placeholder="Type and press Enter..." /></FormField>
                        </FormSection>

                        <FormSection title="Contact & Availability" icon={<PhoneCall size={20} className="mr-2"/>}>
                            <FormField label="Has Current Offers?" confidenceScore={candidateData.confidenceScores?.hasCurrentOffers}>
                                <select value={candidateData.hasCurrentOffers || ''} onChange={e => handleDataChange('hasCurrentOffers', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select...</option>
                                    <option>Yes</option>
                                    <option>No</option>
                                </select>
                            </FormField>
                            <FormField label="Best Time to Contact" confidenceScore={candidateData.confidenceScores?.bestTimeToContact}>
                                <input type="text" value={candidateData.bestTimeToContact || ''} onChange={e => handleDataChange('bestTimeToContact', e.target.value)} placeholder="e.g., Weekdays 4-6 PM" className="w-full p-2 border border-gray-300 rounded-md" />
                            </FormField>
                            <FormField label="Preferred Mode of Contact" confidenceScore={candidateData.confidenceScores?.preferredModeOfContact}>
                                <select value={candidateData.preferredModeOfContact || ''} onChange={e => handleDataChange('preferredModeOfContact', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select...</option>
                                    <option>Call</option>
                                    <option>WhatsApp</option>
                                    <option>Email</option>
                                </select>
                            </FormField>
                        </FormSection>

                        <details className="p-4 border border-gray-200 rounded-lg bg-white mt-6" open>
                           <summary className="text-lg font-semibold text-gray-700 flex items-center cursor-pointer list-none">
                                <span className="flex items-center"><History size={20} className="mr-2"/>Work History</span>
                           </summary>
                            <div className="space-y-4 mt-4">
                            {(candidateData.experience || []).map((exp, index) => (
                                <div key={index} className="p-4 border rounded-md bg-gray-50 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Job Title/Role"><input type="text" value={exp.role} onChange={e => handleExperienceChange(index, 'role', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                                        <FormField label="Company Name"><input type="text" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                                        <FormField label="Start Date"><input type="date" value={exp.startDate || ''} onChange={e => handleExperienceChange(index, 'startDate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                                        <FormField label="End Date"><input type="date" value={exp.endDate || ''} onChange={e => handleExperienceChange(index, 'endDate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                                        <FormField label="Key Responsibilities" className="md:col-span-2"><textarea value={exp.description} onChange={e => handleExperienceChange(index, 'description', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea></FormField>
                                        <FormField label="Tools Used" className="md:col-span-2"><input type="text" value={exp.toolsUsed || ''} onChange={e => handleExperienceChange(index, 'toolsUsed', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></FormField>
                                    </div>
                                    <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            </div>
                            <button onClick={addExperience} className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-800">
                                <PlusCircle size={18} /> Add Past Role
                            </button>
                        </details>

                        <div className="mt-8 flex justify-end gap-4">
                            {isEditMode && (
                                <button type="button" onClick={onCancelEdit} className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                            )}
                            <button onClick={handleSubmitForm} disabled={isLoading || isFormInvalid} className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                                <Save className="mr-2" size={20} />
                                {isEditMode ? 'Update Profile' : 'Save Candidate Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeUpload;
