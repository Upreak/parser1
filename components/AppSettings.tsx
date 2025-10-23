
import React, { useState } from 'react';
import { type PipelineSettings, type PipelineStage } from '../types';
import { PlusCircle, PenSquare, Trash2, Save, X } from 'lucide-react';
import Modal from './Modal';

interface AppSettingsProps {
    settings: PipelineSettings;
    onUpdate: (settings: PipelineSettings) => void;
    addToast: (type: 'success' | 'error', message: string) => void;
}

const AppSettings: React.FC<AppSettingsProps> = ({ settings, onUpdate, addToast }) => {
    const [newStageName, setNewStageName] = useState('');
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
    const [editingName, setEditingName] = useState('');
    const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null);
    
    const handleAddStage = () => {
        if (!newStageName.trim()) {
            addToast('error', 'Stage name cannot be empty.');
            return;
        }
        if (settings.stages.includes(newStageName.trim())) {
            addToast('error', 'Stage name already exists.');
            return;
        }
        onUpdate({ ...settings, stages: [...settings.stages, newStageName.trim()] });
        setNewStageName('');
        addToast('success', 'New pipeline stage added.');
    };

    const handleStartEdit = (stage: PipelineStage) => {
        setEditingStage(stage);
        setEditingName(stage);
    };

    const handleSaveEdit = () => {
        if (!editingName.trim()) {
            addToast('error', 'Stage name cannot be empty.');
            return;
        }
        if (settings.stages.includes(editingName.trim()) && editingName.trim() !== editingStage) {
            addToast('error', 'Stage name already exists.');
            return;
        }
        
        const updatedStages = settings.stages.map(s => (s === editingStage ? editingName.trim() : s));
        onUpdate({ ...settings, stages: updatedStages });
        setEditingStage(null);
        setEditingName('');
        addToast('success', 'Stage renamed successfully.');
    };

    const handleDeleteStage = () => {
        if (stageToDelete) {
            if (settings.stages.length <= 2) {
                addToast('error', 'You must have at least two pipeline stages.');
                setStageToDelete(null);
                return;
            }
            const updatedStages = settings.stages.filter(s => s !== stageToDelete);
            onUpdate({ ...settings, stages: updatedStages });
            addToast('success', `Stage '${stageToDelete}' deleted.`);
            setStageToDelete(null);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Settings</h2>
            
            <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-white">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Customize Hiring Pipeline Stages</h3>
                
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newStageName}
                        onChange={e => setNewStageName(e.target.value)}
                        placeholder="Enter new stage name"
                        className="flex-grow p-2 border border-gray-300 rounded-md"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                    />
                    <button onClick={handleAddStage} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                        <PlusCircle size={18} /> Add Stage
                    </button>
                </div>

                <div className="space-y-2">
                    {settings.stages.map(stage => (
                        <div key={stage} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                            {editingStage === stage ? (
                                <div className="flex-grow flex gap-2">
                                    <input 
                                        type="text"
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        className="flex-grow p-1 border border-primary rounded-md"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    />
                                    <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
                                    <button onClick={() => setEditingStage(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><X size={18} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-800">{stage}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleStartEdit(stage)} className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full" title="Rename Stage"><PenSquare size={18} /></button>
                                        <button onClick={() => setStageToDelete(stage)} className="p-2 text-gray-500 hover:text-error hover:bg-red-100 rounded-full" title="Delete Stage"><Trash2 size={18} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Modal
                isOpen={!!stageToDelete}
                onClose={() => setStageToDelete(null)}
                onConfirm={handleDeleteStage}
                title="Confirm Deletion"
                confirmText="Delete"
                confirmVariant="danger"
            >
                <p>Are you sure you want to delete the stage <span className="font-bold">{stageToDelete}</span>? This could affect candidates currently in this stage.</p>
            </Modal>
        </div>
    );
};

export default AppSettings;
