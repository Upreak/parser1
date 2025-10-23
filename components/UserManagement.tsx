
import React, { useState } from 'react';
import { type User } from '../types';
import { PenSquare, Trash2, UserPlus, Users, Key, Mail } from 'lucide-react';
import Modal from './Modal';

interface UserManagementProps {
    users: User[];
    onAddUser: (username: string, password: string) => Promise<boolean>;
    onDeleteUser: (userId: string) => Promise<void>;
    addToast: (type: 'success' | 'error', message: string) => void;
    currentUser: User;
}

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (username: string, password: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setUsername('');
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleSave = () => {
        let errors: string[] = [];
        if (!username.trim()) {
            errors.push('Email address is required.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
            errors.push('Please enter a valid email address.');
        }
        if (!password.trim()) {
            errors.push('Password is required.');
        } else if (password.length < 6) {
            errors.push('Password must be at least 6 characters long.');
        }
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return;
        }

        onSave(username, password);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleSave}
            title='Add New Recruiter'
            confirmText='Create User'
            icon={<UserPlus className="h-6 w-6 text-primary" />}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Recruiter's Email (Username)</label>
                    <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input
                            type="email"
                            placeholder="recruiter@example.com"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Initial Password</label>
                    <div className="relative mt-1">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        </Modal>
    );
};

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser, addToast, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const recruiters = users.filter(u => u.role === 'Recruiter');

    const handleSaveUser = async (username: string, password: string) => {
        const success = await onAddUser(username, password);
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleDeleteUser = async () => {
        if (userToDelete) {
            await onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recruiter Accounts</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                    <UserPlus size={18} />
                    <span>Add Recruiter</span>
                </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username (Email)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recruiters.length > 0 ? recruiters.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => setUserToDelete(user)} className="p-2 text-gray-500 hover:text-error hover:bg-red-100 rounded-full transition-colors" title="Delete User">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                           <tr>
                                <td colSpan={3} className="text-center py-10 px-6 text-gray-500">
                                     <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                    No recruiters found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
            />

            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Confirm Deletion"
                confirmText="Delete"
                confirmVariant="danger"
            >
                <p>Are you sure you want to delete the user <span className="font-bold">{userToDelete?.username}</span>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default UserManagement;
