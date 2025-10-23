
import React, { useState, useMemo } from 'react';
import { type Candidate, type PipelineStage, type PipelineSettings } from '../types';
import { Briefcase, Clock, GripVertical } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
    Sourced: 'bg-gray-200 text-gray-800',
    Screening: 'bg-blue-200 text-blue-800',
    Interview: 'bg-indigo-200 text-indigo-800',
    Offer: 'bg-amber-200 text-amber-800',
    Hired: 'bg-green-200 text-green-800',
    Rejected: 'bg-red-200 text-red-800',
};

const getStageColor = (stage: string) => {
    return STAGE_COLORS[stage] || 'bg-purple-200 text-purple-800'; // Default color for custom stages
};

interface CandidatePipelineProps {
    candidates: Candidate[];
    onStageUpdate: (candidateId: string, newStage: PipelineStage) => void;
    pipelineSettings: PipelineSettings;
}

const PipelineCard: React.FC<{ candidate: Candidate }> = ({ candidate }) => (
    <div 
        draggable="true" 
        onDragStart={(e) => {
            e.dataTransfer.setData('candidateId', candidate.id);
            e.currentTarget.style.opacity = '0.5';
        }}
        onDragEnd={(e) => {
             e.currentTarget.style.opacity = '1';
        }}
        className="p-3 bg-white rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing"
    >
        <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-800 text-sm">{candidate.name}</h4>
            <GripVertical size={16} className="text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {candidate.currentRole && <span className="flex items-center"><Briefcase size={12} className="mr-1"/>{candidate.currentRole}</span>}
            {candidate.totalExperience !== undefined && <span className="flex items-center"><Clock size={12} className="mr-1"/>{candidate.totalExperience} yrs</span>}
        </div>
    </div>
);

const PipelineColumn: React.FC<{
    stage: PipelineStage;
    candidates: Candidate[];
    isDraggedOver: boolean;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ stage, candidates, isDraggedOver, onDragOver, onDragLeave, onDrop }) => (
    <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-72 bg-gray-50 rounded-lg flex-shrink-0 transition-colors duration-300 ${isDraggedOver ? 'bg-secondary' : ''}`}
    >
        <div className="p-3 border-b border-gray-200 sticky top-0 bg-gray-50 rounded-t-lg z-10">
            <h3 className="font-semibold text-gray-700 flex items-center justify-between">
                <span>{stage}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStageColor(stage)}`}>
                    {candidates.length}
                </span>
            </h3>
        </div>
        <div className="p-3 space-y-3 h-full overflow-y-auto">
            {candidates.map(candidate => (
                <PipelineCard key={candidate.id} candidate={candidate} />
            ))}
            {candidates.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-md">
                    <p className="text-sm text-gray-500">Drop candidates here</p>
                </div>
            )}
        </div>
    </div>
);

const CandidatePipeline: React.FC<CandidatePipelineProps> = ({ candidates, onStageUpdate, pipelineSettings }) => {
    const [draggedOverColumn, setDraggedOverColumn] = useState<PipelineStage | null>(null);
    const stages = pipelineSettings.stages;

    const candidatesByStage = useMemo(() => {
        const grouped: Record<PipelineStage, Candidate[]> = {};
        stages.forEach(stage => {
            grouped[stage] = [];
        });

        candidates.forEach(c => {
            const stage = c.pipelineStage || stages[0] || 'Sourced';
            if (grouped[stage]) {
                grouped[stage].push(c);
            } else {
                // If a candidate has a stage that's no longer in settings, place them in the first stage
                grouped[stages[0]].push(c);
            }
        });
        return grouped;
    }, [candidates, stages]);
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: PipelineStage) => {
        e.preventDefault();
        const candidateId = e.dataTransfer.getData('candidateId');
        if (candidateId) {
            onStageUpdate(candidateId, stage);
        }
        setDraggedOverColumn(null);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Hiring Pipeline</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
                {stages.map(stage => (
                    <PipelineColumn
                        key={stage}
                        stage={stage}
                        candidates={candidatesByStage[stage] || []}
                        isDraggedOver={draggedOverColumn === stage}
                        onDragOver={(e) => { e.preventDefault(); setDraggedOverColumn(stage); }}
                        onDragLeave={() => setDraggedOverColumn(null)}
                        onDrop={(e) => handleDrop(e, stage)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CandidatePipeline;
