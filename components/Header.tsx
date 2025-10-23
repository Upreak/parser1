
import React, { useRef } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { type User } from '../types';
import { Upload, Building, UserCircle, LogOut } from 'lucide-react';

interface HeaderProps {
    logoSrc: string | null;
    setLogoSrc: (src: string) => void;
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ logoSrc, setLogoSrc, user, onLogout }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setLogoSrc(base64);
        }
    };

    const isAdmin = user.role === 'Admin';

    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                     {logoSrc ? (
                        <img src={logoSrc} alt="Company Logo" className="h-12 w-auto object-contain" />
                    ) : (
                        <div className="h-12 w-12 bg-secondary flex items-center justify-center rounded-lg">
                            <Building className="h-6 w-6 text-primary" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-primary">AI Recruitment Hub</h1>
                </div>
                <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-2">
                        <UserCircle className="text-gray-500" size={24} />
                        <div className="text-sm">
                            <p className="font-bold text-gray-800">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 bg-secondary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Admin permission required' : 'Upload company logo'}
                    >
                        <Upload size={18} />
                        <span>Upload Logo</span>
                    </button>
                     <button
                        onClick={onLogout}
                        className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;