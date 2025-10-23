import React, { useState, useEffect } from 'react';
import { type AiProvider, type ProviderName } from '../types';
import Modal from './Modal';
import { Cpu } from 'lucide-react';

interface AiProviderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (provider: Partial<AiProvider>) => void;
    providerToEdit: Partial<AiProvider> | null;
}

const DEFAULT_SETTINGS: Record<ProviderName, Partial<AiProvider>> = {
    'Google Gemini': { baseURL: '', parsingModel: 'gemini-2.5-flash', matchingModel: 'gemini-2.5-pro' },
    'OpenRouter': { baseURL: 'https://openrouter.ai/api/v1', parsingModel: 'google/gemini-flash-1.5', matchingModel: 'google/gemini-pro-1.5' },
    'Together AI': { baseURL: 'https://api.together.xyz/v1', parsingModel: 'google/gemini-1.5-flash', matchingModel: 'google/gemini-1.5-pro' }
};

const AiProviderFormModal: React.FC<AiProviderFormModalProps> = ({ isOpen, onClose, onSave, providerToEdit }) => {
    const [formData, setFormData] = useState<Partial<AiProvider>>({});
    const [errors, setErrors] = useState<Partial<Record<keyof AiProvider, string>>>({});
    const isEditMode = !!providerToEdit?.id;

    useEffect(() => {
        if (isOpen) {
            // When opening the modal, set initial form data.
            // In "edit" mode, we spread the providerToEdit data but explicitly clear the
            // apiKey field. This prevents the masked key from being displayed or accidentally
            // re-saved, breaking the actual key on the backend. The user must enter a new key to update it.
            const initialData: Partial<AiProvider> = providerToEdit?.id
                ? { ...providerToEdit, apiKey: '' }
                : { name: 'Google Gemini', ...DEFAULT_SETTINGS['Google Gemini'], apiKey: '' };
            
            setFormData(initialData);
            setErrors({});
        }
    }, [isOpen, providerToEdit]);

    const handleProviderNameChange = (name: ProviderName) => {
        const defaults = DEFAULT_SETTINGS[name];
        setFormData(prev => ({
            ...prev,
            name,
            baseURL: defaults.baseURL,
            parsingModel: defaults.parsingModel,
            matchingModel: defaults.matchingModel
        }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof AiProvider, string>> = {};
        if (!formData.name) newErrors.name = 'Provider name is required.';
        // In edit mode, API key is not required (it can be left blank to keep the existing one)
        if (!isEditMode && !formData.apiKey?.trim()) newErrors.apiKey = 'API Key is required.';
        if (!formData.parsingModel?.trim()) newErrors.parsingModel = 'Parsing model is required.';
        if (!formData.matchingModel?.trim()) newErrors.matchingModel = 'Matching model is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(formData);
        }
    };
    
    const FormField: React.FC<{ label: string, children: React.ReactNode, error?: string, hint?: string }> = ({ label, children, error, hint }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleSave}
            title={isEditMode ? 'Edit AI Provider' : 'Add New AI Provider'}
            confirmText="Save Provider"
            icon={<Cpu className="h-6 w-6 text-primary" />}
        >
            <div className="space-y-4">
                <FormField label="Provider Name*" error={errors.name}>
                    <select
                        value={formData.name || ''}
                        onChange={(e) => handleProviderNameChange(e.target.value as ProviderName)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        disabled={isEditMode}
                    >
                        <option>Google Gemini</option>
                        <option>OpenRouter</option>
                        <option>Together AI</option>
                    </select>
                </FormField>

                <FormField label={`API Key${isEditMode ? '' : '*'}`} error={errors.apiKey} hint={isEditMode ? "Leave blank to keep the existing key." : "Your key will be securely stored on the backend."}>
                    <input
                        type="password"
                        placeholder={isEditMode ? "Enter new key to update" : "sk-..."}
                        value={formData.apiKey || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </FormField>

                {formData.name !== 'Google Gemini' && (
                    <FormField label="Base URL" error={errors.baseURL}>
                         <input
                            type="text"
                            value={formData.baseURL || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, baseURL: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </FormField>
                )}

                 <FormField label="Resume Parsing Model*" error={errors.parsingModel}>
                     <input
                        type="text"
                        value={formData.parsingModel || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, parsingModel: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-mono"
                    />
                </FormField>
                
                 <FormField label="JD Matching Model*" error={errors.matchingModel}>
                     <input
                        type="text"
                        value={formData.matchingModel || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, matchingModel: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-mono"
                    />
                </FormField>
            </div>
        </Modal>
    );
};

export default AiProviderFormModal;