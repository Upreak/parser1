
import React, { useState } from 'react';
import { Building, LogIn, Mail, Key } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await onLogin(username, password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
    // On success, the App component will handle the redirect.
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="inline-block p-4 bg-secondary rounded-full mb-4">
                 <Building className="h-10 w-10 text-primary" />
            </div>
          <h1 className="text-3xl font-bold text-primary">AI Recruitment Hub</h1>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="username"
                name="username"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
                </span>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
        </form>
         <p className="mt-4 text-center text-sm text-gray-500">
            Hint: Use `admin@example.com` and any password for the default account.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
