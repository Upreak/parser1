
import React, { useState } from 'react';
import { type AiProvider } from '../types';
import { PlusCircle, PenSquare, Trash2, CheckCircle, Power } from 'lucide-react';
import Modal from './Modal';
import AiProviderFormModal from './AiProviderFormModal';

interface AiProviderSettingsProps {
    providers: AiProvider[];
    activeProviderId: string | null;
    onSaveProvider: (provider: Partial<AiProvider>) => Promise<void>;
    onDeleteProvider: (providerId: string) => Promise<void>;
    onActiveProviderChange: (providerId: string) => void;
    addToast: (type: 'success' | 'error', message: string) => void;
}

const AiProviderSettings: React.FC<AiProviderSettingsProps> = ({ providers, activeProviderId, onSaveProvider, onDeleteProvider, onActiveProviderChange, addToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState<Partial<AiProvider> | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<AiProvider | null>(null);

    const handleAddProvider = () => {
        setProviderToEdit({});
        setIsModalOpen(true);
    };

    const handleEditProvider = (provider: AiProvider) => {
        setProviderToEdit(provider);
        setIsModalOpen(true);
    };

    const handleSaveProvider = async (providerData: Partial<AiProvider>) => {
        try {
            await onSaveProvider(providerData);
            setIsModalOpen(false);
            setProviderToEdit(null);
        } catch (error) {
            // Error toast is already shown in App.tsx, but we catch here to prevent modal from closing on failure
            console.error("Failed to save provider:", error);
        }
    };
    
    const handleDeleteProvider = async () => {
        if (providerToDelete) {
            if (providerToDelete.id === activeProviderId) {
                addToast('error', "Cannot delete the currently active provider.");
                setProviderToDelete(null);
                return;
            }
            try {
                await onDeleteProvider(providerToDelete.id);
                setProviderToDelete(null);
            } catch (error) {
                 console.error("Failed to delete provider:", error);
            }
        }
    };
    
    const handleSetActive = (providerId: string) => {
        onActiveProviderChange(providerId);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">AI Service Providers</h2>
                <button onClick={handleAddProvider} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                    <PlusCircle size={18} />
                    <span>Add Provider</span>
                </button>
            </div>
             <div className="space-y-4">
                {providers.map(provider => {
                    const isActive = provider.id === activeProviderId;
                    return (
                        <div key={provider.id} className={`p-4 border rounded-lg transition-all ${isActive ? 'bg-green-50 border-green-400 shadow-md' : 'bg-white border-gray-200'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
                                        {isActive && <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full"><CheckCircle size={14}/> Active</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Parsing Model: <span className="font-mono bg-gray-100 px-1 rounded">{provider.parsingModel}</span></p>
                                    <p className="text-sm text-gray-500">Matching Model: <span className="font-mono bg-gray-100 px-1 rounded">{provider.matchingModel}</span></p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                                    {!isActive && (
                                        <button onClick={() => handleSetActive(provider.id)} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 w-full bg-accent text-white px-3 py-2 text-sm rounded-md font-semibold hover:bg-emerald-600 transition-colors">
                                            <Power size={16} /> Set Active
                                        </button>
                                    )}
                                    <button onClick={() => handleEditProvider(provider)} className="p-2 text-gray-500 hover:text-primary hover:bg-secondary rounded-full transition-colors" title="Edit Provider"><PenSquare size={18} /></button>
                                    <button onClick={() => setProviderToDelete(provider)} className="p-2 text-gray-500 hover:text-error hover:bg-red-100 rounded-full transition-colors" title="Delete Provider"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>

            <AiProviderFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProvider}
                providerToEdit={providerToEdit}
            />

            <Modal
                isOpen={!!providerToDelete}
                onClose={() => setProviderToDelete(null)}
                onConfirm={handleDeleteProvider}
                title="Confirm Deletion"
                confirmText="Delete"
                confirmVariant="danger"
            >
                <p>Are you sure you want to delete the provider <span className="font-bold">{providerToDelete?.name}</span>?</p>
            </Modal>
        </div>
    );
};

export default AiProviderSettings;
