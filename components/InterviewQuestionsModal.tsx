
import React, { useState } from 'react';
import { type MatchedCandidate, type InterviewQuestions } from '../types';
import { X, Bot, Clipboard, Check, AlertTriangle } from 'lucide-react';

interface InterviewQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: MatchedCandidate | null;
    isLoading: boolean;
    questions: InterviewQuestions | null;
    error: string | null;
    onRetry: () => void;
}

const QuestionCategory: React.FC<{ title: string, questions: string[] }> = ({ title, questions }) => {
    if (!questions || questions.length === 0) return null;
    return (
        <div>
            <h3 className="text-md font-semibold text-primary mb-2 mt-4">{title}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
                {questions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
        </div>
    );
};

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i}>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        ))}
    </div>
);

const InterviewQuestionsModal: React.FC<InterviewQuestionsModalProps> = ({
    isOpen,
    onClose,
    candidate,
    isLoading,
    questions,
    error,
    onRetry
}) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!questions) return;
        const textToCopy = `
Interview Questions for ${candidate?.name}
=====================================

Technical Questions:
${(questions.technical || []).map(q => `- ${q}`).join('\n')}

Behavioral Questions:
${(questions.behavioral || []).map(q => `- ${q}`).join('\n')}

Situational Questions:
${(questions.situational || []).map(q => `- ${q}`).join('\n')}
        `.trim();
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <LoadingSkeleton />;
        }
        if (error) {
            return (
                <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-error mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">Generation Failed</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-4">{error}</p>
                    <button
                        onClick={onRetry}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        if (questions) {
            return (
                <div>
                    <QuestionCategory title="Technical Questions" questions={questions.technical} />
                    <QuestionCategory title="Behavioral Questions" questions={questions.behavioral} />
                    <QuestionCategory title="Situational Questions" questions={questions.situational} />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-full">
                            <Bot size={24} className="text-primary"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">AI-Generated Interview Questions</h2>
                            <p className="text-sm text-gray-500">For: {candidate?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto flex-grow">
                    {renderContent()}
                </main>

                <footer className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleCopy}
                        disabled={!questions || copied}
                        className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {copied ? <Check size={18} /> : <Clipboard size={18} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default InterviewQuestionsModal;
