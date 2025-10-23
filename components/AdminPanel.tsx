
import React, { useState } from 'react';
import { type User, type AiProvider, type PipelineSettings } from '../types';
import { Users, Cpu, Settings } from 'lucide-react';
import UserManagement from './UserManagement';
import AiProviderSettings from './AiProviderSettings';
import AppSettings from './AppSettings';

interface AdminPanelProps {
    users: User[];
    onAddUser: (username: string, password: string) => Promise<boolean>;
    onDeleteUser: (userId: string) => Promise<void>;
    aiProviders: AiProvider[];
    activeProviderId: string | null;
    onSaveProvider: (provider: Partial<AiProvider>) => Promise<void>;
    onDeleteProvider: (providerId: string) => Promise<void>;
    onActiveProviderChange: (providerId: string) => Promise<void>;
    addToast: (type: 'success' | 'error', message: string) => void;
    currentUser: User;
    pipelineSettings: PipelineSettings;
    onPipelineSettingsUpdate: (settings: PipelineSettings) => void;
}

type AdminTab = 'users' | 'ai_providers' | 'settings';

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    const TabButton: React.FC<{tab: AdminTab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
                activeTab === tab 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-secondary hover:text-primary'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div>
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    <TabButton tab="users" label="Manage Users" icon={<Users size={18}/>} />
                    <TabButton tab="ai_providers" label="AI Provider Settings" icon={<Cpu size={18}/>} />
                    <TabButton tab="settings" label="Settings" icon={<Settings size={18}/>} />
                </nav>
            </div>

            {activeTab === 'users' && (
                <UserManagement 
                    users={props.users}
                    onAddUser={props.onAddUser}
                    onDeleteUser={props.onDeleteUser}
                    addToast={props.addToast}
                    currentUser={props.currentUser}
                />
            )}

            {activeTab === 'ai_providers' && (
                <AiProviderSettings 
                    providers={props.aiProviders}
                    activeProviderId={props.activeProviderId}
                    onSaveProvider={props.onSaveProvider}
                    onDeleteProvider={props.onDeleteProvider}
                    onActiveProviderChange={props.onActiveProviderChange}
                    addToast={props.addToast}
                />
            )}

            {activeTab === 'settings' && (
                <AppSettings
                    settings={props.pipelineSettings}
                    onUpdate={props.onPipelineSettingsUpdate}
                    addToast={props.addToast}
                />
            )}
        </div>
    );
};

export default AdminPanel;
