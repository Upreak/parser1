
import React, { useState, useMemo } from 'react';
import { type Candidate, type Role } from '../types';
import { downloadCsv, downloadResume } from '../utils/fileUtils';
import { calculateProfileCompleteness, formatRelativeTime } from '../utils/candidateUtils';
import { Search, Download, FileDown, Briefcase, GraduationCap, User, Mail, Phone, Users, Clock, DollarSign, X, PenSquare, Trash2, GripVertical } from 'lucide-react';

interface CandidateSearchProps {
    candidates: Candidate[];
    role: Role;
    onEditCandidate: (candidateId: string) => void;
    onDeleteRequest: (candidate: Candidate) => void;
}

const CandidateCard: React.FC<{ 
    candidate: Candidate, 
    onEdit: () => void, 
    onDelete: () => void, 
    role: Role,
    isExpanded: boolean,
    onToggleExpand: () => void,
    isSelected: boolean,
    onSelect: () => void,
}> = ({ candidate, onEdit, onDelete, role, isExpanded, onToggleExpand, isSelected, onSelect }) => {
    const completeness = useMemo(() => calculateProfileCompleteness(candidate), [candidate]);
    const lastUpdatedText = useMemo(() => formatRelativeTime(candidate.lastUpdated), [candidate.lastUpdated]);

    // Defensive check for skills array
    const skills = Array.isArray(candidate.skills) ? candidate.skills : [];

    return (
        <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl relative ${isExpanded ? 'ring-2 ring-primary shadow-2xl' : ''} ${isSelected ? 'ring-2 ring-accent' : ''}`}>
            <div className="absolute top-4 left-4 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); onSelect(); }}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label={`Select ${candidate.name}`}
                />
            </div>
            <div className="p-4 cursor-pointer pl-12" onClick={onToggleExpand}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-primary">{candidate.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1"><Mail size={14} className="mr-2"/>{candidate.email}</p>
                        {candidate.phone && <p className="text-sm text-gray-600 flex items-center"><Phone size={14} className="mr-2"/>{candidate.phone}</p>}
                    </div>
                    <div className="flex items-center space-x-1">
                         <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full transition-colors"
                            title="Edit Candidate"
                        >
                            <PenSquare size={20} />
                        </button>
                        {role === 'Admin' && (
                           <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-2 text-gray-500 hover:text-error hover:bg-red-100 rounded-full transition-colors"
                                title="Delete Candidate"
                           >
                                <Trash2 size={20} />
                           </button>
                        )}
                        {candidate.originalResume?.content &&
                            <button
                                onClick={(e) => { e.stopPropagation(); downloadResume(candidate.originalResume); }}
                                className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full transition-colors"
                                title="Download Original Resume"
                            >
                                <FileDown size={20} />
                            </button>
                        }
                    </div>
                </div>
                 <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
                    {candidate.currentRole && <span className="flex items-center"><Briefcase size={14} className="mr-1.5 text-gray-400"/> {candidate.currentRole}</span>}
                    {candidate.totalExperience !== undefined && <span className="flex items-center"><Clock size={14} className="mr-1.5 text-gray-400"/> {candidate.totalExperience} yrs exp</span>}
                    {candidate.currentCTC && <span className="flex items-center"><DollarSign size={14} className="mr-1.5 text-gray-400"/> {candidate.currentCTC}</span>}
                </div>
                <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Top Skills:</p>
                    <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 5).map(skill => (
                            <span key={skill} className="px-2 py-1 bg-secondary text-primary text-xs font-medium rounded-full">{skill}</span>
                        ))}
                        {skills.length > 5 && <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">+{skills.length - 5} more</span>}
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                    {candidate.pipelineStage && (
                        <span className="flex items-center text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                            <GripVertical size={14} className="mr-1.5 text-blue-500" />
                            {candidate.pipelineStage}
                        </span>
                    )}
                    <div className="w-full ml-4">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-medium text-gray-600">Profile Completeness</p>
                            <span className={`text-xs font-bold ${completeness > 80 ? 'text-success' : 'text-gray-600'}`}>{completeness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${completeness}%` }}></div>
                        </div>
                    </div>
                </div>
                {lastUpdatedText && <p className="text-right text-xs text-gray-500 mt-2">Updated {lastUpdatedText}</p>}
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800 flex items-center"><User size={16} className="mr-2"/>Summary</h4>
                        <div className="text-sm font-bold bg-secondary text-primary px-3 py-1 rounded-full">
                            Profile Complete: {completeness}%
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 mb-3">{candidate.summary}</p>

                    <h4 className="font-semibold text-gray-800 flex items-center"><Briefcase size={16} className="mr-2"/>Experience</h4>
                    {(Array.isArray(candidate.experience) ? candidate.experience : []).map((exp, i) => (
                        <div key={i} className="mt-2 pl-4 border-l-2 border-primary">
                            <p className="font-bold text-sm text-gray-700">{exp.role} at {exp.company}</p>
                            <p className="text-xs text-gray-500">{exp.duration}</p>
                            <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                        </div>
                    ))}
                    <h4 className="font-semibold text-gray-800 flex items-center mt-3"><GraduationCap size={16} className="mr-2"/>Education</h4>
                     {(Array.isArray(candidate.education) ? candidate.education : []).map((edu, i) => (
                        <div key={i} className="mt-2 pl-4 border-l-2 border-accent">
                            <p className="font-bold text-sm text-gray-700">{edu.degree}</p>
                            <p className="text-xs text-gray-500">{edu.institution} ({edu.duration})</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const CandidateSearch: React.FC<CandidateSearchProps> = ({ candidates, role, onEditCandidate, onDeleteRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        experience: '',
        ctc: '',
        jobType: '',
        location: '',
    });
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
    const isRecruiter = role === 'Recruiter';

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
        setFilters({ experience: '', ctc: '', jobType: '', location: '' });
        setSearchTerm('');
        setSelectedCandidateIds(new Set()); // Also clear selection
    };
    
    const isFiltersActive = Object.values(filters).some(v => v !== '') || searchTerm !== '';

    const filteredCandidates = useMemo(() => {
        let result = candidates;

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            result = result.filter(candidate =>
                candidate.name.toLowerCase().includes(lowercasedFilter) ||
                candidate.email.toLowerCase().includes(lowercasedFilter) ||
                (Array.isArray(candidate.skills) && candidate.skills.some(skill => skill.toLowerCase().includes(lowercasedFilter))) ||
                (candidate.summary && candidate.summary.toLowerCase().includes(lowercasedFilter)) ||
                (candidate.currentRole && candidate.currentRole.toLowerCase().includes(lowercasedFilter))
            );
        }
        
        if (filters.experience) {
            const [min, max] = filters.experience.split('-').map(Number);
            result = result.filter(c => {
                if (c.totalExperience === undefined) return false;
                if (max) return c.totalExperience >= min && c.totalExperience <= max;
                return c.totalExperience >= min;
            });
        }

        if (filters.ctc) result = result.filter(c => c.currentCTC && c.currentCTC.toLowerCase().includes(filters.ctc.toLowerCase()));
        if (filters.jobType) result = result.filter(c => c.jobType === filters.jobType);
        if (filters.location) {
            const lowercasedLocation = filters.location.toLowerCase();
            result = result.filter(c => 
                (c.currentLocations?.some(l => l.toLowerCase().includes(lowercasedLocation))) ||
                (c.preferredLocations?.some(l => l.toLowerCase().includes(lowercasedLocation)))
            );
        }

        return result;
    }, [candidates, searchTerm, filters]);
    
    const handleSelectCandidate = (candidateId: string) => {
        setSelectedCandidateIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(candidateId)) newSet.delete(candidateId);
            else newSet.add(candidateId);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allFilteredIds = filteredCandidates.map(c => c.id);
            setSelectedCandidateIds(new Set(allFilteredIds));
        } else {
            setSelectedCandidateIds(new Set());
        }
    };

    const selectedCandidates = useMemo(() => {
        return candidates.filter(c => selectedCandidateIds.has(c.id));
    }, [candidates, selectedCandidateIds]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Candidate Database ({filteredCandidates.length})</h2>
            </div>
            
            {/* Bulk Actions Bar */}
            {selectedCandidateIds.size > 0 && (
                <div className="bg-secondary p-3 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedCandidateIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                                onChange={handleSelectAll}
                                className="h-5 w-5 rounded border-gray-400 text-primary focus:ring-primary"
                                title="Select All Visible"
                            />
                        </div>
                        <p className="font-semibold text-primary">{selectedCandidateIds.size} candidate(s) selected</p>
                    </div>
                    <button
                        onClick={() => downloadCsv(selectedCandidates)}
                        disabled={selectedCandidates.length === 0 || isRecruiter}
                        className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={isRecruiter ? 'Admin permission required' : 'Export selected to CSV'}
                    >
                        <Download size={18} />
                        <span>Export Selected</span>
                    </button>
                </div>
            )}
            
             {/* Filters & Search Section */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <select value={filters.experience} onChange={e => handleFilterChange('experience', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="">All</option><option value="0-2">0 - 2</option><option value="3-5">3 - 5</option><option value="6-9">6 - 9</option><option value="10-">10+</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <select value={filters.jobType} onChange={e => handleFilterChange('jobType', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="">All</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option><option>Hybrid</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                         <input type="text" placeholder="e.g. Bangalore" value={filters.location} onChange={e => handleFilterChange('location', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current CTC</label>
                         <input type="text" placeholder="e.g. 15LPA" value={filters.ctc} onChange={e => handleFilterChange('ctc', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                 <div className="border-t border-gray-200 mt-4 pt-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Filter by name, skill, current role..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                     {isFiltersActive && (
                        <button onClick={clearFilters} className="flex-shrink-0 flex items-center space-x-2 text-gray-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 w-full sm:w-auto justify-center">
                            <X size={18} />
                            <span>Clear All</span>
                        </button>
                    )}
                 </div>
            </div>

            {filteredCandidates.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCandidates.map(candidate => (
                        <CandidateCard 
                            key={candidate.id} 
                            candidate={candidate} 
                            onEdit={() => onEditCandidate(candidate.id)} 
                            onDelete={() => onDeleteRequest(candidate)}
                            role={role}
                            isExpanded={expandedCardId === candidate.id}
                            onToggleExpand={() => setExpandedCardId(expandedCardId === candidate.id ? null : candidate.id)}
                            isSelected={selectedCandidateIds.has(candidate.id)}
                            onSelect={() => handleSelectCandidate(candidate.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg border">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-xl font-medium text-gray-900">No Candidates Found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {candidates.length > 0 ? "Your search and filters did not match any candidates." : "Upload a resume to get started."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CandidateSearch;
