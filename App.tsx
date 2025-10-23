
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ResumeUpload from './components/ResumeUpload';
import CandidateSearch from './components/CandidateSearch';
import JdMatcher from './components/JdMatcher';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';
import { type Candidate, type User, type Toast, type AiProvider, Role, PipelineStage, PipelineSettings } from './types';
import { UploadCloud, Users, Briefcase, AlertTriangle, Shield, LayoutGrid, Loader2 } from 'lucide-react';
import ToastContainer from './components/ToastContainer';
import CandidatePipeline from './components/CandidatePipeline';


enum Tab {
  UPLOAD = 'UPLOAD',
  SEARCH = 'SEARCH',
  MATCH = 'MATCH',
  PIPELINE = 'PIPELINE',
  ADMIN = 'ADMIN',
}

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = ['Sourced', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const API_BASE_URL = 'http://localhost:3001/api';

const getApiErrorMessage = (error: unknown): string => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return 'Connection to backend failed. Please ensure the server is running.';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown server error occurred.';
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.UPLOAD);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(() => localStorage.getItem('companyLogo'));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  const [pipelineSettings, setPipelineSettings] = useState<PipelineSettings>(() => {
      try {
        const storedSettings = localStorage.getItem('pipelineSettings');
        return storedSettings ? JSON.parse(storedSettings) : { stages: DEFAULT_PIPELINE_STAGES };
      } catch (error) {
        console.error("Failed to parse pipeline settings", error);
        return { stages: DEFAULT_PIPELINE_STAGES };
      }
  });
  
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  };

  // SECTION: Initialization and Session Management Effects
  useEffect(() => {
    const initializeApp = async () => {
        if (authToken) {
            // Validate token and fetch initial data
            setIsDataLoading(true);
            try {
                const headers = getAuthHeaders();
                // Fetch Users
                const usersRes = await fetch(`${API_BASE_URL}/users`, { headers });
                if (!usersRes.ok) throw new Error('Session expired or invalid.');
                const usersData = await usersRes.json();
                setUsers(usersData);

                // Fetch Candidates
                const candidatesRes = await fetch(`${API_BASE_URL}/candidates`, { headers });
                const candidatesData = await candidatesRes.json();
                setCandidates(candidatesData);

                // Fetch AI Providers
                const providersRes = await fetch(`${API_BASE_URL}/ai-providers`, { headers });
                const providersData = await providersRes.json();
                setAiProviders(providersData.providers);
                setActiveProviderId(providersData.activeProviderId);

                // Set current user from session
                 const sessionUser = sessionStorage.getItem('currentUser');
                 if (sessionUser) {
                    setCurrentUser(JSON.parse(sessionUser));
                 } else {
                    // This case happens if session storage is cleared but local storage (token) is not.
                    // We should log out to re-sync.
                    handleLogout();
                 }

            } catch (error) {
                console.error("Failed to initialize app data", error);
                addToast('error', getApiErrorMessage(error));
                handleLogout(); // Log out if any fetch fails
            } finally {
                setIsDataLoading(false);
            }
        } else {
            setIsDataLoading(false); // No token, no data to load
        }
    };
    
    initializeApp();
  }, [authToken]);


  // SECTION: localStorage Persistence Effects (non-backend data)
  useEffect(() => {
    if (logoSrc) {
        localStorage.setItem('companyLogo', logoSrc);
    }
  }, [logoSrc]);

  useEffect(() => {
    localStorage.setItem('pipelineSettings', JSON.stringify(pipelineSettings));
  }, [pipelineSettings]);


  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 6000);
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed.');
        }
        const { token, user } = await response.json();
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        setAuthToken(token);
        setCurrentUser(user);
        addToast('success', `Welcome, ${user.username}!`);
        return true;
    } catch (error) {
        addToast('error', getApiErrorMessage(error));
        return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    addToast('success', 'You have been logged out.');
  };

  const saveCandidate = async (candidate: Candidate) => {
    const isUpdating = !!candidate.id;
    const url = isUpdating ? `${API_BASE_URL}/candidates/${candidate.id}` : `${API_BASE_URL}/candidates`;
    const method = isUpdating ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(candidate),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save candidate.');
        }

        const savedCandidate = await response.json();

        if (isUpdating) {
            setCandidates(prev => prev.map(c => c.id === savedCandidate.id ? savedCandidate : c));
            addToast('success', 'Candidate updated successfully!');
        } else {
            setCandidates(prev => [...prev, savedCandidate]);
            addToast('success', 'New candidate added successfully!');
        }
        setEditingCandidate(null);
        setActiveTab(Tab.SEARCH);

    } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
    }
  };
  
  const handleStartEdit = (candidateId: string) => {
    const candidateToEdit = candidates.find(c => c.id === candidateId);
    if (candidateToEdit) {
        setEditingCandidate(candidateToEdit);
        setActiveTab(Tab.UPLOAD);
    }
  };

  const handleCancelEdit = () => {
      setEditingCandidate(null);
      setActiveTab(Tab.SEARCH);
  };
  
  const handleDeleteRequest = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
  };

  const handleConfirmDelete = async () => {
    if (candidateToDelete) {
      try {
        const response = await fetch(`${API_BASE_URL}/candidates/${candidateToDelete.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok && response.status !== 204) {
             throw new Error('Failed to delete candidate on the server.');
        }
        setCandidates(prev => prev.filter(c => c.id !== candidateToDelete.id));
        addToast('success', `Candidate '${candidateToDelete.name}' has been deleted.`);
      } catch (error) {
         addToast('error', `Error: ${getApiErrorMessage(error)}`);
      } finally {
        setCandidateToDelete(null);
      }
    }
  };

  const handleAddUser = async (username: string, password: string): Promise<boolean> => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user.');
        }
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        addToast('success', `User '${username}' created successfully.`);
        return true;
      } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
        return false;
      }
  };

  const handleDeleteUser = async (userId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to delete user on the server.');
        }
        const deletedUser = users.find(u => u.id === userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        addToast('success', `User '${deletedUser?.username}' has been deleted.`);
      } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
      }
  };
  
  const refetchProviders = async () => {
     try {
        const providersRes = await fetch(`${API_BASE_URL}/ai-providers`, { headers: getAuthHeaders() });
        if (!providersRes.ok) throw new Error('Failed to refetch providers');
        const providersData = await providersRes.json();
        setAiProviders(providersData.providers);
        setActiveProviderId(providersData.activeProviderId);
     } catch (error) {
        addToast('error', `Error syncing providers: ${getApiErrorMessage(error)}`);
     }
  };

  const handleSaveProvider = async (provider: Partial<AiProvider>) => {
    const isUpdating = !!provider.id;
    const url = isUpdating ? `${API_BASE_URL}/ai-providers/${provider.id}` : `${API_BASE_URL}/ai-providers`;
    const method = isUpdating ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(provider),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save AI provider.');
        }
        addToast('success', `Provider '${provider.name}' saved successfully.`);
        await refetchProviders(); // Re-sync state with backend
    } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
        throw error; // Re-throw to inform the calling component of failure
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-providers/${providerId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
         if (!response.ok && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete AI provider.');
        }
        addToast('success', `Provider deleted successfully.`);
        await refetchProviders();
    } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
        throw error;
    }
  };
  
  const handleActiveProviderChange = async (providerId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/ai-providers/active`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ providerId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to set active provider.');
        }
        setActiveProviderId(providerId);
        addToast('success', 'Active AI provider has been switched.');
      } catch (error) {
        addToast('error', `Error: ${getApiErrorMessage(error)}`);
      }
  };

  const handleCandidateStageUpdate = async (candidateId: string, newStage: PipelineStage) => {
    const candidateToUpdate = candidates.find(c => c.id === candidateId);
    if (!candidateToUpdate) return;
    
    // Optimistically update UI
    const originalCandidates = candidates;
    const updatedCandidates = originalCandidates.map(c =>
        c.id === candidateId
          ? { ...c, pipelineStage: newStage, lastUpdated: Date.now() }
          : c
    );
    setCandidates(updatedCandidates);
    
    // Send update to backend
    try {
        const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pipelineStage: newStage }),
        });
        if (!response.ok) {
            throw new Error('Failed to update stage on server.');
        }
        // The optimistic update is now confirmed. We could re-fetch or trust the update.
        addToast('success', 'Candidate stage updated.');
    } catch (error) {
        // Revert UI on failure
        setCandidates(originalCandidates);
        addToast('error', 'Failed to update candidate stage. Please try again.');
    }
  };


  if (!currentUser && !isDataLoading) {
    return <LoginPage onLogin={handleLogin} />;
  }
  
  if (isDataLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral text-primary">
            <Loader2 className="animate-spin" size={48} />
            <p className="mt-4 text-lg font-semibold">Loading Recruitment Hub...</p>
        </div>
    );
  }

  // This check prevents a flash of the main app if loading finishes but currentUser is not yet set.
  if (!currentUser) {
      return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.UPLOAD:
        return <ResumeUpload 
                    onSaveCandidate={saveCandidate} 
                    addToast={addToast} 
                    candidateToEdit={editingCandidate}
                    onCancelEdit={handleCancelEdit}
                />;
      case Tab.SEARCH:
        return <CandidateSearch candidates={candidates} role={currentUser.role} onEditCandidate={handleStartEdit} onDeleteRequest={handleDeleteRequest} />;
      case Tab.MATCH:
        return <JdMatcher candidates={candidates} addToast={addToast} role={currentUser.role} />;
      case Tab.PIPELINE:
        return <CandidatePipeline candidates={candidates} onStageUpdate={handleCandidateStageUpdate} pipelineSettings={pipelineSettings} />;
      case Tab.ADMIN:
        return currentUser.role === 'Admin' ? <AdminPanel 
                    users={users} 
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    aiProviders={aiProviders}
                    activeProviderId={activeProviderId}
                    onSaveProvider={handleSaveProvider}
                    onDeleteProvider={handleDeleteProvider}
                    onActiveProviderChange={handleActiveProviderChange}
                    addToast={addToast} 
                    currentUser={currentUser}
                    pipelineSettings={pipelineSettings}
                    onPipelineSettingsUpdate={setPipelineSettings}
                    /> : null;
      default:
        return <ResumeUpload 
                    onSaveCandidate={saveCandidate} 
                    addToast={addToast} 
                    candidateToEdit={editingCandidate}
                    onCancelEdit={handleCancelEdit}
                />;
    }
  };

  const TabButton = ({ tab, icon, label }: { tab: Tab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out font-medium ${
        activeTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-secondary hover:text-primary'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral text-gray-800">
      <Header logoSrc={logoSrc} setLogoSrc={setLogoSrc} user={currentUser} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <TabButton tab={Tab.UPLOAD} icon={<UploadCloud size={20} />} label="Add/Edit Candidate" />
              <TabButton tab={Tab.SEARCH} icon={<Users size={20} />} label="Search Candidates" />
              <TabButton tab={Tab.MATCH} icon={<Briefcase size={20} />} label="JD Matcher" />
              <TabButton tab={Tab.PIPELINE} icon={<LayoutGrid size={20} />} label="Pipeline" />
              {currentUser.role === 'Admin' && <TabButton tab={Tab.ADMIN} icon={<Shield size={20} />} label="Admin Panel" />}
            </nav>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
            {renderTabContent()}
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(toasts.filter(t => t.id !== id))} />
      <Modal 
        isOpen={!!candidateToDelete}
        onClose={() => setCandidateToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        confirmText="Delete"
        confirmVariant="danger"
        icon={<AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />}
      >
        <p className="text-sm text-gray-500">
            Are you sure you want to delete the profile for <span className="font-bold">{candidateToDelete?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default App;
